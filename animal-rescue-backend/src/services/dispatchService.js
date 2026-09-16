const { calculateDistance } = require('../utils/distance');
const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const Escalation = require('../models/Escalation');
const notificationService = require('./notificationService');

// In-memory escalation timers (for active alerts)
const activeEscalationTimers = new Map();

const ESCALATION_TIMEOUT_MS = parseInt(process.env.ESCALATION_TIMEOUT_MS, 10) || 5 * 60 * 1000; // 5 minutes default
const MAX_DISPATCH_ATTEMPTS = 3;
const MAX_RADIUS_KM = 50;

/**
 * Calculate matching score for a rescuer against an emergency case
 * Weights:
 * - Proximity: 40%
 * - Availability: 30%
 * - Animal type capability: 20%
 * - Past response rate: 10%
 */
function calculateScore(rescuer, caseLocation, animalType) {
  const distance = calculateDistance(
    caseLocation.latitude,
    caseLocation.longitude,
    rescuer.location ? rescuer.location.latitude : null,
    rescuer.location ? rescuer.location.longitude : null
  );

  // 1. Proximity score (40%)
  const proxFactor = Math.max(0, 1 - distance / MAX_RADIUS_KM);
  const proximityPart = 0.40 * proxFactor;

  // 2. Availability score (30%)
  const isAvailable = Boolean(rescuer.available && !rescuer.activeCaseId);
  const availabilityPart = 0.30 * (isAvailable ? 1.0 : 0.0);

  // 3. Animal capability score (20%)
  const handlesAnimal =
    Array.isArray(rescuer.animalsHandled) &&
    rescuer.animalsHandled.some(
      (type) => type.toLowerCase() === (animalType || '').toLowerCase()
    );
  const capabilityPart = 0.20 * (handlesAnimal ? 1.0 : 0.0);

  // 4. Past response rate score (10%)
  let responseRate = 0.5; // default neutral
  if (typeof rescuer.responseRate === 'number') {
    responseRate = Math.min(1, Math.max(0, rescuer.responseRate));
  } else if (rescuer.completedCasesCount !== undefined) {
    responseRate = rescuer.completedCasesCount > 0 ? 0.9 : 0.5;
  }
  const responseRatePart = 0.10 * responseRate;

  const totalScore = Number(
    (proximityPart + availabilityPart + capabilityPart + responseRatePart).toFixed(3)
  );

  return {
    totalScore,
    distance,
    breakdown: {
      proximity: Number(proximityPart.toFixed(3)),
      availability: Number(availabilityPart.toFixed(3)),
      capability: Number(capabilityPart.toFixed(3)),
      responseRate: Number(responseRatePart.toFixed(3)),
    },
  };
}

/**
 * Rank a list of rescuers for a case
 */
function rankRescuers(rescuers, caseLocation, animalType) {
  return rescuers
    .map((rescuer) => {
      const scoring = calculateScore(rescuer, caseLocation, animalType);
      return {
        rescuer,
        ...scoring,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Dispatches an emergency case to the best available rescuer
 */
async function dispatchCase(caseId, attemptNumber = 1) {
  try {
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc || ['accepted', 'completed', 'cancelled'].includes(caseDoc.status)) {
      return null;
    }

    if (attemptNumber > MAX_DISPATCH_ATTEMPTS) {
      // Escalate to coordinator
      caseDoc.status = 'reported'; // Keep open for manual intervention
      caseDoc.timeline.push({
        status: 'escalated_to_coordinator',
        timestamp: new Date(),
        note: `Exceeded ${MAX_DISPATCH_ATTEMPTS} automated dispatch attempts. Coordinator alerted.`,
      });
      await caseDoc.save();
      await notificationService.notifyCoordinatorEscalation(
        caseDoc,
        `All ${MAX_DISPATCH_ATTEMPTS} responder attempts exhausted.`
      );
      return null;
    }

    // Find previous attempts to exclude already contacted rescuers
    const previousEscalations = await Escalation.find({ caseId });
    const contactedRescuerIds = previousEscalations.map((e) => e.rescuerId.toString());

    // Fetch all eligible rescuers
    const allRescuers = await Rescuer.find({
      _id: { $nin: contactedRescuerIds },
      available: true,
      activeCaseId: null,
    }).populate('user', 'name phone');

    // Rank candidates
    const ranked = rankRescuers(allRescuers, caseDoc.location, caseDoc.animalType);

    if (ranked.length === 0) {
      caseDoc.timeline.push({
        status: 'escalated_to_coordinator',
        timestamp: new Date(),
        note: `No available rescuers found in range. Escalated to Emergency Coordinator.`,
      });
      await caseDoc.save();
      await notificationService.notifyCoordinatorEscalation(
        caseDoc,
        'No available rescuers found for this animal type and location.'
      );
      return null;
    }

    const best = ranked[0];
    const selectedRescuer = best.rescuer;

    // Update case
    caseDoc.assignedRescuer = selectedRescuer._id;
    caseDoc.status = 'assigned';
    caseDoc.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      note: `Attempt #${attemptNumber}: Assigned to ${selectedRescuer.organizationName || 'Rescuer'} (Score: ${best.totalScore}, Distance: ${best.distance}km)`,
    });
    await caseDoc.save();

    // Log escalation attempt
    const escalationLog = await Escalation.create({
      caseId: caseDoc._id,
      attemptNumber,
      rescuerId: selectedRescuer._id,
      alertedAt: new Date(),
      status: 'pending',
    });

    // Notify rescuer
    await notificationService.notifyRescuerNewCase(selectedRescuer, caseDoc, best);

    // Clear existing timer if any
    if (activeEscalationTimers.has(caseDoc._id.toString())) {
      clearTimeout(activeEscalationTimers.get(caseDoc._id.toString()));
    }

    // Set 5-minute escalation timer
    const timer = setTimeout(async () => {
      try {
        const currentCase = await Case.findById(caseDoc._id);
        if (currentCase && currentCase.status === 'assigned') {
          console.log(`[ESCALATION TIMEOUT] Rescuer ${selectedRescuer._id} did not respond in 5 minutes for Case ${caseDoc._id}`);
          escalationLog.status = 'timeout';
          await escalationLog.save();

          // Trigger next attempt
          await dispatchCase(caseDoc._id, attemptNumber + 1);
        }
      } catch (timeoutErr) {
        console.error('Error during escalation timeout:', timeoutErr);
      }
    }, ESCALATION_TIMEOUT_MS);

    activeEscalationTimers.set(caseDoc._id.toString(), timer);

    return {
      selectedRescuer,
      score: best.totalScore,
      distance: best.distance,
      attemptNumber,
    };
  } catch (err) {
    console.error('Error in dispatchCase:', err);
    throw err;
  }
}

/**
 * Rescuer accepts the assigned case
 */
async function handleRescuerAccept(caseId, rescuerId) {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    throw new Error('Case not found');
  }

  // Clear escalation timer
  if (activeEscalationTimers.has(caseId.toString())) {
    clearTimeout(activeEscalationTimers.get(caseId.toString()));
    activeEscalationTimers.delete(caseId.toString());
  }

  caseDoc.status = 'accepted';
  caseDoc.assignedRescuer = rescuerId;
  caseDoc.timeline.push({
    status: 'accepted',
    timestamp: new Date(),
    note: 'Rescuer accepted the rescue assignment',
  });
  await caseDoc.save();

  // Mark rescuer busy
  await Rescuer.findByIdAndUpdate(rescuerId, {
    activeCaseId: caseDoc._id,
    available: false,
  });

  // Update escalation log
  await Escalation.findOneAndUpdate(
    { caseId, rescuerId, status: 'pending' },
    { status: 'accepted' }
  );

  // Notify citizen
  await notificationService.notifyCitizenStatusUpdate(caseDoc, 'Rescuer has accepted your request!');

  return caseDoc;
}

/**
 * Rescuer declines the assigned case
 */
async function handleRescuerDecline(caseId, rescuerId, reason = 'Rescuer declined') {
  const caseDoc = await Case.findById(caseId);
  if (!caseDoc) {
    throw new Error('Case not found');
  }

  // Clear escalation timer
  if (activeEscalationTimers.has(caseId.toString())) {
    clearTimeout(activeEscalationTimers.get(caseId.toString()));
    activeEscalationTimers.delete(caseId.toString());
  }

  // Mark escalation log as declined
  const prevEscalation = await Escalation.findOneAndUpdate(
    { caseId, rescuerId, status: 'pending' },
    { status: 'declined', note: reason }
  );

  const nextAttempt = prevEscalation ? prevEscalation.attemptNumber + 1 : 2;

  caseDoc.timeline.push({
    status: 'declined',
    timestamp: new Date(),
    note: `Rescuer declined: ${reason}. Escalating to next suitable responder.`,
  });
  await caseDoc.save();

  // Immediately dispatch to next best candidate
  return await dispatchCase(caseId, nextAttempt);
}

module.exports = {
  calculateScore,
  rankRescuers,
  dispatchCase,
  handleRescuerAccept,
  handleRescuerDecline,
  activeEscalationTimers,
};

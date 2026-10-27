const { calculateDistance } = require('../utils/distance');
const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const Escalation = require('../models/Escalation');
const notificationService = require('./notificationService');
const {
  isDbConnected,
  getCase,
  updateCase,
  getAllRescuers,
  updateRescuer,
  saveEscalation,
  findEscalationsByCaseId,
  updateEscalation,
} = require('../utils/devStore');

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
    const caseDoc = isDbConnected() ? await Case.findById(caseId) : getCase(caseId);
    if (!caseDoc || ['accepted', 'completed', 'cancelled'].includes(caseDoc.status)) {
      return null;
    }

    if (attemptNumber > MAX_DISPATCH_ATTEMPTS) {
      // Escalate to coordinator
      const note = `Exceeded ${MAX_DISPATCH_ATTEMPTS} automated dispatch attempts. Coordinator alerted.`;
      if (isDbConnected()) {
        caseDoc.status = 'reported'; // Keep open for manual intervention
        caseDoc.assignedRescuer = null;
        caseDoc.timeline.push({
          status: 'escalated_to_coordinator',
          timestamp: new Date(),
          note,
        });
        await caseDoc.save();

        // Log coordinator escalation attempt in persistent escalation collection
        await Escalation.create({
          caseId: caseDoc._id,
          attemptNumber,
          alertedAt: new Date(),
          expiresAt: new Date(),
          status: 'coordinator_escalated',
          note,
        });
      } else {
        updateCase(caseDoc._id, {
          status: 'reported',
          assignedRescuer: null,
          timeline: [{ status: 'escalated_to_coordinator', timestamp: new Date(), note }],
        });
        saveEscalation({
          caseId: caseDoc._id,
          attemptNumber,
          alertedAt: new Date(),
          expiresAt: new Date(),
          status: 'coordinator_escalated',
          note,
        });
      }

      await notificationService.notifyCoordinatorEscalation(
        caseDoc,
        `All ${MAX_DISPATCH_ATTEMPTS} responder attempts exhausted.`
      );
      return null;
    }

    // Find previous attempts to exclude already contacted rescuers
    let contactedRescuerIds = [];
    if (isDbConnected()) {
      const previousEscalations = await Escalation.find({ caseId });
      contactedRescuerIds = previousEscalations
        .map((e) => (e.rescuerId ? e.rescuerId.toString() : null))
        .filter(Boolean);
    } else {
      const previousEscalations = findEscalationsByCaseId(caseId);
      contactedRescuerIds = previousEscalations
        .map((e) => (e.rescuerId ? e.rescuerId.toString() : null))
        .filter(Boolean);
    }

    // Fetch all eligible rescuers
    let allRescuers = [];
    if (isDbConnected()) {
      allRescuers = await Rescuer.find({
        _id: { $nin: contactedRescuerIds },
        available: true,
        activeCaseId: null,
      }).populate('user', 'name phone');
    } else {
      allRescuers = getAllRescuers().filter(
        (r) => !contactedRescuerIds.includes(String(r._id)) && r.available && !r.activeCaseId
      );
    }

    // Rank candidates
    const ranked = rankRescuers(allRescuers, caseDoc.location, caseDoc.animalType);

    if (ranked.length === 0) {
      const note = `No available rescuers found in range. Escalated to Emergency Coordinator.`;
      if (isDbConnected()) {
        caseDoc.timeline.push({
          status: 'escalated_to_coordinator',
          timestamp: new Date(),
          note,
        });
        await caseDoc.save();

        await Escalation.create({
          caseId: caseDoc._id,
          attemptNumber,
          alertedAt: new Date(),
          expiresAt: new Date(),
          status: 'coordinator_escalated',
          note: 'No available rescuers found for this animal type and location.',
        });
      } else {
        updateCase(caseDoc._id, {
          timeline: [{ status: 'escalated_to_coordinator', timestamp: new Date(), note }],
        });
        saveEscalation({
          caseId: caseDoc._id,
          attemptNumber,
          alertedAt: new Date(),
          expiresAt: new Date(),
          status: 'coordinator_escalated',
          note: 'No available rescuers found for this animal type and location.',
        });
      }

      await notificationService.notifyCoordinatorEscalation(
        caseDoc,
        'No available rescuers found for this animal type and location.'
      );
      return null;
    }

    const best = ranked[0];
    const selectedRescuer = best.rescuer;
    const assignNote = `Attempt #${attemptNumber}: Assigned to ${selectedRescuer.organizationName || 'Rescuer'} (Score: ${best.totalScore}, Distance: ${best.distance}km)`;
    const expiresAt = new Date(Date.now() + ESCALATION_TIMEOUT_MS);

    // Update case & log escalation attempt
    let escalationLog;
    if (isDbConnected()) {
      caseDoc.assignedRescuer = selectedRescuer._id;
      caseDoc.status = 'assigned';
      caseDoc.timeline.push({
        status: 'assigned',
        timestamp: new Date(),
        note: assignNote,
      });
      await caseDoc.save();

      escalationLog = await Escalation.create({
        caseId: caseDoc._id,
        attemptNumber,
        rescuerId: selectedRescuer._id,
        alertedAt: new Date(),
        expiresAt,
        status: 'pending',
      });
    } else {
      updateCase(caseDoc._id, {
        assignedRescuer: selectedRescuer._id,
        status: 'assigned',
        timeline: [{ status: 'assigned', timestamp: new Date(), note: assignNote }],
      });
      escalationLog = saveEscalation({
        caseId: caseDoc._id,
        attemptNumber,
        rescuerId: selectedRescuer._id,
        alertedAt: new Date(),
        expiresAt,
        status: 'pending',
      });
    }

    // Notify rescuer
    await notificationService.notifyRescuerNewCase(selectedRescuer, caseDoc, best);

    // Clear existing in-memory timer if any
    if (activeEscalationTimers.has(caseDoc._id.toString())) {
      clearTimeout(activeEscalationTimers.get(caseDoc._id.toString()));
    }

    // Set 5-minute escalation timer (uses atomic transition so background processor and timer never collide)
    const timer = setTimeout(async () => {
      try {
        const { handleExpiredEscalation } = require('./escalationProcessor');
        if (isDbConnected()) {
          const claimed = await Escalation.findOneAndUpdate(
            { _id: escalationLog._id, status: 'pending' },
            { $set: { status: 'processing', claimedAt: new Date() } },
            { new: true }
          );
          if (claimed) {
            await handleExpiredEscalation(claimed);
          }
        } else {
          const current = findEscalationsByCaseId(caseDoc._id).find(
            (e) => String(e._id) === String(escalationLog._id) && e.status === 'pending'
          );
          if (current) {
            const claimed = updateEscalation(current._id, {
              status: 'processing',
              claimedAt: new Date(),
            });
            await handleExpiredEscalation(claimed);
          }
        }
      } catch (timeoutErr) {
        console.error('Error during in-memory escalation timeout:', timeoutErr);
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
  // Clear escalation timer
  if (activeEscalationTimers.has(caseId.toString())) {
    clearTimeout(activeEscalationTimers.get(caseId.toString()));
    activeEscalationTimers.delete(caseId.toString());
  }

  if (isDbConnected()) {
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new Error('Case not found');
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

    // Update escalation log atomically
    const alerted = await Escalation.findOne({
      caseId,
      rescuerId,
      status: { $in: ['pending', 'processing'] },
    });
    const responseTimeSeconds = alerted?.alertedAt
      ? Math.round((Date.now() - new Date(alerted.alertedAt).getTime()) / 1000)
      : 0;

    await Escalation.findOneAndUpdate(
      { caseId, rescuerId, status: { $in: ['pending', 'processing'] } },
      {
        $set: {
          status: 'accepted',
          responseTimeSeconds,
          note: 'Accepted by rescuer',
        },
      }
    );

    // Notify citizen
    await notificationService.notifyCitizenStatusUpdate(caseDoc, 'Rescuer has accepted your request!');
    return caseDoc;
  } else {
    const caseDoc = getCase(caseId);
    if (!caseDoc) {
      throw new Error('Case not found');
    }

    const updated = updateCase(caseId, {
      status: 'accepted',
      assignedRescuer: rescuerId,
      timeline: [{ status: 'accepted', timestamp: new Date(), note: 'Rescuer accepted assignment' }],
    });
    updateRescuer(rescuerId, { activeCaseId: caseId, available: false });

    const pending = findEscalationsByCaseId(caseId).find(
      (e) => String(e.rescuerId) === String(rescuerId) && ['pending', 'processing'].includes(e.status)
    );
    if (pending) {
      const responseTimeSeconds = pending.alertedAt
        ? Math.round((Date.now() - new Date(pending.alertedAt).getTime()) / 1000)
        : 0;
      updateEscalation(pending._id, {
        status: 'accepted',
        responseTimeSeconds,
        note: 'Accepted by rescuer',
      });
    }

    await notificationService.notifyCitizenStatusUpdate(updated, 'Rescuer has accepted your request!');
    return updated;
  }
}

/**
 * Rescuer declines the assigned case
 */
async function handleRescuerDecline(caseId, rescuerId, reason = 'Rescuer declined') {
  // Clear escalation timer
  if (activeEscalationTimers.has(caseId.toString())) {
    clearTimeout(activeEscalationTimers.get(caseId.toString()));
    activeEscalationTimers.delete(caseId.toString());
  }

  if (isDbConnected()) {
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      throw new Error('Case not found');
    }

    // Mark escalation log as declined atomically
    const alerted = await Escalation.findOne({
      caseId,
      rescuerId,
      status: { $in: ['pending', 'processing'] },
    });
    const responseTimeSeconds = alerted?.alertedAt
      ? Math.round((Date.now() - new Date(alerted.alertedAt).getTime()) / 1000)
      : 0;

    const prevEscalation = await Escalation.findOneAndUpdate(
      { caseId, rescuerId, status: { $in: ['pending', 'processing'] } },
      {
        $set: {
          status: 'declined',
          note: reason,
          responseTimeSeconds,
        },
      }
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
  } else {
    const caseDoc = getCase(caseId);
    if (!caseDoc) {
      throw new Error('Case not found');
    }

    const pending = findEscalationsByCaseId(caseId).find(
      (e) => String(e.rescuerId) === String(rescuerId) && ['pending', 'processing'].includes(e.status)
    );
    let nextAttempt = 2;
    if (pending) {
      const responseTimeSeconds = pending.alertedAt
        ? Math.round((Date.now() - new Date(pending.alertedAt).getTime()) / 1000)
        : 0;
      updateEscalation(pending._id, {
        status: 'declined',
        note: reason,
        responseTimeSeconds,
      });
      nextAttempt = pending.attemptNumber + 1;
    }

    updateCase(caseId, {
      timeline: [{
        status: 'declined',
        timestamp: new Date(),
        note: `Rescuer declined: ${reason}. Escalating to next suitable responder.`,
      }],
    });

    return await dispatchCase(caseId, nextAttempt);
  }
}

module.exports = {
  calculateScore,
  rankRescuers,
  dispatchCase,
  handleRescuerAccept,
  handleRescuerDecline,
  activeEscalationTimers,
  ESCALATION_TIMEOUT_MS,
  MAX_DISPATCH_ATTEMPTS,
};

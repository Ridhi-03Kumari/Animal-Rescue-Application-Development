const Case = require('../models/Case');
const dispatchService = require('../services/dispatchService');
const { assessUrgency } = require('../services/aiTriageService');
const { emitCaseEvent } = require('../socket');
const { calculateDistance } = require('../utils/distance');
const { isDbConnected, saveCase, getAllCases, findCaseByClientRequestId } = require('../utils/devStore');

// A report that arrives without a form key (an older app build still open on a phone) cannot be matched by
// key, so it counts as a repeat when the same person sent the same animal, text and place within this window.
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;
const DUPLICATE_RADIUS_KM = 0.1;
const CLOSED_STATUSES = ['completed', 'cancelled'];

// Reports with the same lock key are handled one at a time. Without this, two identical requests that arrive
// together would both pass the "already received?" check before either one was saved.
const locks = new Map();

async function withLock(key, task) {
  const previous = locks.get(key) || Promise.resolve();
  let unlock;
  const mine = new Promise((resolve) => {
    unlock = resolve;
  });
  const tail = previous.then(() => mine);
  locks.set(key, tail);

  await previous;
  try {
    return await task();
  } finally {
    unlock();
    if (locks.get(key) === tail) locks.delete(key);
  }
}

const normalizeText = (text) => String(text || '').trim().toLowerCase();

async function findExistingReport(clientRequestId) {
  if (isDbConnected()) {
    return Case.findOne({ clientRequestId })
      .populate('assignedRescuer')
      .populate('citizen', 'name phone');
  }
  return findCaseByClientRequestId(clientRequestId);
}

// Same person, animal, description and place (within ~100 m), still open, sent in the last few minutes
async function findRecentDuplicate({ citizenId, reporterPhone, animalType, description, latitude, longitude }) {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const wantedText = normalizeText(description);

  const sameReport = (c) =>
    normalizeText(c.description) === wantedText &&
    calculateDistance(latitude, longitude, c.location && c.location.latitude, c.location && c.location.longitude) <=
      DUPLICATE_RADIUS_KM;

  if (isDbConnected()) {
    // A guest has no account, so their phone number is what identifies them
    const reporter = citizenId ? { citizen: citizenId } : { citizen: null, reporterPhone: reporterPhone || '' };
    const candidates = await Case.find({
      ...reporter,
      animalType,
      status: { $nin: CLOSED_STATUSES },
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('assignedRescuer')
      .populate('citizen', 'name phone');
    return candidates.find(sameReport);
  }

  return getAllCases().find(
    (c) =>
      new Date(c.createdAt) >= since &&
      !CLOSED_STATUSES.includes(c.status) &&
      c.animalType === animalType &&
      (citizenId ? c.citizen === citizenId : !c.citizen && (c.reporterPhone || '') === (reporterPhone || '')) &&
      sameReport(c)
  );
}

function duplicateReply(res, existing) {
  return res.status(200).json({
    success: true,
    duplicate: true,
    message: 'This report was already received',
    case: existing,
    guidance: existing.guidance || '',
    dispatch: { message: 'Responders notified.' },
  });
}

// POST /api/v1/reports
exports.createReport = async (req, res, next) => {
  try {
    const {
      animalType,
      description,
      photoUrl,
      latitude,
      longitude,
      address,
      urgency,
      reporterName,
      reporterPhone,
    } = req.body;

    if (!animalType || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'animalType, latitude, and longitude are required to submit an emergency report',
      });
    }

    let clientRequestId = '';
    if (typeof req.body.clientRequestId === 'string') {
      clientRequestId = req.body.clientRequestId.trim().slice(0, 100);
    }

    const citizenId = req.user ? req.user.id : null;
    const normalizedAnimal = String(animalType).toLowerCase().trim();

    // With a form key, the key is the identity. Without one, the sender + animal + text is.
    const lockKey = clientRequestId
      ? `key:${clientRequestId}`
      : `who:${citizenId || reporterPhone || ''}|${normalizedAnimal}|${normalizeText(description)}`;

    await withLock(lockKey, async () => {
      // Same form sent twice? Return the first case instead of creating another one.
      const existing = clientRequestId
        ? await findExistingReport(clientRequestId)
        : await findRecentDuplicate({
            citizenId,
            reporterPhone,
            animalType: normalizedAnimal,
            description,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          });
      if (existing) return duplicateReply(res, existing);

      // AI Urgency Triage Assessment with 5s timeout & fallback
      let determinedUrgency = urgency;
      let safeGuidance = '';

      if (!determinedUrgency || !['LOW', 'MEDIUM', 'HIGH'].includes(determinedUrgency.toUpperCase())) {
        const triage = await assessUrgency({ animalType, description, photoUrl });
        determinedUrgency = triage.urgency;
        safeGuidance = triage.guidance;
      } else {
        determinedUrgency = determinedUrgency.toUpperCase();
      }

      const casePayload = {
        citizen: citizenId,
        reporterName: reporterName || (req.user ? req.user.name : 'Anonymous Citizen'),
        reporterPhone: reporterPhone || '',
        animalType: normalizedAnimal,
        description: description || '',
        photoUrl: photoUrl || '',
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: address || '',
        },
        urgency: determinedUrgency,
        guidance: safeGuidance,
        clientRequestId: clientRequestId || undefined,
        status: 'reported',
        timeline: [
          {
            status: 'reported',
            timestamp: new Date(),
            note: `Emergency rescue reported. AI Urgency: ${determinedUrgency}`,
          },
        ],
      };

      let newCase;
      if (isDbConnected()) {
        try {
          newCase = await Case.create(casePayload);
        } catch (createErr) {
          // Two servers (or a race) created the same report at once: the unique key stopped the second one
          if (createErr.code === 11000 && clientRequestId) {
            const raced = await findExistingReport(clientRequestId);
            if (raced) return duplicateReply(res, raced);
          }
          throw createErr;
        }
      } else {
        newCase = saveCase(casePayload);
      }

      // Start smart responder matching
      let dispatchResult = null;
      try {
        if (isDbConnected()) {
          dispatchResult = await dispatchService.dispatchCase(newCase._id);
        }
      } catch (dispatchErr) {
        console.error('Dispatch error during report submission:', dispatchErr.message);
      }

      let populatedCase = newCase;
      if (isDbConnected()) {
        populatedCase = await Case.findById(newCase._id)
          .populate('assignedRescuer')
          .populate('citizen', 'name phone');
      }

      // Notify socket watchers of new case
      emitCaseEvent(newCase._id, 'case_created', {
        case: populatedCase,
        urgency: determinedUrgency,
      });

      return res.status(201).json({
        success: true,
        message: 'Rescue report submitted successfully',
        case: populatedCase,
        guidance: safeGuidance,
        dispatch: dispatchResult
          ? {
              alertedRescuerId: dispatchResult.selectedRescuer._id,
              score: dispatchResult.score,
              distanceKm: dispatchResult.distance,
              attemptNumber: dispatchResult.attemptNumber,
            }
          : {
              message: 'Responders notified.',
            },
      });
    });
  } catch (err) {
    next(err);
  }
};

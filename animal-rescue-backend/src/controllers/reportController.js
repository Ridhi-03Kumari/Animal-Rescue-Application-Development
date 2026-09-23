const Case = require('../models/Case');
const dispatchService = require('../services/dispatchService');
const { assessUrgency } = require('../services/aiTriageService');
const { emitCaseEvent } = require('../socket');
const { isDbConnected, saveCase } = require('../utils/devStore');

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

    const citizenId = req.user ? req.user.id : null;

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
      animalType: animalType.toLowerCase().trim(),
      description: description || '',
      photoUrl: photoUrl || '',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || '',
      },
      urgency: determinedUrgency,
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
      newCase = await Case.create(casePayload);
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

    res.status(201).json({
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
  } catch (err) {
    next(err);
  }
};

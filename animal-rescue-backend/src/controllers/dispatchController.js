const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const dispatchService = require('../services/dispatchService');
const { calculateDistance } = require('../utils/distance');

// Helper to find rescuer document for current user
async function getRescuerForUser(userId) {
  return await Rescuer.findOne({ user: userId });
}

// POST /api/v1/dispatch/:id/accept
exports.acceptCase = async (req, res, next) => {
  try {
    const caseId = req.params.id;
    let rescuer = null;

    if (req.user) {
      rescuer = await getRescuerForUser(req.user.id);
    }

    if (!rescuer) {
      // Fallback if testing with rescuerId directly in body
      if (req.body.rescuerId) {
        rescuer = await Rescuer.findById(req.body.rescuerId);
      }
    }

    if (!rescuer) {
      return res.status(403).json({ error: 'Rescuer profile not found for authenticated user' });
    }

    const updatedCase = await dispatchService.handleRescuerAccept(caseId, rescuer._id);

    res.json({
      success: true,
      message: 'Rescue case accepted successfully. Live tracking active.',
      case: updatedCase,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/dispatch/:id/decline
exports.declineCase = async (req, res, next) => {
  try {
    const caseId = req.params.id;
    const { reason } = req.body;
    let rescuer = null;

    if (req.user) {
      rescuer = await getRescuerForUser(req.user.id);
    }

    if (!rescuer && req.body.rescuerId) {
      rescuer = await Rescuer.findById(req.body.rescuerId);
    }

    if (!rescuer) {
      return res.status(403).json({ error: 'Rescuer profile not found for authenticated user' });
    }

    const nextDispatch = await dispatchService.handleRescuerDecline(
      caseId,
      rescuer._id,
      reason || 'Declined by rescuer'
    );

    res.json({
      success: true,
      message: 'Case declined. Escalated to next available responder.',
      escalatedTo: nextDispatch
        ? {
            rescuerId: nextDispatch.selectedRescuer._id,
            score: nextDispatch.score,
            distanceKm: nextDispatch.distance,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dispatch/active
exports.getActiveCase = async (req, res, next) => {
  try {
    const rescuer = await getRescuerForUser(req.user.id);
    if (!rescuer || !rescuer.activeCaseId) {
      return res.json({ success: true, activeCase: null });
    }

    const caseDoc = await Case.findById(rescuer.activeCaseId).populate(
      'citizen',
      'name phone'
    );

    res.json({ success: true, activeCase: caseDoc });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dispatch/nearby
exports.getNearbyCases = async (req, res, next) => {
  try {
    const rescuer = await getRescuerForUser(req.user.id);
    if (!rescuer || !rescuer.location || !rescuer.location.latitude) {
      return res.status(400).json({ error: 'Rescuer location is required' });
    }

    const openCases = await Case.find({ status: { $in: ['reported', 'assigned'] } });

    const nearby = openCases
      .map((c) => {
        const dist = calculateDistance(
          rescuer.location.latitude,
          rescuer.location.longitude,
          c.location.latitude,
          c.location.longitude
        );
        return {
          case: c,
          distanceKm: dist,
        };
      })
      .filter((item) => item.distanceKm <= 50)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, count: nearby.length, cases: nearby });
  } catch (err) {
    next(err);
  }
};

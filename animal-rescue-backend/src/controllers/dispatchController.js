const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const dispatchService = require('../services/dispatchService');
const { calculateDistance } = require('../utils/distance');
const { isDbConnected, getCase, updateCase, getAllCases } = require('../utils/devStore');

// Helper to find rescuer document for current user
async function getRescuerForUser(userId) {
  if (!isDbConnected()) {
    return { _id: 'dev_rescuer_id', organizationName: 'Compassion Animal Rescue Bengaluru' };
  }
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

    if (!rescuer && req.body.rescuerId) {
      if (isDbConnected()) {
        rescuer = await Rescuer.findById(req.body.rescuerId);
      } else {
        rescuer = { _id: req.body.rescuerId, organizationName: 'Bengaluru Rescuer' };
      }
    }

    if (!rescuer) {
      // In dev fallback, allow accepting
      rescuer = { _id: 'mock_rescuer_01', organizationName: 'Active Rescuer' };
    }

    let updatedCase;
    if (isDbConnected()) {
      updatedCase = await dispatchService.handleRescuerAccept(caseId, rescuer._id);
    } else {
      updatedCase = updateCase(caseId, {
        status: 'accepted',
        assignedRescuer: rescuer._id,
        timeline: [{ status: 'accepted', timestamp: new Date(), note: 'Rescuer accepted assignment' }],
      });
    }

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
      if (isDbConnected()) {
        rescuer = await Rescuer.findById(req.body.rescuerId);
      }
    }

    if (!rescuer) {
      rescuer = { _id: 'mock_rescuer_01', organizationName: 'Rescuer' };
    }

    let nextDispatch = null;
    if (isDbConnected()) {
      nextDispatch = await dispatchService.handleRescuerDecline(
        caseId,
        rescuer._id,
        reason || 'Declined by rescuer'
      );
    } else {
      updateCase(caseId, {
        status: 'reported',
        timeline: [{ status: 'declined', timestamp: new Date(), note: reason || 'Declined by rescuer' }],
      });
    }

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
    if (!isDbConnected()) {
      const all = getAllCases();
      const active = all.find((c) =>
        ['accepted', 'on_the_way', 'reached_location', 'animal_picked_up', 'at_shelter'].includes(c.status)
      );
      return res.json({ success: true, activeCase: active || null });
    }

    const rescuer = await getRescuerForUser(req.user.id);
    if (!rescuer || !rescuer.activeCaseId) {
      return res.json({ success: true, activeCase: null });
    }

    const caseDoc = await Case.findById(rescuer.activeCaseId).populate('citizen', 'name phone');
    res.json({ success: true, activeCase: caseDoc });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dispatch/nearby
exports.getNearbyCases = async (req, res, next) => {
  try {
    let openCases = [];
    if (isDbConnected()) {
      openCases = await Case.find({ status: { $in: ['reported', 'assigned'] } });
    } else {
      openCases = getAllCases().filter((c) => ['reported', 'assigned'].includes(c.status));
    }

    res.json({ success: true, count: openCases.length, cases: openCases });
  } catch (err) {
    next(err);
  }
};

const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const Animal = require('../models/Animal');
const Escalation = require('../models/Escalation');
const notificationService = require('../services/notificationService');
const { emitCaseEvent } = require('../socket');

// GET /api/v1/coordinator/cases (Cases needing manual intervention)
exports.getEscalatedCases = async (req, res, next) => {
  try {
    // Find cases with timeline entry of escalated_to_coordinator or status reported with no rescuer
    const escalatedCases = await Case.find({
      $or: [
        { 'timeline.status': 'escalated_to_coordinator' },
        { status: 'reported', createdAt: { $lt: new Date(Date.now() - 3 * 60 * 1000) } },
      ],
      status: { $in: ['reported', 'assigned'] },
    })
      .sort({ updatedAt: -1 })
      .populate('citizen', 'name phone')
      .populate('assignedRescuer');

    // Enrich with escalation attempt count
    const enriched = await Promise.all(
      escalatedCases.map(async (caseDoc) => {
        const escalations = await Escalation.find({ caseId: caseDoc._id }).populate({
          path: 'rescuerId',
          populate: { path: 'user', select: 'name phone' },
        });
        return {
          ...caseDoc.toObject(),
          escalationHistory: escalations,
        };
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      cases: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/coordinator/cases/:id/assign (Manual assignment by coordinator)
exports.manualAssignCase = async (req, res, next) => {
  try {
    const caseId = req.params.id;
    const { rescuerId, note } = req.body;

    if (!rescuerId) {
      return res.status(400).json({ error: 'rescuerId is required for manual assignment' });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const rescuer = await Rescuer.findById(rescuerId).populate('user', 'name phone');
    if (!rescuer) {
      return res.status(404).json({ error: 'Rescuer not found' });
    }

    caseDoc.assignedRescuer = rescuer._id;
    caseDoc.status = 'assigned';
    caseDoc.timeline.push({
      status: 'assigned_by_coordinator',
      timestamp: new Date(),
      note: note || `Manually assigned to ${rescuer.organizationName || rescuer.user?.name || 'Rescuer'} by Emergency Coordinator`,
      updatedBy: req.user ? req.user.id : null,
    });
    await caseDoc.save();

    // Log escalation entry for manual assignment
    await Escalation.create({
      caseId: caseDoc._id,
      attemptNumber: 99, // Special code for coordinator manual assignment
      rescuerId: rescuer._id,
      alertedAt: new Date(),
      status: 'coordinator_escalated',
      note: note || 'Assigned directly by coordinator',
    });

    // Notify rescuer
    await notificationService.notifyRescuerNewCase(rescuer, caseDoc, { totalScore: 'MANUAL' });

    // Emit live update
    emitCaseEvent(caseDoc._id, 'case_assigned', {
      case: caseDoc,
      rescuer,
      assignedByCoordinator: true,
    });

    res.json({
      success: true,
      message: `Case manually assigned to ${rescuer.organizationName || 'rescuer'}`,
      case: caseDoc,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/coordinator/rescuers/:id/verify (Approve or Reject Rescuer)
exports.verifyRescuer = async (req, res, next) => {
  try {
    const { verificationStatus } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(verificationStatus)) {
      return res.status(400).json({
        error: "verificationStatus must be 'approved', 'rejected', or 'pending'",
      });
    }

    const rescuer = await Rescuer.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus,
        isVerified: verificationStatus === 'approved',
      },
      { new: true }
    ).populate('user', 'name phone role');

    if (!rescuer) {
      return res.status(404).json({ error: 'Rescuer not found' });
    }

    res.json({
      success: true,
      message: `Rescuer verification status set to ${verificationStatus}`,
      rescuer,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/coordinator/stats (Dashboard statistics)
exports.getSystemStats = async (req, res, next) => {
  try {
    const totalCases = await Case.countDocuments();
    const activeRescues = await Case.countDocuments({
      status: { $in: ['assigned', 'accepted', 'on_the_way', 'reached_location', 'animal_picked_up'] },
    });
    const completedRescues = await Case.countDocuments({ status: 'completed' });
    const escalatedCases = await Case.countDocuments({
      'timeline.status': 'escalated_to_coordinator',
      status: { $in: ['reported', 'assigned'] },
    });

    const totalAnimalsSheltered = await Animal.countDocuments();
    const availableRescuers = await Rescuer.countDocuments({ available: true, activeCaseId: null });
    const totalRescuers = await Rescuer.countDocuments();

    res.json({
      success: true,
      stats: {
        totalCases,
        activeRescues,
        completedRescues,
        escalatedCases,
        totalAnimalsSheltered,
        availableRescuers,
        totalRescuers,
        operationalCity: 'Bengaluru',
      },
    });
  } catch (err) {
    next(err);
  }
};

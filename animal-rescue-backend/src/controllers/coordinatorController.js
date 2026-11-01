const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const Animal = require('../models/Animal');
const Escalation = require('../models/Escalation');
const notificationService = require('../services/notificationService');
const { emitCaseEvent } = require('../socket');
const {
  isDbConnected,
  getCase,
  getAllCases,
  updateCase,
  animalsMap,
  getAllRescuers,
  getRescuerById,
  updateRescuer,
  populateCase,
  populateRescuer,
} = require('../utils/devStore');
const {
  parsePaginationParams,
  buildPaginationMetadata,
  paginateArray,
} = require('../utils/pagination');

const ESCALATION_AFTER_MS = 3 * 60 * 1000;
const ACTIVE_STATUSES = ['assigned', 'accepted', 'on_the_way', 'reached_location', 'animal_picked_up'];

// In-memory version of the "needs manual intervention" query used when MongoDB is not connected
function devEscalatedCases() {
  return getAllCases().filter(
    (c) =>
      ['reported', 'assigned'].includes(c.status) &&
      ((c.timeline || []).some((t) => t.status === 'escalated_to_coordinator') ||
        (c.status === 'reported' && Date.now() - new Date(c.createdAt).getTime() > ESCALATION_AFTER_MS))
  );
}

// GET /api/v1/coordinator/cases (Cases needing manual intervention)
exports.getEscalatedCases = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query);

    if (!isDbConnected()) {
      const allCases = devEscalatedCases().map((c) => ({ ...populateCase(c), escalationHistory: [] }));
      const paginated = paginateArray(allCases, page, limit);
      return res.json({
        success: true,
        count: paginated.items.length,
        cases: paginated.items,
        pagination: paginated.pagination,
      });
    }

    const filter = {
      $or: [
        { 'timeline.status': 'escalated_to_coordinator' },
        { status: 'reported', createdAt: { $lt: new Date(Date.now() - 3 * 60 * 1000) } },
      ],
      status: { $in: ['reported', 'assigned'] },
    };

    const total = await Case.countDocuments(filter);
    const pagination = buildPaginationMetadata(total, page, limit);

    // Find cases with deterministic sorting and lean query
    const escalatedCases = await Case.find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('citizen', 'name phone')
      .populate({
        path: 'assignedRescuer',
        select: 'organizationName user location',
        populate: { path: 'user', select: 'name phone' },
      })
      .lean();

    // Batch query escalations to eliminate N+1 problem (1 query instead of N queries)
    const caseIds = escalatedCases.map((c) => c._id);
    const allEscalations = await Escalation.find({ caseId: { $in: caseIds } })
      .populate({
        path: 'rescuerId',
        select: 'organizationName user',
        populate: { path: 'user', select: 'name phone' },
      })
      .lean();

    const escalationsByCase = new Map();
    allEscalations.forEach((esc) => {
      const cid = esc.caseId.toString();
      if (!escalationsByCase.has(cid)) {
        escalationsByCase.set(cid, []);
      }
      escalationsByCase.get(cid).push(esc);
    });

    const enriched = escalatedCases.map((caseDoc) => ({
      ...caseDoc,
      escalationHistory: escalationsByCase.get(caseDoc._id.toString()) || [],
    }));

    res.json({
      success: true,
      count: enriched.length,
      cases: enriched,
      pagination,
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

    if (!isDbConnected()) {
      if (!getCase(caseId)) {
        return res.status(404).json({ error: 'Case not found' });
      }
      const devRescuer = getRescuerById(rescuerId);
      if (!devRescuer) {
        return res.status(404).json({ error: 'Rescuer not found' });
      }

      const assigned = updateCase(caseId, {
        assignedRescuer: devRescuer._id,
        status: 'assigned',
        timeline: [
          {
            status: 'assigned_by_coordinator',
            timestamp: new Date(),
            note:
              note ||
              `Manually assigned to ${devRescuer.organizationName || 'Rescuer'} by Emergency Coordinator`,
            updatedBy: req.user ? req.user.id : null,
          },
        ],
      });

      const populatedRescuer = populateRescuer(devRescuer);
      await notificationService.notifyRescuerNewCase(populatedRescuer, assigned, { totalScore: 'MANUAL' });
      emitCaseEvent(assigned._id, 'case_assigned', {
        case: assigned,
        rescuer: populatedRescuer,
        assignedByCoordinator: true,
      });

      return res.json({
        success: true,
        message: `Case manually assigned to ${devRescuer.organizationName || 'rescuer'}`,
        case: populateCase(assigned),
      });
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

    if (!isDbConnected()) {
      const target = getRescuerById(req.params.id);
      if (!target) {
        return res.status(404).json({ error: 'Rescuer not found' });
      }
      const updated = updateRescuer(target.user, {
        verificationStatus,
        isVerified: verificationStatus === 'approved',
      });
      return res.json({
        success: true,
        message: `Rescuer verification status set to ${verificationStatus}`,
        rescuer: populateRescuer(updated),
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
    if (!isDbConnected()) {
      const cases = getAllCases();
      const rescuers = getAllRescuers();
      return res.json({
        success: true,
        stats: {
          totalCases: cases.length,
          activeRescues: cases.filter((c) => ACTIVE_STATUSES.includes(c.status)).length,
          completedRescues: cases.filter((c) => c.status === 'completed').length,
          escalatedCases: cases.filter(
            (c) =>
              ['reported', 'assigned'].includes(c.status) &&
              (c.timeline || []).some((t) => t.status === 'escalated_to_coordinator')
          ).length,
          totalAnimalsSheltered: animalsMap.size,
          availableRescuers: rescuers.filter((r) => r.available && !r.activeCaseId).length,
          totalRescuers: rescuers.length,
          operationalCity: 'Bengaluru',
        },
      });
    }

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

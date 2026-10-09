const Case = require('../models/Case');
const dispatchService = require('../services/dispatchService');
const {
  isDbConnected,
  getCase,
  updateCase,
  getAllCases,
  updateRescuer,
  populateCase,
} = require('../utils/devStore');
const { findRescuerForUser, sameId } = require('../utils/rescuerLookup');

// Statuses while a rescuer is out on a rescue
const ACTIVE_STATUSES = [
  'accepted',
  'on_the_way',
  'reached_location',
  'animal_picked_up',
  'at_shelter',
  'treatment_started',
];

async function loadCase(id) {
  return isDbConnected() ? Case.findById(id) : getCase(id);
}

// Checks shared by accept and decline. When something is wrong it sends the error reply itself
// and returns null, so the caller just stops.
// (These routes already require a signed-in rescuer: protect + authorize('rescuer').)
async function loadRescuerAndCase(req, res) {
  const rescuer = await findRescuerForUser(req.user.id);
  if (!rescuer) {
    res
      .status(403)
      .json({ error: 'No rescuer profile found for this account. Please log in with a rescuer account.' });
    return null;
  }

  const caseDoc = await loadCase(req.params.id);
  if (!caseDoc) {
    res.status(404).json({ error: 'Case not found' });
    return null;
  }

  if (['completed', 'cancelled'].includes(caseDoc.status)) {
    res.status(400).json({ error: `This case is already ${caseDoc.status}` });
    return null;
  }

  if (caseDoc.assignedRescuer && !sameId(caseDoc.assignedRescuer, rescuer._id)) {
    res.status(409).json({ error: 'This case is assigned to another rescuer' });
    return null;
  }

  return { rescuer, caseDoc };
}

// POST /api/v1/dispatch/:id/accept
exports.acceptCase = async (req, res, next) => {
  try {
    const checked = await loadRescuerAndCase(req, res);
    if (!checked) return;
    const { rescuer, caseDoc } = checked;

    // Already accepted by this rescuer (tapped in the list and again on the detail page): nothing to redo
    if (!['reported', 'assigned'].includes(caseDoc.status)) {
      return res.json({
        success: true,
        message: 'You have already accepted this case.',
        case: isDbConnected() ? caseDoc : populateCase(caseDoc),
      });
    }

    // One rescue at a time
    if (rescuer.activeCaseId && !sameId(rescuer.activeCaseId, caseDoc._id)) {
      const current = await loadCase(rescuer.activeCaseId);
      if (current && ACTIVE_STATUSES.includes(current.status)) {
        return res.status(409).json({ error: 'Finish your current rescue before accepting another one' });
      }
    }

    let updatedCase;
    if (isDbConnected()) {
      updatedCase = await dispatchService.handleRescuerAccept(caseDoc._id, rescuer._id);
    } else {
      updatedCase = updateCase(caseDoc._id, {
        status: 'accepted',
        assignedRescuer: rescuer._id,
        timeline: [{ status: 'accepted', timestamp: new Date(), note: 'Rescuer accepted assignment' }],
      });
      updateRescuer(req.user.id, { activeCaseId: caseDoc._id, available: false });
      updatedCase = populateCase(updatedCase);
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
    const checked = await loadRescuerAndCase(req, res);
    if (!checked) return;
    const { rescuer, caseDoc } = checked;
    const reason = (req.body && req.body.reason) || 'Declined by rescuer';

    if (!['reported', 'assigned'].includes(caseDoc.status)) {
      return res.status(409).json({ error: 'You have already accepted this case, so it cannot be declined' });
    }

    // An open case that was never assigned to this rescuer: there is nothing to decline
    if (!caseDoc.assignedRescuer) {
      return res.json({
        success: true,
        message: 'This case is not assigned to you, so nothing was changed.',
        escalatedTo: null,
      });
    }

    let nextDispatch = null;
    if (isDbConnected()) {
      nextDispatch = await dispatchService.handleRescuerDecline(caseDoc._id, rescuer._id, reason);
    } else {
      updateCase(caseDoc._id, {
        status: 'reported',
        assignedRescuer: null,
        timeline: [{ status: 'declined', timestamp: new Date(), note: reason }],
      });
    }

    res.json({
      success: true,
      message: nextDispatch
        ? 'Case declined. Escalated to next available responder.'
        : 'Case declined.',
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

// GET /api/v1/dispatch/active  (the signed-in rescuer's rescue in progress)
exports.getActiveCase = async (req, res, next) => {
  try {
    const rescuer = await findRescuerForUser(req.user.id);
    if (!rescuer) {
      return res.json({ success: true, activeCase: null });
    }

    let activeCase = null;
    if (isDbConnected()) {
      activeCase = await Case.findOne({
        assignedRescuer: rescuer._id,
        status: { $in: ACTIVE_STATUSES },
      })
        .sort({ updatedAt: -1 })
        .populate('citizen', 'name phone');
    } else {
      const mine = getAllCases().find(
        (c) => ACTIVE_STATUSES.includes(c.status) && sameId(c.assignedRescuer, rescuer._id)
      );
      activeCase = mine ? populateCase(mine) : null;
    }

    res.json({ success: true, activeCase });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/dispatch/nearby  (alerts for the signed-in rescuer)
// A rescuer sees the cases sent to them, plus open cases nobody is assigned to yet. Cases that were
// sent to a different rescuer are not shown here.
exports.getNearbyCases = async (req, res, next) => {
  try {
    const rescuer = await findRescuerForUser(req.user.id);
    if (!rescuer) {
      return res.json({ success: true, count: 0, cases: [] });
    }

    let openCases = [];
    if (isDbConnected()) {
      openCases = await Case.find({
        $or: [
          { status: 'assigned', assignedRescuer: rescuer._id },
          { status: { $in: ['reported', 'assigned'] }, assignedRescuer: null },
        ],
      }).sort({ createdAt: -1 });
    } else {
      openCases = getAllCases().filter(
        (c) =>
          (c.status === 'assigned' && sameId(c.assignedRescuer, rescuer._id)) ||
          (['reported', 'assigned'].includes(c.status) && !c.assignedRescuer)
      );
    }

    res.json({ success: true, count: openCases.length, cases: openCases });
  } catch (err) {
    next(err);
  }
};

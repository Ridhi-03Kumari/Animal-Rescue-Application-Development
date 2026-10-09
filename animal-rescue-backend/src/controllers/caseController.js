const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const Animal = require('../models/Animal');
const notificationService = require('../services/notificationService');
const { generateQrCode } = require('./animalController');
const { emitCaseEvent } = require('../socket');
const {
  isDbConnected,
  getCase,
  getAllCases,
  updateCase,
  saveAnimal,
  getAnimalByCaseId,
  getAllRescuers,
  updateRescuer,
  populateCase,
} = require('../utils/devStore');
const { findRescuerForUser, sameId } = require('../utils/rescuerLookup');

// Order of a rescue. A rescuer can only move a case forward along this line.
const STAGE_ORDER = [
  'reported',
  'assigned',
  'accepted',
  'on_the_way',
  'reached_location',
  'animal_picked_up',
  'at_shelter',
  'treatment_started',
  'completed',
];
// What a rescuer may set. "accepted" is deliberately missing: it only happens through the Accept button.
const RESCUER_CAN_SET = [
  'on_the_way',
  'reached_location',
  'animal_picked_up',
  'at_shelter',
  'treatment_started',
  'completed',
  'cancelled',
];

// GET /api/v1/cases/:id
exports.getCaseById = async (req, res, next) => {
  try {
    let caseDoc;
    if (isDbConnected()) {
      caseDoc = await Case.findById(req.params.id)
        .populate('citizen', 'name phone')
        .populate({
          path: 'assignedRescuer',
          populate: { path: 'user', select: 'name phone' },
        });
    } else {
      caseDoc = populateCase(getCase(req.params.id));
    }

    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ success: true, case: caseDoc });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/cases/my-reports
exports.getMyReports = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let cases = [];
    if (isDbConnected()) {
      cases = await Case.find({ citizen: req.user.id })
        .sort({ createdAt: -1 })
        .populate('assignedRescuer');
    } else {
      cases = getAllCases()
        .filter((c) => c.citizen === req.user.id)
        .map(populateCase);
    }

    res.json({ success: true, count: cases.length, cases });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/cases (list with optional status filter)
// Each role only sees its own cases: a citizen their reports, a rescuer the cases assigned to them.
// Coordinators and admins see everything.
exports.getAllCases = async (req, res, next) => {
  try {
    const { status, animalType } = req.query;
    let cases = [];

    // Work out whose cases this user may see
    let onlyCitizen = null;
    let onlyRescuerId = null;
    if (req.user.role === 'citizen') {
      onlyCitizen = req.user.id;
    } else if (req.user.role === 'rescuer') {
      const rescuer = await findRescuerForUser(req.user.id);
      if (!rescuer) return res.json({ success: true, count: 0, cases: [] });
      onlyRescuerId = rescuer._id;
    }

    if (isDbConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (animalType) filter.animalType = animalType.toLowerCase();
      if (onlyCitizen) filter.citizen = onlyCitizen;
      if (onlyRescuerId) filter.assignedRescuer = onlyRescuerId;

      cases = await Case.find(filter)
        .sort({ createdAt: -1 })
        .populate('citizen', 'name phone')
        .populate({
          path: 'assignedRescuer',
          populate: { path: 'user', select: 'name phone' },
        });
    } else {
      cases = getAllCases({ status });
      if (animalType) {
        cases = cases.filter((c) => (c.animalType || '').toLowerCase() === animalType.toLowerCase());
      }
      if (onlyCitizen) cases = cases.filter((c) => c.citizen === onlyCitizen);
      if (onlyRescuerId) cases = cases.filter((c) => sameId(c.assignedRescuer, onlyRescuerId));
      cases = cases.map(populateCase);
    }

    res.json({ success: true, count: cases.length, cases });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/cases/:id/status
exports.updateCaseStatus = async (req, res, next) => {
  try {
    const { status, note, medicalNotes, treatment } = req.body;

    const validStatuses = [
      'reported',
      'assigned',
      'accepted',
      'on_the_way',
      'reached_location',
      'animal_picked_up',
      'at_shelter',
      'treatment_started',
      'completed',
      'cancelled',
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let caseDoc;
    if (isDbConnected()) {
      caseDoc = await Case.findById(req.params.id);
    } else {
      caseDoc = getCase(req.params.id);
    }

    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Who may change this case (the route already requires a rescuer, coordinator or admin)
    const role = req.user.role;
    if (role === 'rescuer') {
      const rescuer = await findRescuerForUser(req.user.id);
      if (!rescuer || !sameId(caseDoc.assignedRescuer, rescuer._id)) {
        return res.status(403).json({ error: 'Only the rescuer assigned to this case can update it' });
      }
      if (!RESCUER_CAN_SET.includes(status)) {
        return res.status(400).json({
          error: status === 'accepted' ? 'Use the Accept button to take a case' : `A rescuer cannot set the status to ${status}`,
        });
      }
    }

    // The same status again (a double tap) changes nothing
    if (caseDoc.status === status) {
      let existingAnimal = null;
      if (status === 'completed') {
        existingAnimal = isDbConnected() ? await Animal.findOne({ caseId: caseDoc._id }) : getAnimalByCaseId(caseDoc._id);
      }
      return res.json({
        success: true,
        message: `Case is already ${status}`,
        case: isDbConnected() ? caseDoc : populateCase(caseDoc),
        animal: existingAnimal || null,
      });
    }

    // A rescuer moves a case forward only: no skipping the Accept step, no going back, no reopening
    if (role === 'rescuer') {
      if (['completed', 'cancelled'].includes(caseDoc.status)) {
        return res.status(409).json({ error: `This case is already ${caseDoc.status}` });
      }
      if (STAGE_ORDER.indexOf(caseDoc.status) < STAGE_ORDER.indexOf('accepted')) {
        return res.status(409).json({ error: 'Accept the case before updating its progress' });
      }
      if (status !== 'cancelled' && STAGE_ORDER.indexOf(status) < STAGE_ORDER.indexOf(caseDoc.status)) {
        return res.status(409).json({ error: `Cannot move a case back from ${caseDoc.status} to ${status}` });
      }
    }

    const timelineEntry = {
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: req.user ? req.user.id : null,
    };

    let generatedAnimal = null;

    // Closing a case that is already closed (e.g. a double tap on "Complete") must not count again
    // or free a rescuer who has since moved on to a new case.
    const wasClosed = ['completed', 'cancelled'].includes(caseDoc.status);

    if (isDbConnected()) {
      caseDoc.status = status;
      if (medicalNotes) caseDoc.medicalNotes = medicalNotes;
      if (treatment) caseDoc.treatment = treatment;
      caseDoc.timeline.push(timelineEntry);

      if (status === 'completed' || status === 'cancelled') {
        if (caseDoc.assignedRescuer && !wasClosed) {
          if (status === 'completed') {
            await Rescuer.findByIdAndUpdate(caseDoc.assignedRescuer, { $inc: { completedCasesCount: 1 } });
          }
          // Only free the rescuer if they are still on THIS case
          await Rescuer.findOneAndUpdate(
            { _id: caseDoc.assignedRescuer, activeCaseId: caseDoc._id },
            { activeCaseId: null, available: true }
          );
        }

        if (status === 'completed') {
          let existingAnimal = await Animal.findOne({ caseId: caseDoc._id });
          if (!existingAnimal) {
            const qrUrl = `https://animalrescue.bengaluru.gov.in/animals/${caseDoc._id}`;
            existingAnimal = new Animal({
              caseId: caseDoc._id,
              animalType: caseDoc.animalType,
              photos: caseDoc.photoUrl ? [caseDoc.photoUrl] : [],
              foundLocation: caseDoc.location,
              rescueDate: new Date(),
              medicalNotes: caseDoc.medicalNotes,
              treatment: caseDoc.treatment,
              status: 'in_treatment',
              qrCodeUrl: qrUrl,
            });

            try {
              existingAnimal.qrCodeData = await generateQrCode(existingAnimal._id, caseDoc._id);
            } catch (qrErr) {
              console.error('QR code generation failed:', qrErr);
            }

            await existingAnimal.save();
          }
          generatedAnimal = existingAnimal;
        }
      }

      await caseDoc.save();
    } else {
      // In-memory update
      caseDoc = updateCase(req.params.id, {
        status,
        medicalNotes: medicalNotes || caseDoc.medicalNotes,
        treatment: treatment || caseDoc.treatment,
        timeline: [timelineEntry],
      });

      if ((status === 'completed' || status === 'cancelled') && !wasClosed) {
        const owner = getAllRescuers().find((r) => r._id === String(caseDoc.assignedRescuer));
        if (owner) {
          const stillOnThisCase = String(owner.activeCaseId) === String(caseDoc._id);
          updateRescuer(owner.user, {
            ...(stillOnThisCase ? { activeCaseId: null, available: true } : {}),
            completedCasesCount:
              (owner.completedCasesCount || 0) + (status === 'completed' ? 1 : 0),
          });
        }
      }

      if (status === 'completed') {
        // Marking a case complete twice must not create a second animal record
        generatedAnimal = getAnimalByCaseId(caseDoc._id);
        if (!generatedAnimal) {
          const qrUrl = `https://animalrescue.bengaluru.gov.in/animals/${caseDoc._id}`;
          const qrData = await generateQrCode(caseDoc._id, caseDoc._id);
          generatedAnimal = saveAnimal({
            caseId: caseDoc._id,
            animalType: caseDoc.animalType,
            photos: caseDoc.photoUrl ? [caseDoc.photoUrl] : [],
            foundLocation: caseDoc.location,
            rescueDate: new Date(),
            medicalNotes: caseDoc.medicalNotes,
            treatment: caseDoc.treatment,
            status: 'in_treatment',
            qrCodeUrl: qrUrl,
            qrCodeData: qrData,
          });
        }
      }
      caseDoc = populateCase(caseDoc);
    }

    // Broadcast live event to all connected citizen/coordinator clients via Socket.IO
    emitCaseEvent(caseDoc._id, 'case_status', {
      status,
      note: note || `Status changed to ${status}`,
      case: caseDoc,
      animal: generatedAnimal,
    });

    // Send citizen notification
    await notificationService.notifyCitizenStatusUpdate(caseDoc, `Case is now ${status}`);

    res.json({
      success: true,
      message: `Case status updated to ${status}`,
      case: caseDoc,
      animal: generatedAnimal,
    });
  } catch (err) {
    next(err);
  }
};

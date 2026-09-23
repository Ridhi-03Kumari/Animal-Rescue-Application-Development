const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const Animal = require('../models/Animal');
const notificationService = require('../services/notificationService');
const { generateQrCode } = require('./animalController');
const { emitCaseEvent } = require('../socket');
const { isDbConnected, getCase, getAllCases, updateCase, saveAnimal } = require('../utils/devStore');

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
      caseDoc = getCase(req.params.id);
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
      cases = getAllCases().filter((c) => c.citizen === req.user.id);
    }

    res.json({ success: true, count: cases.length, cases });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/cases (list with optional status filter)
exports.getAllCases = async (req, res, next) => {
  try {
    const { status, animalType } = req.query;
    let cases = [];

    if (isDbConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (animalType) filter.animalType = animalType.toLowerCase();

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

    const timelineEntry = {
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: req.user ? req.user.id : null,
    };

    let generatedAnimal = null;

    if (isDbConnected()) {
      caseDoc.status = status;
      if (medicalNotes) caseDoc.medicalNotes = medicalNotes;
      if (treatment) caseDoc.treatment = treatment;
      caseDoc.timeline.push(timelineEntry);

      if (status === 'completed' || status === 'cancelled') {
        if (caseDoc.assignedRescuer) {
          await Rescuer.findByIdAndUpdate(caseDoc.assignedRescuer, {
            activeCaseId: null,
            available: true,
            $inc: status === 'completed' ? { completedCasesCount: 1 } : {},
          });
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

      if (status === 'completed') {
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

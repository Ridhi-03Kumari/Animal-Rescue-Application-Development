const Case = require('../models/Case');
const Rescuer = require('../models/Rescuer');
const Animal = require('../models/Animal');
const notificationService = require('../services/notificationService');
const { generateQrCode } = require('./animalController');
const { emitCaseEvent } = require('../socket');

// GET /api/v1/cases/:id
exports.getCaseById = async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id)
      .populate('citizen', 'name phone')
      .populate({
        path: 'assignedRescuer',
        populate: { path: 'user', select: 'name phone' },
      });

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

    const cases = await Case.find({ citizen: req.user.id })
      .sort({ createdAt: -1 })
      .populate('assignedRescuer');

    res.json({ success: true, count: cases.length, cases });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/cases (list with optional status filter)
exports.getAllCases = async (req, res, next) => {
  try {
    const { status, animalType } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (animalType) filter.animalType = animalType.toLowerCase();

    const cases = await Case.find(filter)
      .sort({ createdAt: -1 })
      .populate('citizen', 'name phone')
      .populate({
        path: 'assignedRescuer',
        populate: { path: 'user', select: 'name phone' },
      });

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

    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    caseDoc.status = status;
    if (medicalNotes) caseDoc.medicalNotes = medicalNotes;
    if (treatment) caseDoc.treatment = treatment;

    // Record timeline entry
    caseDoc.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: req.user ? req.user.id : null,
    });

    let generatedAnimal = null;

    // If completed or cancelled, free the rescuer
    if (status === 'completed' || status === 'cancelled') {
      if (caseDoc.assignedRescuer) {
        await Rescuer.findByIdAndUpdate(caseDoc.assignedRescuer, {
          activeCaseId: null,
          available: true,
          $inc: status === 'completed' ? { completedCasesCount: 1 } : {},
        });
      }

      // If completed, generate/record permanent Animal profile post-rescue
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

          // Generate actual scannable QR Code Data URL
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

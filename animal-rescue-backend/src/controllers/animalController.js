const QRCode = require('qrcode');
const Animal = require('../models/Animal');
const Case = require('../models/Case');
const { isDbConnected, getAnimalByCaseId, getAnimalById, saveAnimal } = require('../utils/devStore');

/**
 * Generate QR code data URL for an animal record
 */
async function generateQrCode(animalId, caseId) {
  const qrPayload = JSON.stringify({
    type: 'ANIMAL_RESCUE_RECORD',
    animalId: animalId ? animalId.toString() : 'mock_animal',
    caseId: caseId ? caseId.toString() : null,
    lookupUrl: `https://animalrescue.bengaluru.gov.in/animals/${animalId}`,
  });

  return await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#2F5D50',
      light: '#FFFFFF',
    },
  });
}

// GET /api/v1/animals
exports.listAnimals = async (req, res, next) => {
  try {
    const { status, animalType } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (animalType) filter.animalType = animalType.toLowerCase();

      const animals = await Animal.find(filter)
        .sort({ rescueDate: -1 })
        .populate('caseId', 'reporterName location urgency status');

      return res.json({ success: true, count: animals.length, animals });
    }

    res.json({ success: true, count: 0, animals: [] });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/animals/:id
exports.getAnimalById = async (req, res, next) => {
  try {
    let animal;
    if (isDbConnected()) {
      animal = await Animal.findById(req.params.id).populate('caseId');
    } else {
      animal = getAnimalById(req.params.id);
    }

    if (!animal) {
      return res.status(404).json({ error: 'Animal record not found' });
    }

    res.json({ success: true, animal });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/animals/case/:caseId
exports.getAnimalByCaseId = async (req, res, next) => {
  try {
    let animal;
    if (isDbConnected()) {
      animal = await Animal.findOne({ caseId: req.params.caseId }).populate('caseId');
    } else {
      animal = getAnimalByCaseId(req.params.caseId);
    }

    if (!animal) {
      return res.status(404).json({ error: 'No animal record linked to this case' });
    }

    res.json({ success: true, animal });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/animals/qr/:identifier (Scan QR code - public lookup)
exports.lookupByQr = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    let animal = null;
    if (isDbConnected()) {
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        animal = await Animal.findById(identifier).populate('caseId');
        if (!animal) {
          animal = await Animal.findOne({ caseId: identifier }).populate('caseId');
        }
      }

      if (!animal) {
        animal = await Animal.findOne({ qrCodeUrl: { $regex: identifier, $options: 'i' } }).populate('caseId');
      }
    } else {
      animal = getAnimalById(identifier) || getAnimalByCaseId(identifier);
    }

    if (!animal) {
      return res.status(404).json({
        error: 'No medical/rescue record found for this QR identifier. Please report this animal if in distress.',
      });
    }

    res.json({
      success: true,
      message: 'Animal digital history found',
      animal: {
        id: animal._id,
        name: animal.name || 'Rescued Animal',
        animalType: animal.animalType,
        photos: animal.photos,
        foundLocation: animal.foundLocation,
        rescueDate: animal.rescueDate,
        identifyingMarkings: animal.identifyingMarkings,
        medicalNotes: animal.medicalNotes,
        treatment: animal.treatment,
        status: animal.status,
        qrCodeData: animal.qrCodeData,
        originalCase: animal.caseId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/animals
exports.createAnimalProfile = async (req, res, next) => {
  try {
    const {
      caseId,
      animalType,
      name,
      photos,
      foundLocation,
      rescueDate,
      identifyingMarkings,
      medicalNotes,
      treatment,
      status,
    } = req.body;

    if (!caseId || !animalType || !foundLocation) {
      return res.status(400).json({
        error: 'caseId, animalType, and foundLocation are required',
      });
    }

    const payload = {
      caseId,
      animalType: animalType.toLowerCase().trim(),
      name: name || '',
      photos: photos || [],
      foundLocation,
      rescueDate: rescueDate || new Date(),
      identifyingMarkings: identifyingMarkings || '',
      medicalNotes: medicalNotes || '',
      treatment: treatment || '',
      status: status || 'in_treatment',
    };

    let animal;
    if (isDbConnected()) {
      animal = new Animal(payload);
      animal.qrCodeData = await generateQrCode(animal._id, caseId);
      animal.qrCodeUrl = `https://animalrescue.bengaluru.gov.in/animals/${animal._id}`;
      await animal.save();
    } else {
      const qrData = await generateQrCode(caseId, caseId);
      animal = saveAnimal({
        ...payload,
        qrCodeData: qrData,
        qrCodeUrl: `https://animalrescue.bengaluru.gov.in/animals/${caseId}`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Animal digital profile created with QR code record',
      animal,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/animals/:id
exports.updateAnimalProfile = async (req, res, next) => {
  try {
    const { name, photos, identifyingMarkings, medicalNotes, treatment, status } = req.body;

    const validStatuses = ['in_treatment', 'sheltered', 'adopted', 'released', 'deceased'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let animal;
    if (isDbConnected()) {
      animal = await Animal.findById(req.params.id);
      if (!animal) return res.status(404).json({ error: 'Animal record not found' });

      if (name !== undefined) animal.name = name;
      if (photos !== undefined) animal.photos = photos;
      if (identifyingMarkings !== undefined) animal.identifyingMarkings = identifyingMarkings;
      if (medicalNotes !== undefined) animal.medicalNotes = medicalNotes;
      if (treatment !== undefined) animal.treatment = treatment;
      if (status !== undefined) animal.status = status;

      if (!animal.qrCodeData) {
        animal.qrCodeData = await generateQrCode(animal._id, animal.caseId);
      }
      await animal.save();
    } else {
      animal = getAnimalById(req.params.id);
      if (!animal) return res.status(404).json({ error: 'Animal record not found' });
      Object.assign(animal, { name, photos, identifyingMarkings, medicalNotes, treatment, status });
    }

    res.json({
      success: true,
      message: 'Animal digital profile updated successfully',
      animal,
    });
  } catch (err) {
    next(err);
  }
};

module.exports.generateQrCode = generateQrCode;

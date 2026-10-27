const mongoose = require('mongoose');
const Adoption = require('../models/Adoption');
const {
  isDbConnected,
  saveAdoption,
  getAdoptionById,
  getAllAdoptions,
  updateAdoption,
  deleteAdoption,
  addAdoptionRequest,
} = require('../utils/devStore');
const {
  parsePaginationParams,
  buildPaginationMetadata,
  paginateArray,
} = require('../utils/pagination');

const VALID_SPECIES = ['dog', 'cat', 'bird', 'cattle', 'other'];
const VALID_STATUSES = ['available', 'pending', 'adopted'];

function isValidId(id) {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id) || typeof id === 'string';
}

// GET /api/v1/adoptions
exports.listAdoptions = async (req, res, next) => {
  try {
    const { species, status } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query);

    if (isDbConnected()) {
      const filter = {};
      if (status) {
        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }
        filter.status = status;
      } else {
        filter.status = 'available';
      }
      if (species) {
        filter.species = species.toLowerCase().trim();
      }

      const total = await Adoption.countDocuments(filter);
      const items = await Adoption.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate('animal')
        .lean();

      const pagination = buildPaginationMetadata(total, page, limit);
      return res.json({
        success: true,
        count: items.length,
        items,
        adoptions: items,
        pagination,
      });
    }

    // In-memory mode
    const filter = {};
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      filter.status = status;
    } else {
      filter.status = 'available';
    }
    if (species) filter.species = species.toLowerCase().trim();

    const all = getAllAdoptions(filter);
    const { items, pagination } = paginateArray(all, page, limit);

    res.json({
      success: true,
      count: items.length,
      items,
      adoptions: items,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/adoptions/:id
exports.getAdoptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || (isDbConnected() && !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid adoption ID format' });
    }

    let adoption;
    if (isDbConnected()) {
      adoption = await Adoption.findById(id).populate('animal').lean();
    } else {
      adoption = getAdoptionById(id);
    }

    if (!adoption) {
      return res.status(404).json({ error: 'Adoption listing not found' });
    }

    res.json({ success: true, adoption });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/adoptions
exports.createAdoption = async (req, res, next) => {
  try {
    const {
      name,
      species,
      breed,
      age,
      gender,
      size,
      vaccinated,
      sterilised,
      temperament,
      photos,
      description,
      medicalSummary,
      location,
      animalId,
    } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: 'name and species are required' });
    }

    const cleanSpecies = species.toLowerCase().trim();
    if (!VALID_SPECIES.includes(cleanSpecies)) {
      return res.status(400).json({ error: `species must be one of: ${VALID_SPECIES.join(', ')}` });
    }

    const payload = {
      name: name.trim(),
      species: cleanSpecies,
      breed: breed || 'Indie mix',
      age: age || 'Unknown',
      gender: ['Male', 'Female', 'Unknown'].includes(gender) ? gender : 'Unknown',
      size: ['Small', 'Medium', 'Large'].includes(size) ? size : 'Medium',
      vaccinated: Boolean(vaccinated),
      sterilised: Boolean(sterilised),
      temperament: Array.isArray(temperament) ? temperament : [],
      photos: Array.isArray(photos) ? photos : [],
      description: description || '',
      medicalSummary: medicalSummary || '',
      location: location || 'Bengaluru',
      status: 'available',
      animal: animalId && mongoose.Types.ObjectId.isValid(animalId) ? animalId : null,
      createdBy: req.user ? req.user.id : null,
      requests: [],
    };

    let adoption;
    if (isDbConnected()) {
      adoption = await Adoption.create(payload);
    } else {
      adoption = saveAdoption(payload);
    }

    res.status(201).json({
      success: true,
      message: 'Adoption listing created successfully',
      adoption,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/adoptions/:id
exports.updateAdoption = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || (isDbConnected() && !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid adoption ID format' });
    }

    const {
      name,
      species,
      breed,
      age,
      gender,
      size,
      vaccinated,
      sterilised,
      temperament,
      photos,
      description,
      medicalSummary,
      location,
      status,
    } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    if (species && !VALID_SPECIES.includes(species.toLowerCase().trim())) {
      return res.status(400).json({ error: `species must be one of: ${VALID_SPECIES.join(', ')}` });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (species !== undefined) updates.species = species.toLowerCase().trim();
    if (breed !== undefined) updates.breed = breed;
    if (age !== undefined) updates.age = age;
    if (gender !== undefined) updates.gender = gender;
    if (size !== undefined) updates.size = size;
    if (vaccinated !== undefined) updates.vaccinated = Boolean(vaccinated);
    if (sterilised !== undefined) updates.sterilised = Boolean(sterilised);
    if (temperament !== undefined) updates.temperament = temperament;
    if (photos !== undefined) updates.photos = photos;
    if (description !== undefined) updates.description = description;
    if (medicalSummary !== undefined) updates.medicalSummary = medicalSummary;
    if (location !== undefined) updates.location = location;
    if (status !== undefined) updates.status = status;

    let adoption;
    if (isDbConnected()) {
      adoption = await Adoption.findByIdAndUpdate(id, updates, { new: true });
      if (!adoption) return res.status(404).json({ error: 'Adoption listing not found' });
    } else {
      adoption = updateAdoption(id, updates);
      if (!adoption) return res.status(404).json({ error: 'Adoption listing not found' });
    }

    res.json({
      success: true,
      message: 'Adoption listing updated successfully',
      adoption,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/adoptions/:id
exports.deleteAdoption = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || (isDbConnected() && !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid adoption ID format' });
    }

    if (isDbConnected()) {
      const removed = await Adoption.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ error: 'Adoption listing not found' });
    } else {
      const removed = deleteAdoption(id);
      if (!removed) return res.status(404).json({ error: 'Adoption listing not found' });
    }

    res.json({ success: true, message: 'Adoption listing removed successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/adoptions/:id/requests
exports.submitAdoptionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || (isDbConnected() && !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid adoption ID format' });
    }

    const { name, phone, area, reason } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone are required' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number is required' });
    }

    let adoption;
    if (isDbConnected()) {
      adoption = await Adoption.findById(id);
    } else {
      adoption = getAdoptionById(id);
    }

    if (!adoption) {
      return res.status(404).json({ error: 'Adoption listing not found' });
    }

    if (adoption.status === 'adopted') {
      return res.status(400).json({ error: 'This animal has already been adopted' });
    }

    const requestPayload = {
      name: name.trim(),
      phone: phone.trim(),
      area: (area || '').trim(),
      reason: (reason || '').trim(),
      status: 'pending',
      user: req.user ? req.user.id : null,
      createdAt: new Date(),
    };

    let savedReq;
    if (isDbConnected()) {
      adoption.requests.push(requestPayload);
      await adoption.save();
      savedReq = adoption.requests[adoption.requests.length - 1];
    } else {
      savedReq = addAdoptionRequest(id, requestPayload);
    }

    res.status(201).json({
      success: true,
      message: 'Adoption request submitted successfully',
      request: savedReq,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/adoptions/:id/requests
exports.listAdoptionRequests = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || (isDbConnected() && !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid adoption ID format' });
    }

    let adoption;
    if (isDbConnected()) {
      adoption = await Adoption.findById(id).lean();
    } else {
      adoption = getAdoptionById(id);
    }

    if (!adoption) {
      return res.status(404).json({ error: 'Adoption listing not found' });
    }

    res.json({
      success: true,
      requests: adoption.requests || [],
    });
  } catch (err) {
    next(err);
  }
};

const Rescuer = require('../models/Rescuer');
const User = require('../models/User');
const {
  isDbConnected,
  getRescuerByUserId,
  getAllRescuers,
  saveRescuer,
  updateRescuer,
  populateRescuer,
} = require('../utils/devStore');

// POST /api/v1/rescuers/profile (Create or Update profile)
exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { organizationName, animalsHandled, location, available } = req.body;

    if (!isDbConnected()) {
      // In-memory development store fallback
      let rescuer = getRescuerByUserId(userId);

      if (rescuer) {
        const updates = {};
        if (organizationName !== undefined) updates.organizationName = organizationName;
        if (animalsHandled !== undefined) updates.animalsHandled = animalsHandled;
        if (location !== undefined) updates.location = location;
        if (available !== undefined) updates.available = Boolean(available);
        rescuer = updateRescuer(userId, updates);
      } else {
        rescuer = saveRescuer({
          user: userId,
          organizationName: organizationName || '',
          animalsHandled: animalsHandled || ['dog', 'cat'],
          location: location || { latitude: 12.9716, longitude: 77.5946 },
          available: available !== undefined ? Boolean(available) : true,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Rescuer profile updated successfully',
        rescuer: populateRescuer(rescuer),
      });
    }

    let rescuer = await Rescuer.findOne({ user: userId });

    if (rescuer) {
      if (organizationName !== undefined) rescuer.organizationName = organizationName;
      if (animalsHandled !== undefined) rescuer.animalsHandled = animalsHandled;
      if (location !== undefined) rescuer.location = location;
      if (available !== undefined) rescuer.available = available;
      await rescuer.save();
    } else {
      rescuer = await Rescuer.create({
        user: userId,
        organizationName: organizationName || '',
        animalsHandled: animalsHandled || ['dog', 'cat'],
        location: location || { latitude: 12.9716, longitude: 77.5946 },
        available: available !== undefined ? available : true,
      });
    }

    const populated = await Rescuer.findById(rescuer._id).populate('user', 'name phone role');

    res.status(200).json({
      success: true,
      message: 'Rescuer profile updated successfully',
      rescuer: populated,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/rescuers/profile
exports.getProfile = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      const rescuer = getRescuerByUserId(req.user.id);
      if (!rescuer) {
        return res.status(404).json({ error: 'Rescuer profile not found. Please create one.' });
      }
      return res.json({ success: true, rescuer: populateRescuer(rescuer) });
    }

    const rescuer = await Rescuer.findOne({ user: req.user.id }).populate(
      'user',
      'name phone role'
    );

    if (!rescuer) {
      return res.status(404).json({ error: 'Rescuer profile not found. Please create one.' });
    }

    res.json({ success: true, rescuer });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/rescuers/availability
exports.updateAvailability = async (req, res, next) => {
  try {
    const { available } = req.body;
    if (available === undefined) {
      return res.status(400).json({ error: 'available (boolean) is required' });
    }

    let rescuer;
    if (!isDbConnected()) {
      rescuer = updateRescuer(req.user.id, { available: Boolean(available) });
    } else {
      rescuer = await Rescuer.findOneAndUpdate(
        { user: req.user.id },
        { available: Boolean(available) },
        { new: true }
      );
    }

    if (!rescuer) {
      return res.status(404).json({ error: 'Rescuer profile not found' });
    }

    res.json({
      success: true,
      message: `Availability updated to ${available}`,
      available: rescuer.available,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/rescuers/location
exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }

    const location = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
    if (Number.isNaN(location.latitude) || Number.isNaN(location.longitude)) {
      return res.status(400).json({ error: 'latitude and longitude must be numbers' });
    }

    let rescuer;
    if (!isDbConnected()) {
      rescuer = updateRescuer(req.user.id, { location });
    } else {
      rescuer = await Rescuer.findOneAndUpdate({ user: req.user.id }, { location }, { new: true });
    }

    if (!rescuer) {
      return res.status(404).json({ error: 'Rescuer profile not found' });
    }

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: rescuer.location,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/rescuers (List all rescuers)
exports.listRescuers = async (req, res, next) => {
  try {
    const { available, animalType } = req.query;

    if (!isDbConnected()) {
      let rescuers = getAllRescuers();
      if (available !== undefined) {
        rescuers = rescuers.filter((r) => r.available === (available === 'true'));
      }
      if (animalType) {
        const type = animalType.toLowerCase();
        rescuers = rescuers.filter((r) => (r.animalsHandled || []).includes(type));
      }
      const populated = rescuers.map(populateRescuer);
      return res.json({ success: true, count: populated.length, rescuers: populated });
    }

    const filter = {};

    if (available !== undefined) {
      filter.available = available === 'true';
    }
    if (animalType) {
      filter.animalsHandled = animalType.toLowerCase();
    }

    const rescuers = await Rescuer.find(filter).populate('user', 'name phone role');

    res.json({ success: true, count: rescuers.length, rescuers });
  } catch (err) {
    next(err);
  }
};

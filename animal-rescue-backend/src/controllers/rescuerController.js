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
const {
  parsePaginationParams,
  buildPaginationMetadata,
  paginateArray,
} = require('../utils/pagination');

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

    const rescuer = await Rescuer.findOne({ user: req.user.id })
      .populate('user', 'name phone role')
      .lean();

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

// POST /api/v1/rescuers/device-token
exports.updateDeviceToken = async (req, res, next) => {
  try {
    const rawToken = req.body.token || req.body.fcmToken;
    if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
      return res.status(400).json({ error: 'Device token string is required' });
    }

    const token = rawToken.trim();
    const userId = req.user.id;

    if (!isDbConnected()) {
      // Clear token from any other rescuer in devStore to avoid duplicate deliveries
      const all = getAllRescuers();
      for (const r of all) {
        if (r.user !== userId && r.fcmToken === token) {
          updateRescuer(r.user, { fcmToken: null });
        }
      }
      let rescuer = updateRescuer(userId, { fcmToken: token });
      if (!rescuer) {
        rescuer = saveRescuer({ user: userId, fcmToken: token });
      }
      return res.status(200).json({
        success: true,
        message: 'Device token registered successfully',
      });
    }

    // Remove token from any other rescuer who previously used this device
    await Rescuer.updateMany({ fcmToken: token, user: { $ne: userId } }, { fcmToken: null });

    const rescuer = await Rescuer.findOneAndUpdate(
      { user: userId },
      { fcmToken: token },
      { new: true }
    );

    if (!rescuer) {
      return res.status(404).json({ error: 'Rescuer profile not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Device token registered successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/rescuers (List all rescuers)
exports.listRescuers = async (req, res, next) => {
  try {
    const { available, animalType } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query);

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
      const { items, pagination } = paginateArray(populated, page, limit);
      return res.json({ success: true, count: items.length, rescuers: items, pagination });
    }

    const filter = {};

    if (available !== undefined) {
      filter.available = available === 'true';
    }
    if (animalType) {
      filter.animalsHandled = animalType.toLowerCase();
    }

    const total = await Rescuer.countDocuments(filter);
    const rescuers = await Rescuer.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name phone role')
      .lean();

    const pagination = buildPaginationMetadata(total, page, limit);
    res.json({ success: true, count: rescuers.length, rescuers, pagination });
  } catch (err) {
    next(err);
  }
};

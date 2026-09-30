const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Rescuer = require('../models/Rescuer');
const { isDbConnected, getUserByPhone, saveUser, saveRescuer, getRescuerByUserId } = require('../utils/devStore');

const JWT_SECRET = process.env.JWT_SECRET || 'animal_rescue_dev_secret_key_2026';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/v1/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, phone, password, role, organizationName, animalsHandled, location } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ error: 'name, phone, password and role are required' });
    }

    if (!['citizen', 'rescuer', 'coordinator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'role must be citizen, rescuer, coordinator, or admin' });
    }

    const cleanPhone = phone.toString().trim();

    if (isDbConnected()) {
      const existingUser = await User.findOne({ phone: cleanPhone });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, phone: cleanPhone, passwordHash, role });

      let rescuerProfile = null;
      if (role === 'rescuer') {
        rescuerProfile = await Rescuer.create({
          user: user._id,
          organizationName: organizationName || 'Independent Rescuer',
          animalsHandled: Array.isArray(animalsHandled) && animalsHandled.length > 0 ? animalsHandled : ['dog', 'cat'],
          location: location || { latitude: 12.9716, longitude: 77.5946 },
        });
      }

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        id: user._id,
        role: user.role,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          organizationName: rescuerProfile?.organizationName,
          animalsHandled: rescuerProfile?.animalsHandled,
        },
        token,
      });
    } else {
      // In-memory development store fallback
      const existingUser = getUserByPhone(cleanPhone);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = saveUser({
        name,
        phone: cleanPhone,
        passwordHash,
        role,
        profilePhotoUrl: '',
      });

      let rescuerProfile = null;
      if (role === 'rescuer') {
        rescuerProfile = saveRescuer({
          user: user._id,
          organizationName: organizationName || 'Independent Rescuer',
          animalsHandled: Array.isArray(animalsHandled) && animalsHandled.length > 0 ? animalsHandled : ['dog', 'cat'],
          location: location || { latitude: 12.9716, longitude: 77.5946 },
        });
      }

      const token = generateToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully (dev)',
        id: user._id,
        role: user.role,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          organizationName: rescuerProfile?.organizationName,
          animalsHandled: rescuerProfile?.animalsHandled,
        },
        token,
      });
    }
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'phone and password are required' });
    }

    const cleanPhone = phone.toString().trim();
    let user = null;

    if (isDbConnected()) {
      user = await User.findOne({ phone: cleanPhone });
    } else {
      user = getUserByPhone(cleanPhone);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    let rescuerProfile = null;
    if (user.role === 'rescuer') {
      if (isDbConnected()) {
        rescuerProfile = await Rescuer.findOne({ user: user._id });
      } else {
        rescuerProfile = getRescuerByUserId(user._id);
      }
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        organizationName: rescuerProfile?.organizationName || '',
        animalsHandled: rescuerProfile?.animalsHandled || ['dog', 'cat'],
      },
    });
  } catch (err) {
    next(err);
  }
};

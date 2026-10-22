const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Rescuer = require('../models/Rescuer');
const { isValidPhoneNumber } = require('../middleware/validation');
const {
  isDbConnected,
  getUserByPhone,
  saveUser,
  updateUser,
  saveRescuer,
  getRescuerByUserId,
  usersMap,
} = require('../utils/devStore');

const { JWT_SECRET } = require('../config/jwt');

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
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { name, phone, password, role, organizationName, animalsHandled, location } = req.body;

    if (!name || typeof name !== 'string' || !name.trim() ||
        !phone || typeof phone !== 'string' || !phone.trim() ||
        !password || typeof password !== 'string' ||
        !role || typeof role !== 'string' || !role.trim()) {
      return res.status(400).json({ error: 'name, phone, password and role are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    if (password.trim().length === 0) {
      return res.status(400).json({ error: 'password cannot be only whitespace' });
    }

    const normalizedRole = role.trim();

    // Anyone can sign up as a citizen or a rescuer. Coordinator and admin accounts are created by the
    // project team (see scripts/seedRescuers.js), never through public sign-up.
    if (!['citizen', 'rescuer'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'role must be citizen or rescuer' });
    }

    const cleanPhone = phone.trim();
    if (!isValidPhoneNumber(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }

    const cleanName = name.trim();

    if (isDbConnected()) {
      const existingUser = await User.findOne({ phone: cleanPhone });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name: cleanName, phone: cleanPhone, passwordHash, role: normalizedRole });

      let rescuerProfile = null;
      if (normalizedRole === 'rescuer') {
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
        name: cleanName,
        phone: cleanPhone,
        passwordHash,
        role: normalizedRole,
        profilePhotoUrl: '',
      });

      let rescuerProfile = null;
      if (normalizedRole === 'rescuer') {
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
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { phone, password } = req.body;

    if (!phone || typeof phone !== 'string' || !phone.trim() ||
        !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'phone and password are required' });
    }

    const cleanPhone = phone.trim();
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

// POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'phone is required' });
    }

    const cleanPhone = phone.trim();
    if (!isValidPhoneNumber(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }

    let user = null;

    if (isDbConnected()) {
      user = await User.findOne({ phone: cleanPhone });
    } else {
      user = getUserByPhone(cleanPhone);
    }

    // Always return a generic success message to prevent user enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with this phone number, a password reset token has been issued.',
    };

    if (!user) {
      return res.json(genericResponse);
    }

    // Generate cryptographically secure random token (64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lifetime

    if (isDbConnected()) {
      user.resetPasswordTokenHash = resetPasswordTokenHash;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();
    } else {
      updateUser(cleanPhone, {
        resetPasswordTokenHash,
        resetPasswordExpires,
      });
    }

    // In development or test environments without SMS gateway configured, return token for verification
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        ...genericResponse,
        resetToken, // Dev/test verification only
      });
    }

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { token, newPassword } = req.body;

    const isTokenMissing = !token || typeof token !== 'string' || !token.trim();
    const isPasswordMissing = !newPassword || typeof newPassword !== 'string';

    if (isTokenMissing && isPasswordMissing) {
      return res.status(400).json({ error: 'token and newPassword are required' });
    }
    if (isTokenMissing) {
      return res.status(400).json({ error: 'token is required' });
    }
    if (isPasswordMissing) {
      return res.status(400).json({ error: 'newPassword is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (newPassword.trim().length === 0) {
      return res.status(400).json({ error: 'Password cannot be only whitespace' });
    }

    const cleanToken = token.trim();
    const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');

    // Quick pre-check for token validity before executing password hashing
    if (isDbConnected()) {
      const exists = await User.findOne({
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
      });
      if (!exists) {
        return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
      }
    } else {
      const exists = Array.from(usersMap.values()).find(
        (u) =>
          u.resetPasswordTokenHash === tokenHash &&
          u.resetPasswordExpires &&
          new Date(u.resetPasswordExpires).getTime() > Date.now()
      );
      if (!exists) {
        return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
      }
    }

    // Hash the new password directly without silently trimming or altering valid passwords
    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (isDbConnected()) {
      // Atomic conditional update in MongoDB matching token and unexpired lifetime
      const updatedUser = await User.findOneAndUpdate(
        {
          resetPasswordTokenHash: tokenHash,
          resetPasswordExpires: { $gt: new Date() },
        },
        {
          $set: {
            passwordHash,
            resetPasswordTokenHash: null,
            resetPasswordExpires: null,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
      }
    } else {
      // Synchronous atomic check-and-consume in DevStore after async hashing
      const user = Array.from(usersMap.values()).find(
        (u) =>
          u.resetPasswordTokenHash === tokenHash &&
          u.resetPasswordExpires &&
          new Date(u.resetPasswordExpires).getTime() > Date.now()
      );

      if (!user) {
        return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
      }

      updateUser(user.phone, {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpires: null,
      });
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

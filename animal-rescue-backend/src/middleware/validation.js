const { body, validationResult } = require('express-validator');

// Reusable middleware that checks for express-validator errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array();
    // Return first error message as 'error' for backwards compatibility
    return res.status(400).json({
      error: errorList[0].msg,
      errors: errorList.map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Helper to validate phone format
const isValidPhoneNumber = (value) => {
  if (!value || typeof value !== 'string') return false;
  const cleaned = value.replace(/[\s\-\(\)]/g, '');
  // Accepts standard Indian mobile format (optionally with +91 or 0 prefix) or valid 10-15 digit phone
  const indianMobileRegex = /^(\+91|0)?[6-9]\d{9}$/;
  const generalPhoneRegex = /^\+?[0-9]{10,15}$/;
  return indianMobileRegex.test(cleaned) || generalPhoneRegex.test(cleaned);
};

const validatePhoneNumber = (value) => {
  if (!isValidPhoneNumber(value)) {
    throw new Error('Please enter a valid phone number');
  }
  return true;
};

// Auth: Registration validation rules
const registerValidation = [
  body('name')
    .custom((val) => typeof val === 'string' && val.trim().length > 0)
    .withMessage('name is required')
    .custom((val) => typeof val === 'string' && val.trim().length >= 2 && val.trim().length <= 100)
    .withMessage('name must be between 2 and 100 characters'),
  body('phone')
    .custom((val) => typeof val === 'string' && val.trim().length > 0)
    .withMessage('phone is required')
    .custom(validatePhoneNumber),
  body('password')
    .custom((val) => typeof val === 'string' && val.length > 0)
    .withMessage('password is required')
    .custom((val) => typeof val === 'string' && val.length >= 6)
    .withMessage('password must be at least 6 characters'),
  body('role')
    .custom((val) => typeof val === 'string' && val.trim().length > 0)
    .withMessage('role is required')
    .custom((val) => typeof val === 'string' && ['citizen', 'rescuer'].includes(val.trim()))
    .withMessage('role must be citizen or rescuer'),
  body('animalsHandled')
    .optional()
    .isArray()
    .withMessage('animalsHandled must be an array of animal categories'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('latitude must be between -90 and 90'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180'),
  validate,
];

// Auth: Login validation rules
const loginValidation = [
  body('phone')
    .custom((val) => typeof val === 'string' && val.trim().length > 0)
    .withMessage('phone is required'),
  body('password')
    .custom((val) => typeof val === 'string' && val.length > 0)
    .withMessage('password is required'),
  validate,
];

// Auth: Forgot password validation rules
const forgotPasswordValidation = [
  body('phone')
    .custom((val) => typeof val === 'string' && val.trim().length > 0)
    .withMessage('phone is required')
    .custom(validatePhoneNumber),
  validate,
];

// Report: Emergency submission validation rules
const reportValidation = [
  body('animalType')
    .trim()
    .notEmpty()
    .withMessage('animalType, latitude, and longitude are required to submit an emergency report')
    .isLength({ max: 50 })
    .withMessage('animalType cannot exceed 50 characters'),
  body('latitude')
    .notEmpty()
    .withMessage('animalType, latitude, and longitude are required to submit an emergency report')
    .isFloat({ min: -90, max: 90 })
    .withMessage('latitude must be between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('animalType, latitude, and longitude are required to submit an emergency report')
    .isFloat({ min: -180, max: 180 })
    .withMessage('longitude must be between -180 and 180'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('description cannot exceed 2000 characters'),
  body('clientRequestId')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('clientRequestId cannot exceed 100 characters'),
  body('urgency')
    .optional()
    .toUpperCase()
    .isIn(['LOW', 'MEDIUM', 'HIGH'])
    .withMessage('urgency must be LOW, MEDIUM, or HIGH'),
  validate,
];

module.exports = {
  validate,
  isValidPhoneNumber,
  validatePhoneNumber,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  reportValidation,
};


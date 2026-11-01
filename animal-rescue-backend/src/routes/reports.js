const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { optionalProtect } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimiter');
const { reportValidation } = require('../middleware/validation');

// POST /api/v1/reports (Citizen or Guest report)
router.post('/', reportLimiter, reportValidation, optionalProtect, reportController.createReport);

module.exports = router;

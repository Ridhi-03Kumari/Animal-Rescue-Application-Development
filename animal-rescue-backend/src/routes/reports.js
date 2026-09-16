const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { optionalProtect } = require('../middleware/auth');

// POST /api/v1/reports (Citizen or Guest report)
router.post('/', optionalProtect, reportController.createReport);

module.exports = router;

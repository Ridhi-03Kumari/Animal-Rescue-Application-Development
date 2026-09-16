const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { protect, optionalProtect } = require('../middleware/auth');

// GET /api/v1/cases/my-reports (Must be before /:id route)
router.get('/my-reports', protect, caseController.getMyReports);

// GET /api/v1/cases
router.get('/', optionalProtect, caseController.getAllCases);

// GET /api/v1/cases/:id
router.get('/:id', optionalProtect, caseController.getCaseById);

// PATCH /api/v1/cases/:id/status
router.patch('/:id/status', optionalProtect, caseController.updateCaseStatus);

module.exports = router;

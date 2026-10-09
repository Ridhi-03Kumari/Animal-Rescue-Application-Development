const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const { protect, optionalProtect, authorize } = require('../middleware/auth');

// GET /api/v1/cases/my-reports (Must be before /:id route)
router.get('/my-reports', protect, caseController.getMyReports);

// GET /api/v1/cases  (signed in: a citizen sees their reports, a rescuer their cases, staff everything)
router.get('/', protect, caseController.getAllCases);

// GET /api/v1/cases/:id  (open so a guest can follow the report they just sent)
router.get('/:id', optionalProtect, caseController.getCaseById);

// PATCH /api/v1/cases/:id/status  (the assigned rescuer, or a coordinator / admin)
router.patch(
  '/:id/status',
  protect,
  authorize('rescuer', 'coordinator', 'admin'),
  caseController.updateCaseStatus
);

module.exports = router;

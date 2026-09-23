const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinatorController');
const { protect, authorize } = require('../middleware/auth');

// Coordinator / Admin routes
router.use(protect);
router.use(authorize('coordinator', 'admin'));

// Cases requiring manual intervention
router.get('/cases', coordinatorController.getEscalatedCases);
router.post('/cases/:id/assign', coordinatorController.manualAssignCase);

// Rescuer approval
router.patch('/rescuers/:id/verify', coordinatorController.verifyRescuer);

// Operational Dashboard stats
router.get('/stats', coordinatorController.getSystemStats);

module.exports = router;

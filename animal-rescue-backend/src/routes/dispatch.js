const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { protect, authorize } = require('../middleware/auth');

// Everything here is for signed-in rescuers only
router.use(protect);
router.use(authorize('rescuer'));

// Rescuer response routes (supports both /:id/accept and /cases/:id/accept)
router.post('/:id/accept', dispatchController.acceptCase);
router.post('/:id/decline', dispatchController.declineCase);
router.post('/cases/:id/accept', dispatchController.acceptCase);
router.post('/cases/:id/decline', dispatchController.declineCase);

// Active case and nearby cases
router.get('/active', dispatchController.getActiveCase);
router.get('/nearby', dispatchController.getNearbyCases);

module.exports = router;

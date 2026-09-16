const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { protect, optionalProtect } = require('../middleware/auth');

// Rescuer response routes (supports both /:id/accept and /cases/:id/accept)
router.post('/:id/accept', optionalProtect, dispatchController.acceptCase);
router.post('/:id/decline', optionalProtect, dispatchController.declineCase);
router.post('/cases/:id/accept', optionalProtect, dispatchController.acceptCase);
router.post('/cases/:id/decline', optionalProtect, dispatchController.declineCase);

// Active case and nearby cases
router.get('/active', protect, dispatchController.getActiveCase);
router.get('/nearby', protect, dispatchController.getNearbyCases);

module.exports = router;

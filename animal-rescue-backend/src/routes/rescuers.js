const express = require('express');
const router = express.Router();
const rescuerController = require('../controllers/rescuerController');
const { protect, optionalProtect } = require('../middleware/auth');

// Profile routes
router.get('/profile', protect, rescuerController.getProfile);
router.post('/profile', protect, rescuerController.createOrUpdateProfile);
router.patch('/availability', protect, rescuerController.updateAvailability);
router.patch('/location', protect, rescuerController.updateLocation);

// List rescuers
router.get('/', optionalProtect, rescuerController.listRescuers);

module.exports = router;

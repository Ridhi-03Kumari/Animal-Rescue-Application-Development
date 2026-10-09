const express = require('express');
const router = express.Router();
const rescuerController = require('../controllers/rescuerController');
const { protect, authorize } = require('../middleware/auth');

// Profile routes (a rescuer's own profile)
router.get('/profile', protect, authorize('rescuer'), rescuerController.getProfile);
router.post('/profile', protect, authorize('rescuer'), rescuerController.createOrUpdateProfile);
router.patch('/availability', protect, authorize('rescuer'), rescuerController.updateAvailability);
router.patch('/location', protect, authorize('rescuer'), rescuerController.updateLocation);

// List rescuers (includes phone numbers, so staff only)
router.get('/', protect, authorize('coordinator', 'admin'), rescuerController.listRescuers);

module.exports = router;

const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const { protect, optionalProtect, authorize } = require('../middleware/auth');

// Public listing and detail
router.get('/', optionalProtect, adoptionController.listAdoptions);
router.get('/:id', optionalProtect, adoptionController.getAdoptionById);

// Public / Citizen submit adoption request
router.post('/:id/requests', optionalProtect, adoptionController.submitAdoptionRequest);

// Staff management (rescuer, coordinator, admin)
router.post('/', protect, authorize('rescuer', 'coordinator', 'admin'), adoptionController.createAdoption);
router.patch('/:id', protect, authorize('rescuer', 'coordinator', 'admin'), adoptionController.updateAdoption);
router.get('/:id/requests', protect, authorize('rescuer', 'coordinator', 'admin'), adoptionController.listAdoptionRequests);

// Deletion restricted to coordinator & admin
router.delete('/:id', protect, authorize('coordinator', 'admin'), adoptionController.deleteAdoption);

module.exports = router;

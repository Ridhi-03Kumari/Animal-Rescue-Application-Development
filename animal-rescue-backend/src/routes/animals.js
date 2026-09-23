const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const { protect, optionalProtect } = require('../middleware/auth');

// Public QR Code Lookup (scanned from phone camera or app)
router.get('/qr/:identifier', animalController.lookupByQr);

// Animal Profiles
router.get('/', optionalProtect, animalController.listAnimals);
router.get('/:id', optionalProtect, animalController.getAnimalById);
router.get('/case/:caseId', optionalProtect, animalController.getAnimalByCaseId);

// Update/Create (Rescuer or Coordinator)
router.post('/', protect, animalController.createAnimalProfile);
router.patch('/:id', protect, animalController.updateAnimalProfile);

module.exports = router;

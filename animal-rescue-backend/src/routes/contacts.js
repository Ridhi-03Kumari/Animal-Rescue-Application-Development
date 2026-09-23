const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// GET /api/v1/contacts (Public directory of helplines & shelters)
router.get('/', contactController.getEmergencyContacts);

module.exports = router;

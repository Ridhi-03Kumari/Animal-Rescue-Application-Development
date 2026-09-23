const express = require('express');
const router = express.Router();
const { assessUrgency } = require('../services/aiTriageService');

// POST /api/v1/triage
router.post('/', async (req, res, next) => {
  try {
    const { animalType, description, photoUrl } = req.body;
    const triageResult = await assessUrgency({
      animalType: animalType || 'animal',
      description: description || '',
      photoUrl: photoUrl || '',
    });

    res.json({
      success: true,
      triage: triageResult,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

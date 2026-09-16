const Case = require('../models/Case');
const dispatchService = require('../services/dispatchService');

// POST /api/v1/reports
exports.createReport = async (req, res, next) => {
  try {
    const {
      animalType,
      description,
      photoUrl,
      latitude,
      longitude,
      address,
      urgency,
      reporterName,
      reporterPhone,
    } = req.body;

    if (!animalType || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'animalType, latitude, and longitude are required to submit an emergency report',
      });
    }

    const citizenId = req.user ? req.user.id : null;
    const initialUrgency = ['LOW', 'MEDIUM', 'HIGH'].includes((urgency || '').toUpperCase())
      ? urgency.toUpperCase()
      : 'MEDIUM';

    // Create the case record
    const newCase = await Case.create({
      citizen: citizenId,
      reporterName: reporterName || (req.user ? req.user.name : 'Anonymous Citizen'),
      reporterPhone: reporterPhone || '',
      animalType: animalType.toLowerCase().trim(),
      description: description || '',
      photoUrl: photoUrl || '',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || '',
      },
      urgency: initialUrgency,
      status: 'reported',
      timeline: [
        {
          status: 'reported',
          timestamp: new Date(),
          note: 'Emergency rescue reported by citizen',
        },
      ],
    });

    // Start smart responder matching in background or synchronously
    let dispatchResult = null;
    try {
      dispatchResult = await dispatchService.dispatchCase(newCase._id);
    } catch (dispatchErr) {
      console.error('Dispatch error during report submission:', dispatchErr);
    }

    // Refresh case doc to return latest assigned state
    const populatedCase = await Case.findById(newCase._id)
      .populate('assignedRescuer')
      .populate('citizen', 'name phone');

    res.status(201).json({
      success: true,
      message: 'Rescue report submitted successfully',
      case: populatedCase,
      dispatch: dispatchResult
        ? {
            alertedRescuerId: dispatchResult.selectedRescuer._id,
            score: dispatchResult.score,
            distanceKm: dispatchResult.distance,
            attemptNumber: dispatchResult.attemptNumber,
          }
        : {
            message: 'No available rescuer found immediately. Case escalated.',
          },
    });
  } catch (err) {
    next(err);
  }
};

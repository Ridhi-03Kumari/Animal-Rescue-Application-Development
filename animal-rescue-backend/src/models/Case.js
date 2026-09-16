const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    citizen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Nullable for guest reports
    },
    reporterName: {
      type: String,
      default: 'Anonymous Citizen',
    },
    reporterPhone: {
      type: String,
      default: '',
    },
    animalType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, default: '' },
    },
    urgency: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: [
        'reported',
        'assigned',
        'accepted',
        'on_the_way',
        'reached_location',
        'animal_picked_up',
        'at_shelter',
        'treatment_started',
        'completed',
        'cancelled',
      ],
      default: 'reported',
    },
    assignedRescuer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rescuer',
      default: null,
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    medicalNotes: {
      type: String,
      default: '',
    },
    treatment: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Case', caseSchema);

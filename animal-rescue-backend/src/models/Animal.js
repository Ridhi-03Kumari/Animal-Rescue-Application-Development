const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
    },
    animalType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: '',
    },
    photos: [{ type: String }],
    foundLocation: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      address: { type: String, default: '' },
    },
    rescueDate: {
      type: Date,
      default: Date.now,
    },
    identifyingMarkings: {
      type: String,
      default: '',
    },
    medicalNotes: {
      type: String,
      default: '',
    },
    treatment: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_treatment', 'sheltered', 'adopted', 'released', 'deceased'],
      default: 'in_treatment',
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
    qrCodeData: {
      type: String, // Base64 Data URL for scannable QR tag
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Animal', animalSchema);

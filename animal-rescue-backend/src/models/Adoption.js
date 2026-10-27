const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const adoptionSchema = new mongoose.Schema(
  {
    animal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    species: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: ['dog', 'cat', 'bird', 'cattle', 'other'],
    },
    breed: {
      type: String,
      default: 'Indie mix',
      trim: true,
    },
    age: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Unknown'],
      default: 'Unknown',
    },
    size: {
      type: String,
      enum: ['Small', 'Medium', 'Large'],
      default: 'Medium',
    },
    vaccinated: {
      type: Boolean,
      default: false,
    },
    sterilised: {
      type: Boolean,
      default: false,
    },
    temperament: [{ type: String, trim: true }],
    photos: [{ type: String }],
    description: {
      type: String,
      default: '',
      trim: true,
    },
    medicalSummary: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: 'Bengaluru',
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'pending', 'adopted'],
      default: 'available',
      index: true,
    },
    requests: [adoptionRequestSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

adoptionSchema.index({ status: 1, species: 1, createdAt: -1 });
adoptionSchema.index({ animal: 1 });

module.exports = mongoose.model('Adoption', adoptionSchema);

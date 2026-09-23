const mongoose = require('mongoose');

const rescuerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    organizationName: { type: String, default: '' },
    animalsHandled: [{ type: String }],
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    available: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    activeCaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null },
    completedCasesCount: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0.9 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rescuer', rescuerSchema);

const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    rescuerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rescuer',
      required: false,
    },
    alertedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + (parseInt(process.env.ESCALATION_TIMEOUT_MS, 10) || 5 * 60 * 1000)),
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'accepted', 'declined', 'timeout', 'coordinator_escalated', 'cancelled'],
      default: 'pending',
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    responseTimeSeconds: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

escalationSchema.index({ status: 1, expiresAt: 1 });
escalationSchema.index({ caseId: 1, attemptNumber: 1 });

module.exports = mongoose.model('Escalation', escalationSchema);

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
      required: true,
    },
    alertedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'timeout', 'coordinator_escalated'],
      default: 'pending',
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

module.exports = mongoose.model('Escalation', escalationSchema);

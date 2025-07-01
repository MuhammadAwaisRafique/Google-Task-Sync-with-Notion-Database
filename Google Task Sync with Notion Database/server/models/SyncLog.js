const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  syncType: {
    type: String,
    enum: ['manual', 'automatic'],
    required: true
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'failed'],
    required: true
  },
  tasksProcessed: {
    type: Number,
    default: 0
  },
  tasksCreated: {
    type: Number,
    default: 0
  },
  tasksUpdated: {
    type: Number,
    default: 0
  },
  tasksErrored: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number // in milliseconds
  },
  errorMessage: String,
  details: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
syncLogSchema.index({ userId: 1, createdAt: -1 });
syncLogSchema.index({ status: 1 });

module.exports = mongoose.model('SyncLog', syncLogSchema);
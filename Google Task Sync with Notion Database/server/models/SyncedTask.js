const mongoose = require('mongoose');

const syncedTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  googleTaskId: {
    type: String,
    required: true
  },
  notionPageId: {
    type: String,
    required: true
  },
  taskTitle: {
    type: String,
    required: true
  },
  taskStatus: {
    type: String,
    enum: ['needsAction', 'completed'],
    default: 'needsAction'
  },
  taskListName: {
    type: String,
    default: 'My Tasks'
  },
  dueDate: Date,
  notes: String,
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  googleTaskData: {
    type: mongoose.Schema.Types.Mixed
  },
  notionPageData: {
    type: mongoose.Schema.Types.Mixed
  },
  syncStatus: {
    type: String,
    enum: ['success', 'error', 'pending'],
    default: 'success'
  },
  errorMessage: String
}, {
  timestamps: true
});

// Compound index for efficient lookups
syncedTaskSchema.index({ userId: 1, googleTaskId: 1 }, { unique: true });
syncedTaskSchema.index({ userId: 1, notionPageId: 1 });
syncedTaskSchema.index({ lastSyncedAt: -1 });

module.exports = mongoose.model('SyncedTask', syncedTaskSchema);
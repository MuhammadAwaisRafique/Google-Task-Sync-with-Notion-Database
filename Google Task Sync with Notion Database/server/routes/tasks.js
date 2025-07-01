const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const SyncedTask = require('../models/SyncedTask');

const router = express.Router();

// Get synced tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Convert userId to ObjectId if it's a string
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    const tasks = await SyncedTask.find({ userId: userIdObj })
      .sort({ lastSyncedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SyncedTask.countDocuments({ userId: userIdObj });

    res.json({
      tasks: tasks.map(task => ({
        id: task._id,
        googleTaskId: task.googleTaskId,
        notionPageId: task.notionPageId,
        title: task.taskTitle,
        status: task.taskStatus,
        taskList: task.taskListName,
        dueDate: task.dueDate,
        notes: task.notes,
        syncStatus: task.syncStatus,
        lastSyncedAt: task.lastSyncedAt,
        errorMessage: task.errorMessage
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      error: { message: 'Failed to get tasks' }
    });
  }
});

// Get task statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('Getting task stats for user:', userId);

    // Convert userId to ObjectId if it's a string
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId;

    // First, let's check if there are any tasks at all for this user
    const totalTasks = await SyncedTask.countDocuments({ userId: userIdObj });
    console.log('Total tasks found:', totalTasks);

    const stats = await SyncedTask.aggregate([
      { $match: { userId: userIdObj } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$taskStatus', 'completed'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$taskStatus', 'needsAction'] }, 1, 0] }
          },
          errors: {
            $sum: { $cond: [{ $eq: ['$syncStatus', 'error'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, completed: 0, pending: 0, errors: 0 };
    
    console.log('Task stats result:', result);

    res.json({
      total: result.total,
      completed: result.completed,
      pending: result.pending,
      errors: result.errors
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      error: { message: 'Failed to get task statistics' }
    });
  }
});

module.exports = router;
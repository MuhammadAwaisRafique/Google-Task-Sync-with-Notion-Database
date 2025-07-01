const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const SyncLog = require('../models/SyncLog');
const User = require('../models/User');
const syncService = require('../services/syncService');

const router = express.Router();

// Start manual sync
router.post('/start', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const startTime = Date.now();

  try {
    // Check if sync is already running
    const runningSyncLog = await SyncLog.findOne({
      userId,
      status: 'started'
    });

    if (runningSyncLog) {
      return res.status(409).json({
        error: { message: 'Sync is already running' }
      });
    }

    // Create sync log
    const syncLog = new SyncLog({
      userId,
      syncType: 'manual',
      status: 'started'
    });
    await syncLog.save();

    // Start sync process (don't await - run in background)
    syncService.performSync(userId, syncLog._id, startTime, 'manual').catch(error => {
      console.error('Background sync error:', error);
    });

    res.json({
      message: 'Sync started successfully',
      syncId: syncLog._id
    });

  } catch (error) {
    console.error('Start sync error:', error);
    res.status(500).json({
      error: { message: 'Failed to start sync' }
    });
  }
});

// Get sync status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get latest sync logs
    const recentLogs = await SyncLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get current sync status
    const currentSync = recentLogs.find(log => log.status === 'started');
    
    res.json({
      isRunning: !!currentSync,
      recentLogs: recentLogs.map(log => ({
        id: log._id,
        type: log.syncType,
        status: log.status,
        tasksProcessed: log.tasksProcessed,
        tasksCreated: log.tasksCreated,
        tasksUpdated: log.tasksUpdated,
        tasksErrored: log.tasksErrored,
        duration: log.duration,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt
      }))
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({
      error: { message: 'Failed to get sync status' }
    });
  }
});

// Update sync settings
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const { autoSync, syncInterval } = req.body;
    
    const user = await User.findById(req.user.userId);
    user.syncSettings = {
      ...user.syncSettings,
      autoSync: autoSync !== undefined ? autoSync : user.syncSettings.autoSync,
      syncInterval: syncInterval || user.syncSettings.syncInterval
    };

    await user.save();

    res.json({
      message: 'Sync settings updated successfully',
      settings: user.syncSettings
    });
  } catch (error) {
    console.error('Update sync settings error:', error);
    res.status(500).json({
      error: { message: 'Failed to update sync settings' }
    });
  }
});

module.exports = router;
const googleService = require('../services/googleService');
const notionService = require('../services/notionService');
const SyncedTask = require('../models/SyncedTask');
const SyncLog = require('../models/SyncLog');
const User = require('../models/User');

class SyncController {
  async startSync(req, res) {
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
      this.performSync(userId, syncLog._id, startTime).catch(error => {
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
  }

  async performSync(userId, syncLogId, startTime) {
    let syncLog;
    let tasksProcessed = 0;
    let tasksCreated = 0;
    let tasksUpdated = 0;
    let tasksErrored = 0;

    try {
      syncLog = await SyncLog.findById(syncLogId);
      const user = await User.findById(userId);

      if (!user || !user.notionConfig.isConfigured) {
        throw new Error('User not found or Notion not configured');
      }

      // Initialize Google service
      await googleService.initializeAuth(user);

      // Get tasks from Google Tasks
      const googleTasks = await googleService.getTasks(user);
      tasksProcessed = googleTasks.length;

      console.log(`Processing ${tasksProcessed} tasks for user ${userId}`);

      // Process each task
      for (const googleTask of googleTasks) {
        try {
          await this.syncTask(user, googleTask);
          
          // Check if task was created or updated
          const existingTask = await SyncedTask.findOne({
            userId,
            googleTaskId: googleTask.id
          });

          if (existingTask) {
            tasksUpdated++;
          } else {
            tasksCreated++;
          }

        } catch (taskError) {
          console.error(`Error syncing task ${googleTask.id}:`, taskError);
          tasksErrored++;

          // Update or create task with error status
          await SyncedTask.findOneAndUpdate(
            { userId, googleTaskId: googleTask.id },
            {
              taskTitle: googleTask.title || 'Untitled Task',
              taskStatus: googleTask.status || 'needsAction',
              syncStatus: 'error',
              errorMessage: taskError.message,
              lastSyncedAt: new Date()
            },
            { upsert: true }
          );
        }
      }

      // Update user's last sync time
      user.syncSettings.lastSyncAt = new Date();
      await user.save();

      // Update sync log with success
      const duration = Date.now() - startTime;
      await SyncLog.findByIdAndUpdate(syncLogId, {
        status: 'completed',
        tasksProcessed,
        tasksCreated,
        tasksUpdated,
        tasksErrored,
        duration
      });

      console.log(`Sync completed for user ${userId}: ${tasksCreated} created, ${tasksUpdated} updated, ${tasksErrored} errors`);

    } catch (error) {
      console.error('Sync error:', error);

      // Update sync log with failure
      if (syncLog) {
        const duration = Date.now() - startTime;
        await SyncLog.findByIdAndUpdate(syncLogId, {
          status: 'failed',
          tasksProcessed,
          tasksCreated,
          tasksUpdated,
          tasksErrored,
          duration,
          errorMessage: error.message
        });
      }
    }
  }

  async syncTask(user, googleTask) {
    const userId = user._id;

    // Check if task already exists
    let syncedTask = await SyncedTask.findOne({
      userId,
      googleTaskId: googleTask.id
    });

    if (syncedTask) {
      // Update existing task in Notion
      await notionService.updateTask(
        user.notionConfig.apiToken,
        syncedTask.notionPageId,
        googleTask
      );

      // Update synced task record
      syncedTask.taskTitle = googleTask.title || 'Untitled Task';
      syncedTask.taskStatus = googleTask.status || 'needsAction';
      syncedTask.lastSyncedAt = new Date();
      syncedTask.syncStatus = 'success';
      syncedTask.errorMessage = undefined;
      syncedTask.googleTaskData = googleTask;

      await syncedTask.save();

    } else {
      // Create new task in Notion
      const notionPage = await notionService.createTask(
        user.notionConfig.apiToken,
        user.notionConfig.databaseId,
        googleTask
      );

      // Create synced task record
      syncedTask = new SyncedTask({
        userId,
        googleTaskId: googleTask.id,
        notionPageId: notionPage.id,
        taskTitle: googleTask.title || 'Untitled Task',
        taskStatus: googleTask.status || 'needsAction',
        lastSyncedAt: new Date(),
        syncStatus: 'success',
        googleTaskData: googleTask,
        notionPageData: notionPage
      });

      await syncedTask.save();
    }
  }
}

module.exports = new SyncController();
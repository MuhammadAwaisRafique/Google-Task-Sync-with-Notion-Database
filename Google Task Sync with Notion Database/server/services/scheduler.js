const cron = require('node-cron');
const User = require('../models/User');
const SyncLog = require('../models/SyncLog');
const syncService = require('./syncService');

class SyncScheduler {
  startSyncScheduler() {
    console.log('🕐 Starting sync scheduler...');

    // Run every 5 minutes to check for users who need auto-sync
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.processAutoSyncUsers();
      } catch (error) {
        console.error('Scheduler error:', error);
      }
    });
  }

  async processAutoSyncUsers() {
    try {
      const now = new Date();
      
      // Find users with auto-sync enabled who need syncing
      const users = await User.find({
        'syncSettings.autoSync': true,
        'notionConfig.isConfigured': true,
        isActive: true
      });

      for (const user of users) {
        const lastSync = user.syncSettings.lastSyncAt;
        const syncInterval = user.syncSettings.syncInterval || 30; // minutes
        
        // Check if enough time has passed since last sync
        if (!lastSync || (now - lastSync) >= (syncInterval * 60 * 1000)) {
          console.log(`Starting auto-sync for user ${user.email}`);
          
          await this.startAutoSync(user._id);
        }
      }

    } catch (error) {
      console.error('Process auto-sync users error:', error);
    }
  }

  async startAutoSync(userId) {
    try {
      // Check if sync is already running
      const runningSyncLog = await SyncLog.findOne({
        userId,
        status: 'started'
      });

      if (runningSyncLog) {
        console.log(`Sync already running for user ${userId}`);
        return;
      }

      // Create sync log for automatic sync
      const syncLog = new SyncLog({
        userId,
        syncType: 'automatic',
        status: 'started'
      });
      await syncLog.save();

      const startTime = Date.now();

      // Start sync process
      syncService.performSync(userId, syncLog._id, startTime, 'automatic').catch(error => {
        console.error('Auto-sync error:', error);
      });

    } catch (error) {
      console.error('Start auto-sync error:', error);
    }
  }
}

const scheduler = new SyncScheduler();

module.exports = {
  startSyncScheduler: () => scheduler.startSyncScheduler()
};
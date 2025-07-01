const mongoose = require('mongoose');
const SyncedTask = require('./server/models/SyncedTask');
const User = require('./server/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/google-tasks-notion-sync');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Check if there are any users
    const users = await User.find({});
    console.log('Total users:', users.length);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('First user:', {
        id: user._id,
        email: user.email,
        notionConfigured: user.notionConfig?.isConfigured
      });
      
      // Check if there are any tasks for this user
      const tasks = await SyncedTask.find({ userId: user._id });
      console.log('Total tasks for user:', tasks.length);
      
      if (tasks.length > 0) {
        console.log('Sample task:', {
          id: tasks[0]._id,
          title: tasks[0].taskTitle,
          status: tasks[0].taskStatus,
          syncStatus: tasks[0].syncStatus
        });
      }
    }
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testDatabase(); 
const { google } = require('googleapis');

class GoogleService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async initializeAuth(user) {
    // Check if token needs refresh
    if (new Date() >= user.tokens.expiryDate) {
      await this.refreshAccessToken(user);
    }

    this.oauth2Client.setCredentials({
      access_token: user.tokens.accessToken,
      refresh_token: user.tokens.refreshToken
    });
  }

  async refreshAccessToken(user) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: user.tokens.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update user tokens
      user.tokens.accessToken = credentials.access_token;
      if (credentials.refresh_token) {
        user.tokens.refreshToken = credentials.refresh_token;
      }
      user.tokens.expiryDate = new Date(credentials.expiry_date);

      await user.save();

    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async getTasks(user) {
    try {
      const tasks = google.tasks({ version: 'v1', auth: this.oauth2Client });
      
      // Get all task lists
      const taskListsResponse = await tasks.tasklists.list();
      const taskLists = taskListsResponse.data.items || [];

      const allTasks = [];

      // Get tasks from each list
      for (const taskList of taskLists) {
        try {
          const tasksResponse = await tasks.tasks.list({
            tasklist: taskList.id,
            showCompleted: true,
            showHidden: true
          });

          const listTasks = tasksResponse.data.items || [];
          
          // Add task list info to each task
          const tasksWithListInfo = listTasks.map(task => ({
            ...task,
            taskListId: taskList.id,
            taskListTitle: taskList.title
          }));

          allTasks.push(...tasksWithListInfo);

        } catch (listError) {
          console.error(`Error fetching tasks from list ${taskList.id}:`, listError);
        }
      }

      return allTasks;

    } catch (error) {
      console.error('Get tasks error:', error);
      throw new Error('Failed to fetch Google Tasks');
    }
  }
}

module.exports = new GoogleService();
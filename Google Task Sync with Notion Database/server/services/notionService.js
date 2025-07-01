const axios = require('axios');

class NotionService {
  constructor() {
    this.baseURL = 'https://api.notion.com/v1';
  }

  getHeaders(apiToken) {
    return {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    };
  }

  async validateConfig(apiToken, databaseId) {
    try {
      console.log('Validating Notion config with database ID:', databaseId);
      
      // First, try to get the database
      const response = await axios.get(
        `${this.baseURL}/databases/${databaseId}`,
        { headers: this.getHeaders(apiToken) }
      );

      console.log('Notion validation successful:', response.status);
      return response.status === 200;
    } catch (error) {
      console.error('Notion config validation error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Return more specific error information
      if (error.response?.status === 401) {
        throw new Error('Invalid Notion API token');
      } else if (error.response?.status === 404) {
        throw new Error('Database not found or integration not shared with database');
      } else if (error.response?.status === 403) {
        throw new Error('Integration does not have access to this database');
      } else {
        throw new Error(`Notion API error: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  async createTask(apiToken, databaseId, googleTask) {
    try {
      const taskData = {
        parent: {
          database_id: databaseId
        },
        properties: {
          Name: {
            title: [{
              text: {
                content: googleTask.title || 'Untitled Task'
              }
            }]
          },
          Status: {
            select: {
              name: googleTask.status === 'completed' ? 'Done' : 'Not started'
            }
          },
          'Google Task ID': {
            rich_text: [{
              text: {
                content: googleTask.id
              }
            }]
          },
          'Task List': {
            rich_text: [{
              text: {
                content: googleTask.taskListTitle || 'Default'
              }
            }]
          }
        }
      };

      // Add due date if available
      if (googleTask.due) {
        taskData.properties['Due Date'] = {
          date: {
            start: googleTask.due.split('T')[0]
          }
        };
      }

      const response = await axios.post(
        `${this.baseURL}/pages`,
        taskData,
        { headers: this.getHeaders(apiToken) }
      );

      return response.data;

    } catch (error) {
      console.error('Create Notion task error:', error.response?.data || error.message);
      throw new Error('Failed to create task in Notion');
    }
  }

  async updateTask(apiToken, pageId, googleTask) {
    try {
      const updateData = {
        properties: {
          Name: {
            title: [{
              text: {
                content: googleTask.title || 'Untitled Task'
              }
            }]
          },
          Status: {
            select: {
              name: googleTask.status === 'completed' ? 'Done' : 'Not started'
            }
          }
        }
      };

      // Add due date if available
      if (googleTask.due) {
        updateData.properties['Due Date'] = {
          date: {
            start: googleTask.due.split('T')[0]
          }
        };
      }

      const response = await axios.patch(
        `${this.baseURL}/pages/${pageId}`,
        updateData,
        { headers: this.getHeaders(apiToken) }
      );

      return response.data;

    } catch (error) {
      console.error('Update Notion task error:', error.response?.data || error.message);
      throw new Error('Failed to update task in Notion');
    }
  }
}

module.exports = new NotionService();
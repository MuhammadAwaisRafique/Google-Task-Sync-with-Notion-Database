import axios from 'axios'

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api'
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.config.url, response.status)
        return response
      },
      (error) => {
        console.error('API Error:', error.config?.url, error.response?.status, error.response?.data)
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
      console.log('Auth token set:', token.substring(0, 20) + '...')
    } else {
      delete this.client.defaults.headers.common['Authorization']
      console.log('Auth token cleared')
    }
  }

  // Generic HTTP methods
  async get(url, config = {}) {
    return this.client.get(url, config)
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config)
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config)
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config)
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config)
  }

  // Auth endpoints
  async getGoogleAuthUrl() {
    return this.get('/auth/google')
  }

  async updateNotionConfig(apiToken, databaseId) {
    return this.post('/auth/notion-config', { apiToken, databaseId })
  }

  async testNotionConnection(apiToken, databaseId) {
    return this.post('/auth/test-notion', { apiToken, databaseId })
  }

  async getCurrentUser() {
    return this.get('/auth/me')
  }

  // Sync endpoints
  async startSync() {
    return this.post('/sync/start')
  }

  async getSyncStatus() {
    return this.get('/sync/status')
  }

  async updateSyncSettings(settings) {
    return this.post('/sync/settings', settings)
  }

  // Tasks endpoints
  async getTasks(page = 1, limit = 20) {
    return this.get(`/tasks?page=${page}&limit=${limit}`)
  }

  async getTaskStats() {
    console.log('Calling getTaskStats API...')
    const response = await this.get('/tasks/stats')
    console.log('Task stats response:', response.data)
    return response
  }
}

export default new ApiService()
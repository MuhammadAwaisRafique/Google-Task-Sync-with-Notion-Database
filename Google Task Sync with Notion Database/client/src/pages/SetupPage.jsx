import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import api from '../services/api'
import { 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  ExternalLink,
  Save,
  RefreshCw,
  Database,
  Zap
} from 'lucide-react'

const SetupPage = () => {
  const { user, updateUser } = useAuth()
  const [notionConfig, setNotionConfig] = useState({
    apiToken: '',
    databaseId: ''
  })
  const [syncSettings, setSyncSettings] = useState({
    autoSync: false,
    syncInterval: 30
  })
  const [savingNotion, setSavingNotion] = useState(false)
  const [savingSync, setSavingSync] = useState(false)
  const [testingNotion, setTestingNotion] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.syncSettings) {
      setSyncSettings({
        autoSync: user.syncSettings.autoSync || false,
        syncInterval: user.syncSettings.syncInterval || 30
      })
    }
  }, [user])

  const handleNotionConfigSubmit = async (e) => {
    e.preventDefault()
    setSavingNotion(true)
    setError('')
    setSuccess('')

    try {
      await api.updateNotionConfig(notionConfig.apiToken, notionConfig.databaseId)
      
      // Update user context
      updateUser({
        ...user,
        notionConfigured: true
      })
      
      setSuccess('Notion configuration saved successfully!')
      setNotionConfig({ apiToken: '', databaseId: '' })
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to save Notion configuration')
    } finally {
      setSavingNotion(false)
    }
  }

  const handleTestNotionConnection = async () => {
    if (!notionConfig.apiToken || !notionConfig.databaseId) {
      setError('Please enter both API token and database ID to test')
      return
    }

    setTestingNotion(true)
    setError('')
    setSuccess('')

    try {
      await api.testNotionConnection(notionConfig.apiToken, notionConfig.databaseId)
      setSuccess('Notion connection test successful! You can now save the configuration.')
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to test Notion connection')
    } finally {
      setTestingNotion(false)
    }
  }

  const handleSyncSettingsSubmit = async (e) => {
    e.preventDefault()
    setSavingSync(true)
    setError('')
    setSuccess('')

    try {
      await api.updateSyncSettings(syncSettings)
      
      // Update user context
      updateUser({
        ...user,
        syncSettings: {
          ...user.syncSettings,
          ...syncSettings
        }
      })
      
      setSuccess('Sync settings updated successfully!')
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to update sync settings')
    } finally {
      setSavingSync(false)
    }
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Setup & Configuration</h1>
          <p className="text-gray-600 mt-1">Configure your Notion workspace and sync preferences</p>
        </div>

        {/* Status Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Google Tasks Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 text-primary-600 mr-2" />
                Google Tasks Connection
              </h2>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Your Google account is successfully connected. We can access your Google Tasks data.
            </p>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-800">
                ✓ Connected as: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>

          {/* Notion Configuration */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Database className="h-5 w-5 text-gray-600 mr-2" />
                Notion Database Configuration
              </h2>
              <div className="flex items-center">
                {user?.notionConfigured ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-green-600 font-medium">Configured</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="text-sm text-amber-600 font-medium">Setup Required</span>
                  </>
                )}
              </div>
            </div>

            {!user?.notionConfigured && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-3">Setup Instructions:</h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>
                    Create a Notion integration at{' '}
                    <a 
                      href="https://www.notion.so/my-integrations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-900 inline-flex items-center"
                    >
                      notion.so/my-integrations
                      <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>Copy the "Internal Integration Token"</li>
                  <li>Create a database in Notion with these columns: Name (Title), Status (Select), Google Task ID (Text), Task List (Text), Due Date (Date)</li>
                  <li>Share the database with your integration</li>
                  <li>Copy the database ID from the URL</li>
                </ol>
              </div>
            )}

            <form onSubmit={handleNotionConfigSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Notion API Token
                </label>
                <input
                  type="password"
                  id="apiToken"
                  value={notionConfig.apiToken}
                  onChange={(e) => setNotionConfig({ ...notionConfig, apiToken: e.target.value })}
                  placeholder="secret_..."
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Notion integration token (starts with "secret_")
                </p>
              </div>

              <div>
                <label htmlFor="databaseId" className="block text-sm font-medium text-gray-700 mb-2">
                  Database ID
                </label>
                <input
                  type="text"
                  id="databaseId"
                  value={notionConfig.databaseId}
                  onChange={(e) => setNotionConfig({ ...notionConfig, databaseId: e.target.value })}
                  placeholder="32-character database ID"
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The ID of your Notion database (found in the URL)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleTestNotionConnection}
                  disabled={testingNotion || !notionConfig.apiToken || !notionConfig.databaseId}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingNotion ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={savingNotion || !notionConfig.apiToken || !notionConfig.databaseId}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingNotion ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Notion Configuration
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sync Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Sync Settings</h2>
            </div>

            <form onSubmit={handleSyncSettingsSubmit} className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">Automatic Sync</h3>
                  <p className="text-sm text-gray-500">
                    Automatically sync your tasks at regular intervals
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncSettings.autoSync}
                    onChange={(e) => setSyncSettings({ ...syncSettings, autoSync: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {syncSettings.autoSync && (
                <div>
                  <label htmlFor="syncInterval" className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Interval (minutes)
                  </label>
                  <select
                    id="syncInterval"
                    value={syncSettings.syncInterval}
                    onChange={(e) => setSyncSettings({ ...syncSettings, syncInterval: parseInt(e.target.value) })}
                    className="input-field"
                  >
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={60}>Every hour</option>
                    <option value={120}>Every 2 hours</option>
                    <option value={360}>Every 6 hours</option>
                    <option value={720}>Every 12 hours</option>
                    <option value={1440}>Daily</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={savingSync}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingSync ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Sync Settings
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SetupPage
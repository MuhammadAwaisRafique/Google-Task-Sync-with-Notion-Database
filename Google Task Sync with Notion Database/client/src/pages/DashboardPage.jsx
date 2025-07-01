import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../services/api'
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Settings,
  RefreshCw,
  BarChart3,
  Zap
} from 'lucide-react'

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [syncStatus, setSyncStatus] = useState(null)
  const [taskStats, setTaskStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.notionConfigured) {
      navigate('/setup')
      return
    }
    
    loadDashboardData()
    
    // Poll sync status every 5 seconds
    const interval = setInterval(loadSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [user, navigate])

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...')
      const [syncResponse, statsResponse] = await Promise.all([
        api.getSyncStatus(),
        api.getTaskStats()
      ])
      
      console.log('Sync response:', syncResponse.data)
      console.log('Stats response:', statsResponse.data)
      
      setSyncStatus(syncResponse.data)
      setTaskStats(statsResponse.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const response = await api.getSyncStatus()
      setSyncStatus(response.data)
      setSyncing(response.data.isRunning)
    } catch (error) {
      console.error('Failed to load sync status:', error)
    }
  }

  const handleStartSync = async () => {
    if (syncing) return
    
    setSyncing(true)
    setError('')
    
    try {
      await api.startSync()
      // Status will be updated by polling
    } catch (error) {
      setError('Failed to start sync')
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner text="Loading dashboard..." />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your task synchronization</p>
        </div>

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

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  <Zap className="h-5 w-5 text-primary-600 mr-2" />
                  Sync Control
                </h2>
                <p className="text-gray-600">
                  {syncing ? 'Sync is currently running...' : 'Start manual synchronization of your tasks'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/setup')}
                  className="btn-secondary flex items-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={handleStartSync}
                  disabled={syncing}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Sync
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats?.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats?.completed || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats?.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats?.errors || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sync History */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
              Recent Sync Activity
            </h3>
            
            {syncStatus?.recentLogs?.length > 0 ? (
              <div className="space-y-3">
                {syncStatus.recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${
                        log.status === 'completed' ? 'bg-green-100' :
                        log.status === 'failed' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {log.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {log.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600" />}
                        {log.status === 'started' && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {log.type === 'manual' ? 'Manual' : 'Automatic'} Sync
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {log.tasksProcessed} tasks
                      </p>
                      {log.duration && (
                        <p className="text-xs text-gray-500">
                          {(log.duration / 1000).toFixed(1)}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No sync activity yet</p>
                <p className="text-sm">Start your first sync to see activity here</p>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 text-gray-600 mr-2" />
              System Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Google Tasks</p>
                    <p className="text-xs text-gray-500">Connected</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                  Active
                </span>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-xl ${
                user?.notionConfigured ? 'bg-green-50' : 'bg-amber-50'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${
                    user?.notionConfigured ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {user?.notionConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Notion Database</p>
                    <p className="text-xs text-gray-500">
                      {user?.notionConfigured ? 'Connected' : 'Configuration needed'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  user?.notionConfigured
                    ? 'text-green-800 bg-green-100'
                    : 'text-amber-800 bg-amber-100'
                }`}>
                  {user?.notionConfigured ? 'Active' : 'Setup Required'}
                </span>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-xl ${
                user?.syncSettings?.autoSync ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${
                    user?.syncSettings?.autoSync ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {user?.syncSettings?.autoSync ? (
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    ) : (
                      <Pause className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Auto Sync</p>
                    <p className="text-xs text-gray-500">
                      {user?.syncSettings?.autoSync 
                        ? `Every ${user.syncSettings.syncInterval} minutes`
                        : 'Disabled'
                      }
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  user?.syncSettings?.autoSync
                    ? 'text-green-800 bg-green-100'
                    : 'text-gray-800 bg-gray-100'
                }`}>
                  {user?.syncSettings?.autoSync ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DashboardPage
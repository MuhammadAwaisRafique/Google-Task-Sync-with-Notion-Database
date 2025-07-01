import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SetupPage from './pages/SetupPage'
import TasksPage from './pages/TasksPage'
import ProtectedRoute from './components/ProtectedRoute'

function TokenHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user, loading } = useAuth()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const token = urlParams.get('token')
    
    if (token) {
      login(token)
    }
  }, [location, login])

  // Handle navigation after user data is loaded
  useEffect(() => {
    if (!loading && user && location.search.includes('token=')) {
      console.log('TokenHandler: Navigating user to appropriate page')
      console.log('User notionConfigured:', user.notionConfigured)
      
      // Clear the token from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      
      // Navigate based on user configuration
      if (!user.notionConfigured) {
        console.log('TokenHandler: Redirecting to setup page')
        navigate('/setup', { replace: true })
      } else {
        console.log('TokenHandler: Redirecting to dashboard page')
        navigate('/dashboard', { replace: true })
      }
    }
  }, [loading, user, navigate, location.search])

  return null
}

function AppContent() {
  return (
    <Router>
      <TokenHandler />
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={
            <ProtectedRoute>
              <SetupPage />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SetupPage from './pages/SetupPage'
import TasksPage from './pages/TasksPage'
import ProtectedRoute from './components/ProtectedRoute'

function TokenHandler() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const token = urlParams.get('token')
    
    if (token) {
      localStorage.setItem('token', token)
      navigate('/dashboard', { replace: true })
    }
  }, [location, navigate])

  return null
}

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}

export default App
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, token } = useAuth()
  const location = useLocation()

  console.log('ProtectedRoute: loading=', loading, 'isAuthenticated=', isAuthenticated, 'hasToken=', !!token)

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login')
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
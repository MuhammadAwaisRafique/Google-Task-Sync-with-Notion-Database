import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    console.log('AuthContext: Token changed:', token ? 'present' : 'absent')
    if (token) {
      api.setAuthToken(token)
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  // Note: Navigation is now handled in TokenHandler component
  // This prevents navigation conflicts and ensures proper flow

  const fetchUser = async () => {
    try {
      console.log('Fetching user data...')
      const response = await api.get('/auth/me')
      console.log('User data received:', response.data)
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      // Add a small delay to ensure proper state updates
      setTimeout(() => {
        setLoading(false)
      }, 100)
    }
  }

  const login = (authToken) => {
    localStorage.setItem('token', authToken)
    setToken(authToken)
    api.setAuthToken(authToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    api.setAuthToken(null)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user && !loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
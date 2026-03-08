import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api, { setAuthToken } from '../lib/api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role')

    if (savedToken) {
      setToken(savedToken)
      setAuthToken(savedToken)
    }
    if (savedRole) {
      setRole(savedRole)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setToken(null)
          setUser(null)
          setRole(null)
          localStorage.removeItem('token')
          localStorage.removeItem('role')
          setAuthToken(null)
          navigate('/login')
        }
        return Promise.reject(error)
      }
    )

    return () => api.interceptors.response.eject(interceptorId)
  }, [navigate])

  const login = async (identifier, password) => {
    try {
      const body = new URLSearchParams({ username: identifier, password })
      const response = await api.post('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const nextToken = response.data.access_token
      const nextRole = response.data.role

      setToken(nextToken)
      localStorage.setItem('token', nextToken)

      if (nextRole) {
        setRole(nextRole)
        localStorage.setItem('role', nextRole)
      }

      setUser({ email: response.data.email, role: nextRole })
      navigate('/profile')
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }

  const register = async (email, password, nextRole) => {
    try {
      const response = await api.post('/auth/register', { email, password, role: nextRole })

      const nextToken = response.data.access_token

      setToken(nextToken)
      localStorage.setItem('token', nextToken)
      setRole(nextRole)
      localStorage.setItem('role', nextRole)
      setUser({ email, role: nextRole })

      navigate('/profile')
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Registration failed')
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setRole(null)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setAuthToken(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, token, role, loading, login, register, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  )
}

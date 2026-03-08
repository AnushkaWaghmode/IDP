import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Assessment from './components/Assessment'
import AssessmentHistory from './components/AssessmentHistory'
import Dashboard from './components/Dashboard'
import LandingPage from './components/LandingPage'
import Login from './components/Login'
import NavBar from './components/NavBar'
import Register from './components/Register'
import UserRegistration from './components/UserRegistration'

import './App.css'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
      </div>
    )
  }

  return token ? children : <Navigate to="/login" replace />
}

function AppContent() {
  const location = useLocation()
  const hideNav = ['/login', '/register'].includes(location.pathname)

  return (
    <div className="app-shell">
      {!hideNav && <NavBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/profile" element={<ProtectedRoute><UserRegistration /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><AssessmentHistory /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}


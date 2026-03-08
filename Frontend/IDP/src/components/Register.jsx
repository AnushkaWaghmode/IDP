import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Logo from './Logo'

const Register = () => {
  const [formData, setFormData] = useState({ fullName: '', email: '', userId: '', password: '', confirmPassword: '' })
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [passwordMatch, setPasswordMatch] = useState(true)

  const { register } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef(null)

  useEffect(() => {
    if (!formRef.current) return
    gsap.fromTo(formRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setPasswordMatch(false)
      return
    }

    if (!role || Object.values(formData).some((value) => !value.trim())) {
      setError('Please fill all fields and select a role')
      return
    }

    setError('')
    setPasswordMatch(true)

    try {
      await register(formData.email, formData.password, role)
    } catch (err) {
      setError(err.message)
    }
  }

  const updatePasswordMatch = (password, confirmPassword) => setPasswordMatch(password === confirmPassword)

  return (
    <main className="idp-page">
      <div className="w-full max-w-2xl" ref={formRef}>
        <Logo className="mb-3" />
        <p className="mb-8 text-center text-xs uppercase tracking-[0.24em] text-slate-500">Personalized Individual Development Plan</p>

        <form onSubmit={handleSubmit} className="idp-card animate-float-up mx-auto max-w-[560px]">
          <h2 className="text-center text-4xl font-semibold leading-none text-white sm:text-6xl">Create Account</h2>
          <p className="mb-7 mt-4 text-center text-base text-idp-muted sm:text-[28px]">Start your personalized development journey</p>

          {error && <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-center text-sm text-red-300">{error}</p>}

          <div className="role-switch mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`role-button ${role === 'student' ? 'role-button-active' : 'role-button-inactive'}`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('employee')}
              className={`role-button ${role === 'employee' ? 'role-button-active' : 'role-button-inactive'}`}
            >
              Employee
            </button>
          </div>

          <label className="idp-label" htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="idp-input mb-6"
            required
          />

          <label className="idp-label" htmlFor="email">Email ID</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="idp-input mb-6"
            required
          />

          <label className="idp-label" htmlFor="userId">User ID</label>
          <input
            id="userId"
            type="text"
            placeholder="Choose a user ID"
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="idp-input mb-6"
            required
          />

          <label className="idp-label" htmlFor="password">Password</label>
          <div className="relative mb-5">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => {
                const password = e.target.value
                setFormData({ ...formData, password })
                updatePasswordMatch(password, formData.confirmPassword)
              }}
              className="idp-input pr-12"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <label className="idp-label" htmlFor="confirmPassword">Confirm Password</label>
          <div className="relative mb-2">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => {
                const confirmPassword = e.target.value
                setFormData({ ...formData, confirmPassword })
                updatePasswordMatch(formData.password, confirmPassword)
              }}
              className={`idp-input pr-12 ${passwordMatch ? '' : 'border-red-400 focus:border-red-400 focus:ring-red-500/30'}`}
              required
            />
            <button
              type="button"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {!passwordMatch && <p className="mb-4 text-sm text-red-300">Passwords do not match</p>}

          <button type="submit" className="idp-primary-btn mt-6 w-full">Create Account</button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <button type="button" onClick={() => navigate('/login')} className="font-semibold text-[#8f6dff] hover:text-[#b39bff]">
              Login
            </button>
          </p>
        </form>
      </div>
    </main>
  )
}

export default Register

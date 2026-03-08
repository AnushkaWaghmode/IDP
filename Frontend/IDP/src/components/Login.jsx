import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Logo from './Logo'

const Login = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  const [role, setRole] = useState('student')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef(null)

  useEffect(() => {
    if (!formRef.current) return
    gsap.fromTo(formRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(formData.identifier, formData.password)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="idp-page">
      <div className="w-full max-w-2xl" ref={formRef}>
        <Logo className="mb-3" />
        <p className="mb-8 text-center text-xs uppercase tracking-[0.24em] text-slate-500">Personalized Individual Development Plan</p>

        <form onSubmit={handleSubmit} className="idp-card animate-float-up mx-auto max-w-[560px]">
          <h2 className="text-center text-4xl font-semibold leading-none text-white sm:text-6xl">Welcome Back</h2>
          <p className="mb-8 mt-4 text-center text-base text-idp-muted sm:text-[28px]">Access your Personalized Individual Development Plan</p>

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

          <label className="idp-label" htmlFor="identifier">Email</label>
          <input
            id="identifier"
            type="text"
            placeholder="Enter your Email"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            className="idp-input mb-6"
            required
          />

          <label className="idp-label" htmlFor="password">Password</label>
          <div className="relative mb-8">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

          <button type="submit" className="idp-primary-btn w-full">Login</button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <button type="button" onClick={() => navigate('/register')} className="font-semibold text-[#8f6dff] hover:text-[#b39bff]">
              Register
            </button>
          </p>
        </form>
      </div>
    </main>
  )
}

export default Login

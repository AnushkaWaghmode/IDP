import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'
import { GraduationCap, Briefcase } from 'lucide-react'
import Logo from './Logo'

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('')
  const { setRole } = useAuth()
  const navigate = useNavigate()
  const cardRef = useRef()

  useEffect(() => {
    gsap.from(cardRef.current, { duration: 1, rotationY: 90, opacity: 0 })
  }, [])

  const handleSelect = (role) => {
    setSelectedRole(role)
    setRole(role)
    localStorage.setItem('role', role)
    gsap.to(cardRef.current, { duration: 0.3, scale: 1.05 })
    setTimeout(() => navigate('/user-reg'), 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div ref={cardRef} className="glass-card p-8 text-center max-w-md w-full">
        <Logo className="mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-6">Select Your Role</h2>
        <div className="space-y-4">
          <button onClick={() => handleSelect('student')} className="w-full p-4 border-2 border-white/20 rounded-xl hover:border-purple-500 transition flex items-center justify-center space-x-2 text-white hover:text-purple-300">
            <GraduationCap className="w-5 h-5" /> <span>Student</span>
          </button>
          <button onClick={() => handleSelect('employee')} className="w-full p-4 border-2 border-white/20 rounded-xl hover:border-purple-500 transition flex items-center justify-center space-x-2 text-white hover:text-purple-300">
            <Briefcase className="w-5 h-5" /> <span>Professional</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoleSelection
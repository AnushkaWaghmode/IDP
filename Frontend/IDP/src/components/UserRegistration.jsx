import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import Logo from './Logo'
import api from '../lib/api'

const UserRegistration = () => {
  const { role } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef()

  const [formData, setFormData] = useState({
    fullName: '',
    educationLevel: '',
    institution: '',
    graduationYear: '',
    currentRole: '',
    aspiringRole: '',
    preferredLanguage: '',
    weeklyHours: 8,
    experienceYears: 0,
    technicalSkills: '',
    academicDetails: '',
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!formRef.current) return
    gsap.set(formRef.current, { opacity: 1 })
    gsap.from(formRef.current, { duration: 0.6, y: 20 })
  }, [])

  const handleChange = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.aspiringRole || !formData.preferredLanguage || !formData.technicalSkills.trim()) {
      setError('Fill all required fields including target role, language, and skills')
      return
    }

    setError('')
    setLoading(true)

    try {
      await api.post('/user/profile', {
        current_role: role === 'employee' ? formData.currentRole : null,
        aspiring_role: formData.aspiringRole,
        academic_details: formData.academicDetails || `${formData.educationLevel} - ${formData.institution}`,
      })

      const multipart = new FormData()
      multipart.append('full_name', formData.fullName)
      multipart.append('education_level', formData.educationLevel)
      multipart.append('institution', formData.institution)
      multipart.append('graduation_year', formData.graduationYear)
      multipart.append('target_role', formData.aspiringRole)
      multipart.append('preferred_language', formData.preferredLanguage)
      multipart.append('weekly_hours', String(formData.weeklyHours))
      multipart.append('experience_years', String(formData.experienceYears))
      multipart.append('technical_skills', formData.technicalSkills)
      if (resumeFile) multipart.append('resume', resumeFile)

      await api.post('/intake/submit', multipart, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      navigate('/assessment')
    } catch (err) {
      setError(err.response?.data?.detail || 'Profile save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="idp-page">
      <form ref={formRef} onSubmit={handleSubmit} className="idp-card-solid mx-auto w-full max-w-[760px] space-y-4">
        <Logo className="mb-4" />
        <h2 className="text-center text-3xl font-semibold text-white sm:text-5xl">Profile Intake</h2>
        <p className="mb-4 text-center text-slate-200">Upload CV/Resume and provide your education + technical background for AI assessment generation.</p>

        {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-center text-sm text-red-300">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <input className="idp-input-solid" placeholder="Full Name" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} required />
          <input className="idp-input-solid" placeholder="Education Level" value={formData.educationLevel} onChange={(e) => handleChange('educationLevel', e.target.value)} required />
          <input className="idp-input-solid" placeholder="Institution" value={formData.institution} onChange={(e) => handleChange('institution', e.target.value)} required />
          <input className="idp-input-solid" placeholder="Graduation Year" value={formData.graduationYear} onChange={(e) => handleChange('graduationYear', e.target.value)} required />
          {role === 'employee' && <input className="idp-input-solid" placeholder="Current Role" value={formData.currentRole} onChange={(e) => handleChange('currentRole', e.target.value)} required />}
          <select className="idp-input-solid" value={formData.aspiringRole} onChange={(e) => handleChange('aspiringRole', e.target.value)} required>
            <option value="" className="bg-[#0e162b] text-slate-300">Target Role</option>
            <option value="developer" className="bg-[#0e162b] text-white">Developer</option>
            <option value="manager" className="bg-[#0e162b] text-white">Manager</option>
            <option value="data_scientist" className="bg-[#0e162b] text-white">Data Scientist</option>
          </select>
          <input className="idp-input-solid" placeholder="Preferred Language (Python/Java/JS)" value={formData.preferredLanguage} onChange={(e) => handleChange('preferredLanguage', e.target.value)} required />
          <input className="idp-input-solid" type="number" min="1" max="80" placeholder="Weekly Study Hours" value={formData.weeklyHours} onChange={(e) => handleChange('weeklyHours', e.target.value)} required />
          <input className="idp-input-solid" type="number" min="0" step="0.5" placeholder="Experience (Years)" value={formData.experienceYears} onChange={(e) => handleChange('experienceYears', e.target.value)} />
          <input
            className="idp-input-solid sm:col-span-2"
            placeholder="Technical skills (comma separated, e.g. React, FastAPI, SQL)"
            value={formData.technicalSkills}
            onChange={(e) => handleChange('technicalSkills', e.target.value)}
            required
          />
        </div>

        <textarea className="idp-input-solid h-28 pt-3" placeholder="Academic and technical details" value={formData.academicDetails} onChange={(e) => handleChange('academicDetails', e.target.value)} />

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Upload CV / Resume (.pdf, .docx, .txt)</label>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-200"
          />
        </div>

        <button type="submit" disabled={loading} className="idp-primary-btn w-full disabled:opacity-50">
          {loading ? 'Processing...' : 'Generate My Assessment'}
        </button>
      </form>
    </main>
  )
}

export default UserRegistration

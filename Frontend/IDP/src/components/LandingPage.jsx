import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useEffect } from 'react'
import { Brain, Map, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LandingPage = () => {
  const navigate = useNavigate()
  const { token } = useAuth()

  useEffect(() => {
    gsap.fromTo('.hero-block', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' })
    gsap.fromTo('.hero-item', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, delay: 0.22 })
  }, [])

  return (
    <main className="idp-page">
      <div className="hero-block mx-auto w-full max-w-5xl text-center">
        <div className="idp-pill hero-item">
          <Sparkles className="h-4 w-4 text-[#9f87ff]" />
          <span>AI-Powered Development Planning</span>
        </div>

        <h1 className="idp-title hero-item mt-8">
          Get Your <span className="idp-gradient-text">Personalized</span>
          <br />
          Development Plan
        </h1>

        <p className="idp-subtitle hero-item">
          Upload your resume, fill your technical profile, take a role-specific AI assessment, and get a dashboard with actionable learning insights.
        </p>

        <div className="hero-item mt-11 flex flex-wrap justify-center gap-7 text-idp-muted">
          <div className="flex items-center gap-2"><Brain className="h-5 w-5 text-[#9256ff]" /><span>Role-Specific Assessment</span></div>
          <div className="flex items-center gap-2"><Map className="h-5 w-5 text-[#4f7dff]" /><span>Roadmap Timeline</span></div>
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#9256ff]" /><span>Internet Course Discovery</span></div>
        </div>

        <div className="hero-item mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {!token ? (
            <>
              <button onClick={() => navigate('/login')} className="idp-primary-btn w-full sm:w-[230px]"><span>Get Started</span><ArrowRight className="ml-2 h-5 w-5" /></button>
              <button onClick={() => navigate('/register')} className="idp-secondary-btn w-full sm:w-[230px]">Create Account</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/profile')} className="idp-primary-btn w-full sm:w-[230px]">Update Profile</button>
              <button onClick={() => navigate('/dashboard')} className="idp-secondary-btn w-full sm:w-[230px]">Open Dashboard</button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default LandingPage


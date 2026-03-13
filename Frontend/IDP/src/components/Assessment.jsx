import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import Logo from './Logo'
import api from '../lib/api'

const Assessment = () => {
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skillOptions, setSkillOptions] = useState(['overall'])
  const [selectedSkill, setSelectedSkill] = useState('overall')
  const navigate = useNavigate()
  const qRef = useRef()

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get('/intake/latest')
        const skills = res.data?.technical_skills || []
        setSkillOptions(['overall', ...skills])
      } catch (_) {
        setSkillOptions(['overall'])
      }
    }
    fetchSkills()
  }, [])

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      try {
        const res = await api.get('/assessment/questions', {
          params: { skill: selectedSkill !== 'overall' ? selectedSkill : undefined },
        })
        setQuestions(res.data.questions || [])
        setCurrentQuestion(0)
        setResponses({})
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load questions')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [selectedSkill])

  useEffect(() => {
    if (!loading && qRef.current) gsap.from(qRef.current, { duration: 0.4, x: -30, opacity: 0 })
  }, [currentQuestion, loading])

  const handleAnswer = async (answer) => {
    const q = questions[currentQuestion]
    const nextResponses = { ...responses, [q.id]: answer }
    setResponses(nextResponses)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      return
    }

    try {
      await api.post('/assessment/submit', {
        responses: nextResponses,
        skill: selectedSkill !== 'overall' ? selectedSkill : null,
      })
      const nextRoute = selectedSkill !== 'overall' ? `/dashboard?skill=${encodeURIComponent(selectedSkill)}` : '/dashboard'
      navigate(nextRoute)
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed')
    }
  }

  if (loading) return <div className="idp-page"><div className="idp-card text-center"><Logo className="mx-auto mb-4" /><p>Loading assessment...</p></div></div>
  if (error) return <div className="idp-page"><div className="idp-card text-center"><p className="text-red-300">{error}</p></div></div>
  if (!questions.length) return <div className="idp-page"><div className="idp-card text-center"><p>No questions available</p></div></div>

  const q = questions[currentQuestion]

  return (
    <main className="idp-page">
      <div className="mx-auto mb-6 w-full max-w-4xl px-3 sm:px-0">
        <div className="idp-card mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Skill focus</p>
            <p className="text-sm text-idp-muted">Choose a skill to tailor questions.</p>
          </div>
          <div className="flex flex-wrap gap-2 gap-y-2 pb-2">
            {skillOptions.map((skill) => {
              const active = skill === selectedSkill
              return (
                <button
                  key={skill}
                  onClick={() => setSelectedSkill(skill)}
                  className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                    active ? 'bg-white text-[#0b1222] font-semibold' : 'border border-idp-border text-idp-text hover:border-slate-500'
                  }`}
                >
                  {skill === 'overall' ? 'Overall readiness' : skill}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div ref={qRef} className="idp-card mx-auto w-full max-w-3xl px-4 text-center sm:px-8">
        <Logo className="mx-auto mb-4" />
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">{(q.category || 'general').replace('_', ' ')}</p>
        <h2 className="mb-1 text-2xl font-semibold text-white">Assessment</h2>
        <p className="mb-4 text-sm text-idp-muted">Focused on {selectedSkill === 'overall' ? 'overall readiness' : selectedSkill}</p>
        <p className="mb-5 text-lg text-idp-text">{q.text}</p>
        <div className="space-y-2">
          {q.options.map((opt) => (
            <button key={opt} onClick={() => handleAnswer(opt)} className="idp-secondary-btn h-12 w-full text-left text-sm sm:text-base capitalize">
              {opt}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-idp-muted">Question {currentQuestion + 1} / {questions.length}</p>
      </div>
    </main>
  )
}

export default Assessment


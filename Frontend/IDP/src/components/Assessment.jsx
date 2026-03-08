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
  const navigate = useNavigate()
  const qRef = useRef()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get('/assessment/questions')
        setQuestions(res.data.questions || [])
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load questions')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

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
      await api.post('/assessment/submit', { responses: nextResponses })
      navigate('/dashboard')
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
      <div ref={qRef} className="idp-card mx-auto max-w-xl text-center">
        <Logo className="mx-auto mb-4" />
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">{(q.category || 'general').replace('_', ' ')}</p>
        <h2 className="mb-4 text-2xl font-semibold text-white">Assessment</h2>
        <p className="mb-5 text-lg text-idp-text">{q.text}</p>
        <div className="space-y-2">
          {q.options.map((opt) => (
            <button key={opt} onClick={() => handleAnswer(opt)} className="idp-secondary-btn h-12 w-full text-left capitalize">
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


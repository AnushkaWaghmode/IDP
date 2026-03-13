import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Logo from './Logo'
import api from '../lib/api'

const LearningPath = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [skillOptions, setSkillOptions] = useState(['overall'])
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const skill = searchParams.get('skill')

  const goToSkill = (nextSkill) => {
    const params = new URLSearchParams()
    if (nextSkill && nextSkill !== 'overall') params.set('skill', nextSkill)
    navigate({ pathname: '/learning-path', search: params.toString() })
  }

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const res = await api.get('/dashboard/assessments')
        const uniqueSkills = Array.from(
          new Set(['overall', ...(res.data || []).map((item) => item.skill_focus || 'overall')])
        )
        setSkillOptions(uniqueSkills)
      } catch (_) {
        setSkillOptions(['overall'])
      }
    }
    loadSkills()
  }, [])

  useEffect(() => {
    const fetchPath = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.get('/dashboard/learning-paths', { params: { skill: skill || undefined } })
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load learning path')
      } finally {
        setLoading(false)
      }
    }
    fetchPath()
  }, [skill])

  if (loading) return <div className="idp-page"><div className="idp-card text-center">Building learning path...</div></div>
  if (error) return <div className="idp-page"><div className="idp-card text-center text-red-300">{error}</div></div>
  if (!data) return <div className="idp-page"><div className="idp-card text-center">No learning path found</div></div>

  const steps = data.timeline || []
  const areas = data.learning_areas || []
  const recommended = data.recommended_courses || []
  const skillPaths = data.skill_paths || []
  const roadmap = data.roadmap || []

  return (
    <main className="idp-page items-start py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex gap-2">
            <button onClick={() => navigate('/dashboard')} className="idp-secondary-btn">Dashboard</button>
            <button onClick={() => navigate('/assessment')} className="idp-secondary-btn">New Assessment</button>
          </div>
        </div>

        <div className="idp-card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-idp-muted">Learning path focus</p>
            <p className="text-white capitalize">{skill || data.skill_focus || 'overall'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((opt) => {
              const active = (skill || 'overall') === opt
              return (
                <button
                  key={opt}
                  onClick={() => goToSkill(opt)}
                  className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                    active ? 'bg-white text-[#0b1222] font-semibold' : 'border border-idp-border text-idp-text hover:border-slate-500'
                  }`}
                >
                  {opt === 'overall' ? 'Overall' : opt}
                </button>
              )
            })}
          </div>
        </div>

        <section className="idp-card">
          <h2 className="mb-2 text-2xl font-semibold text-white">Roadmap</h2>
          <p className="mb-6 text-idp-muted">Inspired by roadmap.sh — follow the nodes from top to bottom.</p>

          <div className="roadmap-grid">
            {roadmap.length
              ? roadmap.map((area, idx) => (
                  <div key={`${area.area}-${idx}`} className="roadmap-node">
                    <div className="roadmap-dot">{idx + 1}</div>
                    <div className="roadmap-card space-y-2">
                      <p className="text-sm uppercase tracking-[0.14em] text-idp-muted">{area.area}</p>
                      {(area.topics || []).map((t) => (
                        <div key={t.name} className="rounded-lg border border-idp-border bg-[#0f162d] px-3 py-2">
                          <p className="text-white">{t.name}</p>
                          <p className="text-xs text-idp-muted">{(t.subtopics || []).join(' • ')}</p>
                        </div>
                      ))}
                      {(area.resources || []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {area.resources.map((res, rIdx) => (
                            <a
                              key={`${res.title}-${rIdx}`}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-idp-border px-3 py-1 text-xs text-sky-300"
                            >
                              {res.type === 'video' ? 'Video' : 'Course'}: {res.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {idx !== roadmap.length - 1 && <div className="roadmap-connector" />}
                  </div>
                ))
              : steps.map((step, idx) => (
                  <div key={`${idx}-${step}`} className="roadmap-node">
                    <div className="roadmap-dot">{idx + 1}</div>
                    <div className="roadmap-card">
                      <p className="text-sm uppercase tracking-[0.14em] text-idp-muted">Milestone {idx + 1}</p>
                      <p className="text-white">{step}</p>
                      {areas[idx] && <p className="mt-2 text-sm text-idp-text">Focus: {areas[idx]}</p>}
                    </div>
                    {idx !== steps.length - 1 && <div className="roadmap-connector" />}
                  </div>
                ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="idp-card">
            <h3 className="mb-3 text-lg font-semibold text-white">Skill Resources</h3>
            <div className="space-y-3">
              {skillPaths.map((item) => (
                <div key={item.skill} className="rounded-xl border border-idp-border bg-white/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-white capitalize">{item.skill}</p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.14em] text-idp-muted">Gap</span>
                  </div>
                  <div className="space-y-2">
                    {(item.resources || []).map((res, idx) => (
                      <div key={`${item.skill}-${idx}`} className="flex items-center justify-between rounded-lg border border-idp-border bg-[#101830] px-3 py-2">
                        <div>
                          <p className="text-sm text-white">{res.title}</p>
                          <p className="text-xs text-idp-muted">{res.provider}</p>
                        </div>
                        <a href={res.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-sky-300 underline">
                          {res.type === 'video' ? 'Watch' : 'Open'}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="idp-card">
            <h3 className="mb-3 text-lg font-semibold text-white">Curated Courses</h3>
            <div className="space-y-3">
              {recommended.map((course, idx) => (
                <div key={`${course.title}-${idx}`} className="rounded-xl border border-idp-border bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">{course.title}</p>
                      <p className="text-xs text-idp-muted">{course.provider} • {course.duration || 'Self paced'}</p>
                    </div>
                    <a href={course.url} target="_blank" rel="noreferrer" className="idp-secondary-btn h-10 px-4 text-sm">Open</a>
                  </div>
                  {course.reason && <p className="mt-2 text-sm text-idp-text">{course.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default LearningPath

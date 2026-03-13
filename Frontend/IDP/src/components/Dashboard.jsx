import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useNavigate, useSearchParams } from 'react-router-dom'

import Logo from './Logo'
import api from '../lib/api'

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skillOptions, setSkillOptions] = useState(['overall'])
  const categoryChartRef = useRef()
  const techChartRef = useRef()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const skill = searchParams.get('skill')

  const changeSkill = (nextSkill) => {
    const params = new URLSearchParams()
    if (nextSkill && nextSkill !== 'overall') params.set('skill', nextSkill)
    navigate({ pathname: '/dashboard', search: params.toString() })
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const report = await api.get('/dashboard/latest', {
          params: { skill: skill || undefined },
        })
        setData(report.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [skill])

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
    if (!data) return

    const drawCharts = () => {
      if (categoryChartRef.current) categoryChartRef.current.innerHTML = ''
      if (techChartRef.current) techChartRef.current.innerHTML = ''

      if (categoryChartRef.current) {
        const entries = Object.entries(data.category_scores || {})
        const containerWidth = categoryChartRef.current.clientWidth || 360
        const width = Math.max(320, Math.min(containerWidth, 720))
        const height = 260
        const margin = { top: 16, right: 16, bottom: 36, left: 42 }

        const svg = d3.select(categoryChartRef.current).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`)
        const x = d3.scaleBand().domain(entries.map((d) => d[0])).range([margin.left, width - margin.right]).padding(0.25)
        const y = d3.scaleLinear().domain([0, 100]).nice().range([height - margin.bottom, margin.top])

        svg
          .append('g')
          .attr('fill', '#6d7cff')
          .selectAll('rect')
          .data(entries)
          .enter()
          .append('rect')
          .attr('x', (d) => x(d[0]))
          .attr('y', (d) => y(d[1]))
          .attr('height', (d) => y(0) - y(d[1]))
          .attr('width', x.bandwidth())
          .attr('rx', 8)

        svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x))
        svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y))
      }

      if (techChartRef.current) {
        const entries = Object.entries(data.tech_scores || {})
        const containerWidth = techChartRef.current.clientWidth || 360
        const width = Math.max(320, Math.min(containerWidth, 720))
        const height = 260
        const margin = { top: 16, right: 16, bottom: 36, left: 42 }

        const svg = d3.select(techChartRef.current).append('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`)
        const x = d3.scaleBand().domain(entries.map((d) => d[0])).range([margin.left, width - margin.right]).padding(0.25)
        const y = d3.scaleLinear().domain([0, 100]).nice().range([height - margin.bottom, margin.top])

        svg
          .append('g')
          .attr('fill', '#4fbb88')
          .selectAll('rect')
          .data(entries)
          .enter()
          .append('rect')
          .attr('x', (d) => x(d[0]))
          .attr('y', (d) => y(d[1]))
          .attr('height', (d) => y(0) - y(d[1]))
          .attr('width', x.bandwidth())
          .attr('rx', 8)

        svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x))
        svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y))
      }
    }

    drawCharts()
    window.addEventListener('resize', drawCharts)
    return () => window.removeEventListener('resize', drawCharts)
  }, [data])

  if (loading) return <div className="idp-page"><div className="idp-card text-center">Loading dashboard...</div></div>

  if (error) {
    return (
      <div className="idp-page">
        <div className="idp-card text-center">
          <p className="mb-4 text-red-300">{error}</p>
          <button onClick={() => navigate('/assessment')} className="idp-primary-btn">Take Assessment</button>
        </div>
      </div>
    )
  }

  if (!data) return <div className="idp-page"><div className="idp-card text-center">No data found</div></div>

  const weakestAreas = data.missing_skills || []
  const strongest = data.strong_skills || []

  return (
    <main className="idp-page items-start py-8">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-3 sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button onClick={() => navigate('/assessments')} className="idp-secondary-btn w-full sm:w-auto">Assessments</button>
            <button onClick={() => navigate('/assessment')} className="idp-secondary-btn w-full sm:w-auto">Retake Assessment</button>
          </div>
        </div>

        <div className="idp-card flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-idp-muted">Skill focus</p>
            <p className="text-white capitalize">{skill || data.skill_focus || 'overall'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((opt) => {
              const active = (skill || 'overall') === opt
              return (
                <button
                  key={opt}
                  onClick={() => changeSkill(opt)}
                  className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                    active ? 'bg-white text-[#0b1222] font-semibold' : 'border border-idp-border text-idp-text hover:border-slate-500'
                  }`}
                >
                  {opt === 'overall' ? 'Overall' : opt}
                </button>
              )
            })}
            <button
              onClick={() => navigate(`/learning-path${skill ? `?skill=${encodeURIComponent(skill)}` : ''}`)}
              className="idp-secondary-btn h-10 px-4 text-sm"
            >
              Learning Path
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="idp-card">
            <p className="text-sm uppercase text-idp-muted">Overall Score</p>
            <p className="mt-2 text-5xl font-semibold text-white">{data.scorecard}%</p>
            <p className="mt-3 text-sm text-idp-muted capitalize">Based on {skill || data.skill_focus || 'overall'} assessment</p>
          </div>
          <div className="idp-card md:col-span-2">
            <p className="text-sm uppercase text-idp-muted">Report Summary</p>
            <p className="mt-2 text-idp-text">{data.report}</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="idp-card">
            <h3 className="mb-3 text-lg font-semibold text-white">Category Scores</h3>
            <div ref={categoryChartRef} className="overflow-x-auto" />
          </div>
          <div className="idp-card">
            <h3 className="mb-3 text-lg font-semibold text-white">Technology Scores</h3>
            <div ref={techChartRef} className="overflow-x-auto" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="idp-card">
            <h3 className="mb-3 text-lg font-semibold text-white">Language Scores</h3>
            <ul className="space-y-2 text-idp-text">
              {Object.entries(data.language_scores || {}).map(([name, value]) => (
                <li key={name} className="flex items-center justify-between rounded-lg border border-idp-border px-3 py-2">
                  <span className="capitalize">{name.replace('_', ' ')}</span>
                  <span className="font-semibold">{value}%</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="idp-card">
            <h3 className="mb-3 text-lg font-semibold text-white">Learning Timeline</h3>
            <ol className="space-y-2 text-idp-text">
              {(data.timeline || []).map((step, idx) => (
                <li key={`${idx}-${step}`} className="rounded-lg border border-idp-border px-3 py-2">{step}</li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="idp-card">
            <h3 className="mb-3 text-lg font-semibold text-white">Weakest Areas</h3>
            {weakestAreas.length ? (
              <div className="flex flex-wrap gap-2">
                {weakestAreas.map((item) => (
                  <span key={item} className="rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-sm text-red-200 capitalize">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-idp-muted">No gaps detected.</p>
            )}
            <button
              onClick={() => navigate(`/learning-path${skill ? `?skill=${encodeURIComponent(skill)}` : ''}`)}
              className="idp-primary-btn mt-4 h-12 px-6 text-sm"
            >
              View Learning Path
            </button>
          </div>
          <div className="idp-card">
            <h3 className="mb-3 text-lg font-semibold text-white">Strengths</h3>
            {strongest.length ? (
              <div className="flex flex-wrap gap-2">
                {strongest.map((item) => (
                  <span key={item} className="rounded-full border border-green-400/40 bg-green-400/10 px-3 py-1 text-sm text-green-200 capitalize">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-idp-muted">You will build strengths as you progress.</p>
            )}
          </div>
        </section>

        <section className="idp-card">
          <h3 className="mb-3 text-lg font-semibold text-white">Role-Specific Internet Courses</h3>
          <div className="space-y-3">
            {(data.recommended_courses || []).map((course, idx) => {
              const title = course.title || `Course ${idx + 1}`
              const provider = course.provider || 'Provider'
              const duration = course.duration || 'Self paced'
              const url = course.url || '#'
              const reason = course.reason || ''
              return (
                <div key={`${title}-${idx}`} className="rounded-xl border border-idp-border bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-white">{title}</h4>
                      <p className="text-sm text-idp-muted">{provider} - {duration}</p>
                    </div>
                    <a href={url} target="_blank" rel="noreferrer" className="idp-secondary-btn h-10 px-4 text-sm">Open Course</a>
                  </div>
                  {reason && <p className="mt-2 text-sm text-idp-text">{reason}</p>}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Dashboard

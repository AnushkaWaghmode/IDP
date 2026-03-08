import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useNavigate } from 'react-router-dom'

import Logo from './Logo'
import api from '../lib/api'

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const categoryChartRef = useRef()
  const techChartRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const report = await api.get('/dashboard/latest')
        setData(report.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!data) return

    if (categoryChartRef.current && !categoryChartRef.current.hasChildNodes()) {
      const entries = Object.entries(data.category_scores || {})
      const width = 480
      const height = 260
      const margin = { top: 16, right: 16, bottom: 36, left: 42 }

      const svg = d3.select(categoryChartRef.current).append('svg').attr('width', width).attr('height', height)
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

    if (techChartRef.current && !techChartRef.current.hasChildNodes()) {
      const entries = Object.entries(data.tech_scores || {})
      const width = 480
      const height = 260
      const margin = { top: 16, right: 16, bottom: 36, left: 42 }

      const svg = d3.select(techChartRef.current).append('svg').attr('width', width).attr('height', height)
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

  return (
    <main className="idp-page items-start py-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex gap-3">
            <button onClick={() => navigate('/history')} className="idp-secondary-btn">View History</button>
            <button onClick={() => navigate('/assessment')} className="idp-secondary-btn">Retake Assessment</button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="idp-card">
            <p className="text-sm uppercase text-idp-muted">Overall Score</p>
            <p className="mt-2 text-5xl font-semibold text-white">{data.scorecard}%</p>
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
                      <p className="text-sm text-idp-muted">{provider} • {duration}</p>
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


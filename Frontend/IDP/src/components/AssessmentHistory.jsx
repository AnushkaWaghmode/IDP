import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as d3 from 'd3'

import api from '../lib/api'
import Logo from './Logo'

const AssessmentHistory = () => {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const chartRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/dashboard/assessments')
        const ordered = [...(response.data || [])].reverse()
        setAssessments(ordered)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const chartData = useMemo(
    () =>
      assessments.map((item, idx) => ({
        x: idx + 1,
        score: Number(item.score || 0),
        date: new Date(item.created_at),
      })),
    [assessments]
  )

  useEffect(() => {
    if (!chartRef.current || chartRef.current.hasChildNodes() || !chartData.length) return

    const width = 760
    const height = 320
    const margin = { top: 24, right: 24, bottom: 40, left: 48 }

    const svg = d3.select(chartRef.current).append('svg').attr('width', width).attr('height', height)

    const x = d3
      .scaleLinear()
      .domain([1, chartData.length])
      .range([margin.left, width - margin.right])

    const y = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top])

    const line = d3
      .line()
      .x((d) => x(d.x))
      .y((d) => y(d.score))
      .curve(d3.curveMonotoneX)

    svg
      .append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#7c4dff')
      .attr('stroke-width', 3)
      .attr('d', line)

    svg
      .selectAll('circle')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.x))
      .attr('cy', (d) => y(d.score))
      .attr('r', 5)
      .attr('fill', '#2f7cff')

    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(chartData.length).tickFormat((d) => `A${d}`))
    svg.append('g').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y))
  }, [chartData])

  if (loading) return <main className="idp-page"><div className="idp-card">Loading assessment history...</div></main>

  if (error) {
    return (
      <main className="idp-page">
        <div className="idp-card text-center">
          <p className="text-red-300">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="idp-page items-start py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={() => navigate('/dashboard')} className="idp-secondary-btn">Back to Dashboard</button>
        </div>

        <section className="idp-card">
          <h2 className="text-2xl font-semibold text-white">Assessment History</h2>
          <p className="mt-1 text-idp-muted">Track score trend across assessment attempts.</p>
          {chartData.length ? <div className="mt-5 overflow-x-auto" ref={chartRef} /> : <p className="mt-4 text-idp-muted">No assessment history yet.</p>}
        </section>

        <section className="idp-card">
          <h3 className="mb-4 text-lg font-semibold text-white">Attempts</h3>
          <div className="space-y-3">
            {assessments.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-idp-border bg-white/5 px-4 py-3">
                <div>
                  <p className="text-white">Attempt {idx + 1}</p>
                  <p className="text-sm text-idp-muted">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <p className="text-xl font-semibold text-white">{item.score}%</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AssessmentHistory


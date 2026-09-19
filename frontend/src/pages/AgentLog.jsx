import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { format } from 'date-fns'

const AGENTS = [
  'All', 'Soil Agent', 'Climate Agent', 'Light Agent',
  'Plant Health Agent', 'Irrigation Agent', 'Nutrient Agent',
  'Decision Agent', 'Memory Agent'
]

const AGENT_ICONS = {
  'Soil Agent': '🌱', 'Climate Agent': '🌡️', 'Light Agent': '☀️',
  'Plant Health Agent': '🪴', 'Irrigation Agent': '💧', 'Nutrient Agent': '🧪',
  'Decision Agent': '🧠', 'Memory Agent': '📊',
}

export default function AgentLog() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await api.getAgentLogs(filter === 'All' ? null : filter, 200)
        setLogs(data)
      } catch {}
      setLoading(false)
    }
    fetch()
    const id = setInterval(fetch, 15000)
    return () => clearInterval(id)
  }, [filter])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>📋 Agent Decision Log</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>Full audit trail of agent observations, reasoning and recommendations</p>
      </div>

      {/* Agent filter */}
      <div className="flex flex-wrap gap-2">
        {AGENTS.map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: filter === a ? 'rgba(0,200,150,0.15)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${filter === a ? 'rgba(0,200,150,0.4)' : 'var(--border)'}`,
              color: filter === a ? 'var(--accent)' : 'var(--dim)',
            }}>
            {AGENT_ICONS[a] || ''} {a}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)' }}>
                {['Time', 'Agent', 'Observation', 'Reasoning', 'Recommendation', 'State'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--dim)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--dim)' }}>
                    Loading agent logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--dim)' }}>
                    No agent logs yet. Run a few cycles to see data.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={i} className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: 'rgba(26,48,64,0.4)' }}>
                    <td className="px-4 py-3 font-mono whitespace-nowrap" style={{ color: 'var(--dim)' }}>
                      {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss') : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: 'var(--text)' }}>
                      {AGENT_ICONS[log.agent_name] || '🤖'} {log.agent_name}
                    </td>
                    <td className="px-4 py-3 max-w-xs" style={{ color: 'var(--dim)' }}>
                      <span className="line-clamp-2">{log.observation || '—'}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs" style={{ color: 'var(--dim)' }}>
                      <span className="line-clamp-2">{log.reasoning || '—'}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs" style={{ color: 'var(--accent)' }}>
                      <span className="line-clamp-2">{log.recommendation || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background: 'rgba(0,200,150,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,200,150,0.2)' }}>
                        {log.state || 'COMPLETED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-xs" style={{ color: 'var(--dim)', borderTop: '1px solid var(--border)' }}>
          {logs.length} log entries · Auto-refreshes every 15s
        </div>
      </div>
    </div>
  )
}

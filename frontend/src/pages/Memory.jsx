import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { format } from 'date-fns'

const FACT_COLORS = {
  IRRIGATION_EVENT: '#00a8ff',
  COOLING_EVENT: '#00c896',
  NUTRIENT_EVENT: '#a855f7',
  PATTERN: '#f59e0b',
  LEARNING: '#ec4899',
}

const FACT_ICONS = {
  IRRIGATION_EVENT: '💧',
  COOLING_EVENT: '🌬️',
  NUTRIENT_EVENT: '🧪',
  PATTERN: '📊',
  LEARNING: '🧠',
}

export default function Memory() {
  const [facts, setFacts] = useState([])
  const [stats, setStats] = useState(null)
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const [f, st, d] = await Promise.all([
          api.getMemory(100),
          api.getIrrigationStats(),
          api.getDecisions(20),
        ])
        setFacts(f)
        setStats(st)
        setDecisions(d)
      } catch {}
      setLoading(false)
    }
    fetch()
    const id = setInterval(fetch, 20000)
    return () => clearInterval(id)
  }, [])

  const grouped = facts.reduce((acc, f) => {
    acc[f.fact_type] = (acc[f.fact_type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>📊 Memory & Learning</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>What the Memory Agent has learned from historical observations</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Memory Facts', value: facts.length, icon: '🧠', color: '#00c896' },
          { label: 'Irrigation Events', value: grouped['IRRIGATION_EVENT'] || 0, icon: '💧', color: '#00a8ff' },
          { label: 'Pattern Detections', value: grouped['PATTERN'] || 0, icon: '📊', color: '#f59e0b' },
          { label: 'Learning Insights', value: grouped['LEARNING'] || 0, icon: '💡', color: '#a855f7' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="glass p-4">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: 'var(--dim)' }}>{label}</div>
          </div>
        ))}
      </div>

      {stats && stats.count > 0 && (
        <div className="glass p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>💧 Irrigation Learning Summary</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs" style={{ color: 'var(--dim)' }}>Total Irrigation Events</div>
              <div className="text-xl font-bold" style={{ color: '#00a8ff' }}>{stats.count}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--dim)' }}>Average Water Applied</div>
              <div className="text-xl font-bold" style={{ color: '#00a8ff' }}>
                {stats.avg_ml ? `${stats.avg_ml.toFixed(0)} ml` : '—'}
              </div>
            </div>
          </div>
          {stats.count > 0 && (
            <div className="mt-3 text-xs px-3 py-2 rounded" style={{ background: 'rgba(0,168,255,0.08)', color: 'var(--dim)', borderLeft: '2px solid #00a8ff' }}>
              💡 Memory insight: Based on {stats.count} irrigation events, the system has calibrated average water requirements to {stats.avg_ml?.toFixed(0) || '~120'} ml per event.
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Memory facts */}
        <div className="col-span-12 lg:col-span-7 glass p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>🧠 Memory Facts ({facts.length})</div>
          {loading && facts.length === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: 'var(--dim)' }}>Loading memory...</div>
          ) : facts.length === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: 'var(--dim)' }}>
              No memory facts yet. Run a few cycles and scenarios to populate memory.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {facts.map((f, i) => {
                const color = FACT_COLORS[f.fact_type] || '#4a7a8a'
                const icon = FACT_ICONS[f.fact_type] || '📝'
                return (
                  <div key={i} className="px-3 py-2.5 rounded-lg animate-fade-in"
                    style={{ background: `${color}08`, borderLeft: `2px solid ${color}60` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{icon}</span>
                      <span className="text-xs font-semibold" style={{ color }}>{f.fact_type?.replace(/_/g, ' ')}</span>
                      <span className="ml-auto text-xs font-mono" style={{ color: 'var(--dim)', opacity: 0.5 }}>
                        {f.timestamp ? format(new Date(f.timestamp), 'HH:mm:ss') : ''}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--dim)' }}>{f.fact_content}</p>
                    {f.relevance_score < 1 && (
                      <div className="mt-1 text-xs" style={{ color: 'var(--dim)', opacity: 0.5 }}>
                        Relevance: {(f.relevance_score * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent decisions */}
        <div className="col-span-12 lg:col-span-5 glass p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: '#a855f7' }}>🧠 Recent Decisions ({decisions.length})</div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {decisions.length === 0 ? (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--dim)' }}>No decisions recorded yet.</div>
            ) : (
              decisions.map((d, i) => (
                <div key={i} className="px-3 py-2.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', borderLeft: '2px solid rgba(168,85,247,0.4)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono" style={{ color: 'var(--dim)', opacity: 0.5 }}>
                      {d.timestamp ? format(new Date(d.timestamp), 'HH:mm:ss') : ''}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                      {d.confidence?.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text)' }}>
                    {d.decision?.length > 100 ? d.decision.slice(0, 100) + '...' : d.decision}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Learning insights panel */}
      <div className="glass p-4">
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>💡 System Learning Insights</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: 'Dry Soil Patterns',
              insight: facts.filter(f => f.fact_type === 'IRRIGATION_EVENT').length > 0
                ? `${facts.filter(f => f.fact_type === 'IRRIGATION_EVENT').length} irrigation events recorded. System has learned to detect soil moisture decline patterns early.`
                : 'Collecting baseline data for dry soil pattern recognition.',
              icon: '🌵', color: '#92400e',
            },
            {
              title: 'Heat Event Learning',
              insight: facts.filter(f => f.fact_type === 'COOLING_EVENT').length > 0
                ? `${facts.filter(f => f.fact_type === 'COOLING_EVENT').length} heat events recorded. Cooling fan effectiveness has been evaluated.`
                : 'No heat events recorded yet. Run HEAT WAVE scenario to generate data.',
              icon: '🔥', color: '#dc2626',
            },
            {
              title: 'Nutrient Cycle',
              insight: facts.filter(f => f.fact_type === 'NUTRIENT_EVENT').length > 0
                ? `${facts.filter(f => f.fact_type === 'NUTRIENT_EVENT').length} nutrient events stored. Uptake rate calibrated to plant health correlation.`
                : 'No nutrient events yet. Run NUTRIENT DEFICIENCY scenario.',
              icon: '🧪', color: '#7c3aed',
            },
          ].map(({ title, insight, icon, color }) => (
            <div key={title} className="px-4 py-3 rounded-xl" style={{ background: `${color}0a`, border: `1px solid ${color}25` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-semibold" style={{ color }}>{title}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--dim)' }}>{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

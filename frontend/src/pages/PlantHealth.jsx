import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../App'
import { api } from '../services/api'
import { format } from 'date-fns'
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass px-3 py-2 text-xs">
        <p style={{ color: 'var(--dim)' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

function HealthGauge({ value }) {
  const color = value > 80 ? '#00c896' : value > 60 ? '#f59e0b' : '#ef4444'
  const label = value > 85 ? 'Excellent' : value > 70 ? 'Good' : value > 55 ? 'Fair' : value > 40 ? 'Poor' : 'Critical'
  const pct = value / 100
  const dash = pct * 251
  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} 251`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'stroke-dasharray 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold" style={{ color }}>{value?.toFixed(0)}</div>
          <div className="text-xs" style={{ color: 'var(--dim)' }}>/ 100</div>
        </div>
      </div>
      <div className="text-sm font-semibold mt-2" style={{ color }}>{label}</div>
    </div>
  )
}

function StressBar({ label, value, color, description }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: 'var(--dim)' }}>{label}</span>
        <span style={{ color }}>{value > 70 ? '🔴 HIGH' : value > 40 ? '🟡 MODERATE' : '🟢 LOW'}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
      <div className="text-xs" style={{ color: 'var(--dim)', opacity: 0.6 }}>{description}</div>
    </div>
  )
}

export default function PlantHealth() {
  const { state } = useContext(AppContext)
  const [history, setHistory] = useState([])
  const [timeRange, setTimeRange] = useState('1h')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const limitMap = { '1h': 120, '6h': 720, '24h': 2880, '7d': 20160 }
        const data = await api.getHealthTrend(Math.min(limitMap[timeRange], 100))
        setHistory(data.map(d => ({
          time: format(new Date(d.timestamp), 'HH:mm'),
          health: d.plant_health,
        })))
      } catch {}
    }
    fetchHistory()
    const id = setInterval(fetchHistory, 30000)
    return () => clearInterval(id)
  }, [timeRange])

  const env = state?.environment || {}
  const weather = state?.weather || {}
  const fullEnv = { ...weather, ...env }

  const health = fullEnv.plant_health || 85
  const moisture = fullEnv.soil_moisture || 60
  const temp = fullEnv.temperature || 25
  const nutrients = fullEnv.soil_nutrients || 68
  const light = fullEnv.light_intensity || 400
  const disease = fullEnv.disease_modifier || 0

  // Calculate stress levels (0-100)
  const waterStress = moisture < 20 ? 95 : moisture < 35 ? 65 : moisture > 85 ? 55 : 10
  const heatStress = temp > 38 ? 95 : temp > 34 ? 70 : temp > 30 ? 35 : 5
  const nutrientStress = nutrients < 20 ? 90 : nutrients < 40 ? 60 : nutrients < 55 ? 30 : 5
  const lightStress = light < 100 ? 80 : light < 250 ? 50 : 5
  const diseaseStress = disease * 100

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>🪴 Plant Health Monitor</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>Real-time health score with multi-factor stress analysis</p>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Health gauge */}
        <div className="col-span-12 md:col-span-3 glass p-4">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>Overall Health Score</div>
          <HealthGauge value={health} />
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--dim)' }}>Previous</span>
              <span style={{ color: 'var(--text)' }}>{(health + 2).toFixed(0)}/100</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--dim)' }}>Change</span>
              <span style={{ color: health > 80 ? '#00c896' : '#f59e0b' }}>
                {health > 82 ? '↑ Improving' : health < 78 ? '↓ Declining' : '→ Stable'}
              </span>
            </div>
          </div>
        </div>

        {/* Stress bars */}
        <div className="col-span-12 md:col-span-4 glass p-4">
          <div className="text-xs font-semibold mb-4" style={{ color: 'var(--accent)' }}>Stress Factor Analysis</div>
          <div className="space-y-4">
            <StressBar label="💧 Water Stress" value={waterStress} color="#00a8ff"
              description={`Soil moisture: ${moisture?.toFixed(0)}%${moisture < 35 ? ' — below optimal range' : ' — adequate'}`} />
            <StressBar label="🌡️ Heat Stress" value={heatStress} color="#f59e0b"
              description={`Temperature: ${temp?.toFixed(1)}°C${temp > 32 ? ' — elevated' : ' — normal'}`} />
            <StressBar label="🧪 Nutrient Stress" value={nutrientStress} color="#a855f7"
              description={`Nutrient index: ${nutrients?.toFixed(0)}/100${nutrients < 40 ? ' — deficient' : ''}`} />
            <StressBar label="☀️ Light Stress" value={lightStress} color="#fcd34d"
              description={`Light: ${light?.toFixed(0)} W/m²${light < 200 ? ' — insufficient' : ''}`} />
            {disease > 0 && (
              <StressBar label="🦠 Disease Stress" value={diseaseStress} color="#ef4444"
                description="Plant disease modifier active" />
            )}
          </div>
        </div>

        {/* Health breakdown */}
        <div className="col-span-12 md:col-span-5 glass p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>Health Factor Summary</div>
          <div className="space-y-2">
            {[
              { label: 'Root Zone Hydration', ok: moisture >= 40 && moisture <= 75, msg: moisture < 40 ? `Dry (${moisture?.toFixed(0)}%)` : moisture > 75 ? `Wet (${moisture?.toFixed(0)}%)` : `Optimal (${moisture?.toFixed(0)}%)` },
              { label: 'Thermal Comfort', ok: temp <= 30, msg: temp > 36 ? `Heat stress (${temp?.toFixed(1)}°C)` : temp > 30 ? `Elevated (${temp?.toFixed(1)}°C)` : `Normal (${temp?.toFixed(1)}°C)` },
              { label: 'Nutrient Availability', ok: nutrients >= 50, msg: nutrients < 30 ? `Critical (${nutrients?.toFixed(0)}/100)` : nutrients < 50 ? `Low (${nutrients?.toFixed(0)}/100)` : `Good (${nutrients?.toFixed(0)}/100)` },
              { label: 'Photosynthetic Input', ok: light >= 250, msg: light < 100 ? `Very low (${light?.toFixed(0)} W/m²)` : light < 250 ? `Low (${light?.toFixed(0)} W/m²)` : `Sufficient (${light?.toFixed(0)} W/m²)` },
              { label: 'Root pH Balance', ok: fullEnv.soil_ph >= 5.8 && fullEnv.soil_ph <= 7.2, msg: `pH ${fullEnv.soil_ph?.toFixed(1)}` },
              { label: 'Atmospheric CO₂', ok: fullEnv.co2_level < 1000, msg: `${fullEnv.co2_level?.toFixed(0)} ppm` },
              { label: 'Disease Status', ok: disease === 0, msg: disease > 0 ? `Active (severity ${disease.toFixed(1)})` : 'Clear' },
            ].map(({ label, ok, msg }) => (
              <div key={label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.2)' }}>
                <span className="text-xs" style={{ color: 'var(--dim)' }}>{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: ok ? 'var(--accent)' : '#f59e0b' }}>{msg}</span>
                  <span className={`w-2 h-2 rounded-full ${ok ? 'dot-online' : 'dot-warn'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health trend chart */}
      <div className="glass p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>📈 Health Trend</div>
          <div className="flex gap-2">
            {['1h', '6h', '24h', '7d'].map(t => (
              <button key={t} onClick={() => setTimeRange(t)}
                className="px-3 py-1 rounded text-xs font-medium transition-all"
                style={{
                  background: timeRange === t ? 'rgba(0,200,150,0.15)' : 'rgba(0,0,0,0.3)',
                  border: `1px solid ${timeRange === t ? 'rgba(0,200,150,0.4)' : 'var(--border)'}`,
                  color: timeRange === t ? 'var(--accent)' : 'var(--dim)',
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {history.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c896" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill: '#4a7a8a', fontSize: 10 }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#4a7a8a', fontSize: 10 }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={75} stroke="rgba(0,200,150,0.3)" strokeDasharray="4 4" label={{ value: 'Good', fill: '#4a7a8a', fontSize: 9 }} />
              <ReferenceLine y={50} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" label={{ value: 'Poor', fill: '#4a7a8a', fontSize: 9 }} />
              <Area type="monotone" dataKey="health" name="Health" stroke="#00c896" fill="url(#healthGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-xs" style={{ color: 'var(--dim)' }}>
            Collecting health data... Run a few cycles to see trends.
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { format } from 'date-fns'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass px-3 py-2 text-xs space-y-1">
        <p style={{ color: 'var(--dim)' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

const CHARTS = [
  { key: 'temperature', label: '🌡 Temperature', unit: '°C', color: '#f59e0b', domain: [0, 50] },
  { key: 'humidity', label: '💧 Humidity', unit: '%', color: '#00a8ff', domain: [0, 100] },
  { key: 'soil_moisture', label: '🌱 Soil Moisture', unit: '%', color: '#22c55e', domain: [0, 100] },
  { key: 'light_intensity', label: '☀️ Light Intensity', unit: 'W/m²', color: '#fcd34d', domain: [0, 1000] },
  { key: 'soil_ph', label: '🧪 Soil pH', unit: 'pH', color: '#a855f7', domain: [4, 9] },
  { key: 'plant_health', label: '🌿 Plant Health', unit: '/100', color: '#00c896', domain: [0, 100] },
]

function EnvChart({ chartKey, label, unit, color, data, domain }) {
  const gradId = `grad_${chartKey}`
  return (
    <div className="glass p-4">
      <div className="text-xs font-semibold mb-3" style={{ color }}>{label}</div>
      {data.length > 1 ? (
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: '#4a7a8a', fontSize: 9 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={domain} tick={{ fill: '#4a7a8a', fontSize: 9 }} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey={chartKey} name={label} stroke={color}
              fill={`url(#${gradId})`} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-32 text-xs" style={{ color: 'var(--dim)' }}>
          Collecting data...
        </div>
      )}
    </div>
  )
}

export default function Environment() {
  const [data, setData] = useState([])
  const [timeRange, setTimeRange] = useState('1h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const limitMap = { '1h': 120, '6h': 720, '24h': 2880, '7d': 20000 }
        const rows = await api.getEnvHistory(Math.min(limitMap[timeRange], 200))
        setData(rows.map(r => ({
          time: format(new Date(r.timestamp), 'HH:mm'),
          temperature: r.temperature,
          humidity: r.humidity,
          soil_moisture: r.soil_moisture,
          light_intensity: r.light_intensity,
          soil_ph: r.soil_ph,
          plant_health: r.plant_health,
          co2_level: r.co2_level,
        })))
      } catch {}
      setLoading(false)
    }
    fetchData()
    const id = setInterval(fetchData, 30000)
    return () => clearInterval(id)
  }, [timeRange])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>🌍 Environment History</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>Historical environmental sensor data with interactive charts</p>
        </div>
        <div className="flex gap-2">
          {['1h', '6h', '24h', '7d'].map(t => (
            <button key={t} onClick={() => setTimeRange(t)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all"
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

      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-xs" style={{ color: 'var(--dim)' }}>
          <div className="text-center">
            <div className="text-2xl mb-2 animate-pulse">📊</div>
            <div>Loading environment history...</div>
          </div>
        </div>
      ) : (
        <>
          {/* Combined overview chart */}
          <div className="glass p-4">
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>📈 Multi-Parameter Overview</div>
            {data.length > 1 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fill: '#4a7a8a', fontSize: 9 }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#4a7a8a', fontSize: 9 }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px', color: '#4a7a8a' }} />
                  <Line type="monotone" dataKey="plant_health" name="Health" stroke="#00c896" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="soil_moisture" name="Soil %" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="temperature" name="Temp °C" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="humidity" name="Humidity %" stroke="#00a8ff" strokeWidth={1.5} dot={false} strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-xs" style={{ color: 'var(--dim)' }}>
                Run a few cycles to see data ({data.length} records collected)
              </div>
            )}
          </div>

          {/* Individual charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CHARTS.map(c => (
              <EnvChart key={c.key} {...c} data={data} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

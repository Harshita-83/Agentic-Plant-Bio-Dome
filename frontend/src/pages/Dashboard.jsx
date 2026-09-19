import React, { useContext, useState, useEffect, useRef } from 'react'
import { AppContext } from '../App'
import { api } from '../services/api'
import { format } from 'date-fns'
import {
  Thermometer, Droplets, Leaf, Sun, FlaskConical, Wind,
  Heart, CloudRain, Zap, CheckCircle, AlertTriangle, XCircle,
  Play, RotateCcw
} from 'lucide-react'

// ---- Helper components ----
function SensorCard({ icon: Icon, label, value, unit, status, trend, color }) {
  const statusColor = { ok: '#00c896', warn: '#f59e0b', danger: '#ef4444', dim: '#4a7a8a' }[status] || '#4a7a8a'
  const statusIcon = { ok: <CheckCircle size={10} />, warn: <AlertTriangle size={10} />, danger: <XCircle size={10} /> }[status]
  return (
    <div className="metric-card p-4 transition-all duration-300 hover:scale-[1.02]" style={{ background: 'var(--card)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon size={15} color={color} />
        </div>
        {statusIcon && (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
            {statusIcon}
            <span className="capitalize">{status}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text)' }}>
        {value !== undefined && value !== null ? value : '—'}
        <span className="text-sm font-normal ml-1" style={{ color: 'var(--dim)' }}>{unit}</span>
      </div>
      <div className="text-xs font-medium" style={{ color: 'var(--dim)' }}>{label}</div>
      {trend && <div className="text-xs mt-1" style={{ color: statusColor }}>{trend}</div>}
    </div>
  )
}

function AgentCard({ agent }) {
  const stateBadge = {
    OBSERVING: 'badge-observing', ANALYZING: 'badge-analyzing',
    THINKING: 'badge-thinking', PLANNING: 'badge-planning',
    ACTING: 'badge-acting', COMPLETED: 'badge-completed', IDLE: 'badge-idle',
  }[agent.state] || 'badge-idle'

  return (
    <div className="glass p-4 transition-all duration-300 hover:border-biodome-accent/30 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{agent.icon}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{agent.name}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${stateBadge}`}>{agent.state}</span>
      </div>
      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--dim)' }}>
        {agent.last_observation || 'Initialising...'}
      </p>
      {agent.last_recommendation && (
        <div className="mt-2 text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,200,150,0.05)', color: 'var(--accent)', borderLeft: '2px solid var(--accent)' }}>
          {agent.last_recommendation.length > 80 ? agent.last_recommendation.slice(0, 80) + '...' : agent.last_recommendation}
        </div>
      )}
      {agent.last_update && (
        <div className="mt-2 text-xs font-mono" style={{ color: 'var(--dim)', opacity: 0.5 }}>
          {format(new Date(agent.last_update), 'HH:mm:ss')}
        </div>
      )}
    </div>
  )
}

function ActivityStream({ activities }) {
  const levelClass = {
    agent: 'activity-agent', action: 'activity-action',
    decision: 'activity-decision', scenario: 'activity-scenario',
    demo: 'activity-demo', system: 'activity-system',
    memory: 'activity-memory', error: 'activity-error',
  }
  return (
    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
      {(activities || []).map((a, i) => (
        <div key={i} className={`pl-3 py-2 rounded-r text-xs ${levelClass[a.level] || 'activity-system'} animate-fade-in`}
          style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs opacity-50">{a.timestamp ? format(new Date(a.timestamp), 'HH:mm:ss') : ''}</span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>{a.icon} {a.agent}</span>
          </div>
          <p className="mt-0.5 opacity-80" style={{ color: 'var(--dim)' }}>{a.message}</p>
        </div>
      ))}
      {(!activities || activities.length === 0) && (
        <div className="text-xs text-center py-4" style={{ color: 'var(--dim)' }}>Waiting for agent activity...</div>
      )}
    </div>
  )
}

function DecisionPanel({ decision }) {
  if (!decision || !decision.decision) return (
    <div className="text-xs text-center py-6" style={{ color: 'var(--dim)' }}>Awaiting first decision cycle...</div>
  )
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{decision.decision?.slice(0, 80)}...</div>
        <div className="text-xs px-2 py-1 rounded-full font-bold"
          style={{ background: 'rgba(0,200,150,0.15)', color: 'var(--accent)', border: '1px solid rgba(0,200,150,0.3)' }}>
          {decision.confidence}% confidence
        </div>
      </div>
      <div className="space-y-1">
        {(decision.reasoning_points || []).map((pt, i) => (
          <div key={i} className="text-xs px-3 py-1.5 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--dim)' }}>
            {pt}
          </div>
        ))}
      </div>
      {decision.actions?.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>Actions Taken:</div>
          {decision.actions.map((a, i) => (
            <div key={i} className="text-xs px-3 py-1.5 rounded mb-1 font-medium"
              style={{ background: 'rgba(0,200,150,0.08)', color: 'var(--accent)', border: '1px solid rgba(0,200,150,0.2)' }}>
              {a.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActuatorPanel({ actuators }) {
  const items = [
    { key: 'pump', label: 'Irrigation Pump', icon: '💧', onColor: '#00a8ff' },
    { key: 'fan', label: 'Cooling Fan', icon: '🌬️', onColor: '#00c896' },
    { key: 'grow_light', label: 'Grow Light', icon: '💡', onColor: '#f59e0b' },
    { key: 'nutrient_supply', label: 'Nutrient Supply', icon: '🧪', onColor: '#a855f7' },
    { key: 'humidity_ctrl', label: 'Humidity Control', icon: '🌫️', onColor: '#06b6d4' },
  ]

  const handleToggle = async (key, currentState) => {
    try { await api.controlActuator(key, !currentState) } catch {}
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      {items.map(({ key, label, icon, onColor }) => {
        const isOn = actuators?.[key] || false
        return (
          <button key={key} onClick={() => handleToggle(key, isOn)}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-300"
            style={{
              background: isOn ? `${onColor}15` : 'rgba(0,0,0,0.3)',
              border: `1px solid ${isOn ? `${onColor}40` : 'var(--border)'}`,
              boxShadow: isOn ? `0 0 12px ${onColor}20` : 'none',
            }}>
            <div className="flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <span className="text-xs font-medium" style={{ color: isOn ? onColor : 'var(--dim)' }}>{label}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${isOn ? '' : ''}`}
              style={{ background: isOn ? onColor : 'var(--border)' }}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${isOn ? 'left-5' : 'left-0.5'}`} />
            </div>
          </button>
        )
      })}
    </div>
  )
}

function DigitalTwin({ env, actuators }) {
  const health = env?.plant_health || 85
  const moisture = env?.soil_moisture || 60
  const temp = env?.temperature || 25
  const light = env?.light_intensity || 400

  const isHealthy = health > 75
  const isStressed = health < 60
  const isHot = temp > 34
  const isDry = moisture < 25

  const bgColor = isStressed ? '#1a0d0d' : isHot ? '#1a1208' : '#0a1a12'
  const plantColor = isStressed ? '#8b4513' : health < 75 ? '#6b8e23' : '#2d8a4e'
  const domeClass = isStressed ? 'dome-stress' : isHot ? 'dome-warn' : 'dome-healthy'

  return (
    <div className={`flex items-center justify-center py-2 ${domeClass}`}>
      <svg viewBox="0 0 400 280" width="100%" style={{ maxHeight: '260px' }}>
        {/* Sky/atmosphere */}
        <defs>
          <radialGradient id="skyGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={isHot ? '#3d1a0a' : '#0d2a1a'} />
            <stop offset="100%" stopColor="#080d12" />
          </radialGradient>
          <radialGradient id="soilGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isDry ? '#5c3a1e' : '#3a2210'} />
            <stop offset="100%" stopColor={isDry ? '#3d2a14' : '#2a1a08'} />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Dome background */}
        <ellipse cx="200" cy="160" rx="185" ry="150" fill="url(#skyGrad)" opacity="0.9" />
        <ellipse cx="200" cy="160" rx="185" ry="150" fill="none" stroke="rgba(0,200,150,0.2)" strokeWidth="1.5" />

        {/* Sun/light source */}
        {light > 100 && (
          <circle cx="320" cy="50" r="20" fill={isHot ? '#ff8c00' : '#ffd700'} opacity="0.7" filter="url(#softGlow)" />
        )}
        {actuators?.grow_light && (
          <rect x="120" y="20" width="160" height="8" rx="4" fill="#f59e0b" opacity="0.8" filter="url(#glow)" />
        )}

        {/* Soil layer */}
        <ellipse cx="200" cy="240" rx="170" ry="35" fill="url(#soilGrad)" />
        <ellipse cx="200" cy="237" rx="170" ry="18" fill={isDry ? '#4a2810' : '#2d1a08'} opacity="0.6" />

        {/* Water droplets (if irrigating) */}
        {actuators?.pump && (
          <>
            <circle cx="180" cy="180" r="3" fill="#00a8ff" opacity="0.7" filter="url(#glow)">
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,30" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="160" r="3" fill="#00a8ff" opacity="0.7" filter="url(#glow)">
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,30" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
              <animate attributeName="opacity" values="0.7;0" dur="1.2s" repeatCount="indefinite" begin="0.4s" />
            </circle>
            <circle cx="220" cy="190" r="3" fill="#00a8ff" opacity="0.7" filter="url(#glow)">
              <animateTransform attributeName="transform" type="translate" values="0,0; 0,25" dur="0.9s" repeatCount="indefinite" begin="0.2s" />
              <animate attributeName="opacity" values="0.7;0" dur="0.9s" repeatCount="indefinite" begin="0.2s" />
            </circle>
          </>
        )}

        {/* Plant stem */}
        <line x1="200" y1="235" x2="200" y2="140" stroke={plantColor} strokeWidth="4" strokeLinecap="round" />
        {/* Branches */}
        <line x1="200" y1="200" x2="165" y2="175" stroke={plantColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="200" y1="185" x2="235" y2="165" stroke={plantColor} strokeWidth="3" strokeLinecap="round" />
        <line x1="200" y1="165" x2="175" y2="148" stroke={plantColor} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="200" y1="155" x2="225" y2="145" stroke={plantColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* Leaves */}
        <ellipse cx="148" cy="168" rx="22" ry="12" fill={plantColor} opacity="0.9" transform="rotate(-30, 148, 168)" />
        <ellipse cx="252" cy="158" rx="22" ry="12" fill={plantColor} opacity="0.9" transform="rotate(25, 252, 158)" />
        <ellipse cx="163" cy="143" rx="18" ry="10" fill={plantColor} opacity="0.85" transform="rotate(-20, 163, 143)" />
        <ellipse cx="237" cy="138" rx="18" ry="10" fill={plantColor} opacity="0.85" transform="rotate(15, 237, 138)" />
        {/* Crown */}
        <ellipse cx="200" cy="132" rx="28" ry="18" fill={plantColor} opacity="0.95" filter={isStressed ? undefined : "url(#glow)"} />

        {/* Disease spots */}
        {env?.disease_modifier > 0 && (
          <>
            <circle cx="155" cy="165" r="4" fill="#8b0000" opacity="0.6" />
            <circle cx="240" cy="155" r="3" fill="#8b0000" opacity="0.6" />
          </>
        )}

        {/* Fan airflow */}
        {actuators?.fan && (
          <>
            {[0, 1, 2].map(i => (
              <path key={i} d={`M ${320 + i * 5} ${80 + i * 20} Q ${280} ${100 + i * 15} ${240} ${120 + i * 10}`}
                fill="none" stroke="rgba(0,200,150,0.3)" strokeWidth="1.5" strokeDasharray="5,3">
                <animate attributeName="stroke-dashoffset" values="0;-20" dur="0.8s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
              </path>
            ))}
          </>
        )}

        {/* Moisture indicator in soil */}
        <text x="60" y="252" fontSize="9" fill={isDry ? '#8b5a2b' : '#00a8ff'} opacity="0.8" fontFamily="monospace">
          💧 {moisture?.toFixed(0)}%
        </text>

        {/* Temp indicator */}
        <text x="280" y="252" fontSize="9" fill={isHot ? '#ff8c00' : '#aaa'} opacity="0.8" fontFamily="monospace">
          🌡 {temp?.toFixed(1)}°C
        </text>

        {/* Health ring */}
        <circle cx="200" cy="50" r="22" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="4" />
        <circle cx="200" cy="50" r="22" fill="none"
          stroke={health > 75 ? '#00c896' : health > 55 ? '#f59e0b' : '#ef4444'}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${(health / 100) * 138} 138`}
          transform="rotate(-90 200 50)" filter="url(#glow)" />
        <text x="200" y="54" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="Inter">{health?.toFixed(0)}</text>

        {/* Dome glass outline */}
        <ellipse cx="200" cy="160" rx="185" ry="150" fill="none"
          stroke={isStressed ? 'rgba(239,68,68,0.3)' : 'rgba(0,200,150,0.15)'} strokeWidth="2" />
      </svg>
    </div>
  )
}

const SCENARIOS = [
  { id: 'DRY_SOIL', label: 'Dry Soil', icon: '🌵', color: '#92400e' },
  { id: 'HEAT_WAVE', label: 'Heat Wave', icon: '🔥', color: '#dc2626' },
  { id: 'LOW_LIGHT', label: 'Low Light', icon: '🌑', color: '#4b5563' },
  { id: 'HEAVY_RAIN', label: 'Heavy Rain', icon: '🌧️', color: '#2563eb' },
  { id: 'PLANT_DISEASE', label: 'Disease', icon: '🦠', color: '#7c3aed' },
  { id: 'NUTRIENT_DEFICIENCY', label: 'Nutrient Def.', icon: '🧪', color: '#b45309' },
  { id: 'OVERWATERING', label: 'Overwatering', icon: '💦', color: '#0369a1' },
  { id: 'NORMAL', label: 'Normal', icon: '🌱', color: '#059669' },
]

export default function Dashboard() {
  const { state, mode } = useContext(AppContext)
  const [activeScenario, setActiveScenario] = useState(null)
  const [demoRunning, setDemoRunning] = useState(false)
  const [loading, setLoading] = useState(false)

  const env = state?.environment || {}
  const weather = state?.weather || {}
  const agents = state?.agents || []
  const decision = state?.decision || {}
  const actuators = state?.actuators || {}
  const activity = state?.activity || []

  const fullEnv = { ...weather, ...env }

  const getStatus = (val, okMin, okMax, warnMin, warnMax) => {
    if (val >= okMin && val <= okMax) return 'ok'
    if (val >= warnMin && val <= warnMax) return 'warn'
    return 'danger'
  }

  const handleScenario = async (id) => {
    setLoading(true)
    setActiveScenario(id)
    try { await api.applyScenario(id) } catch {}
    setLoading(false)
  }

  const handleDemo = async () => {
    setDemoRunning(true)
    try {
      await api.startDemo()
      setTimeout(() => setDemoRunning(false), 90000)
    } catch {
      setDemoRunning(false)
    }
  }

  const sensors = [
    { icon: Thermometer, label: 'Temperature', value: fullEnv.temperature?.toFixed(1), unit: '°C', color: '#f59e0b', status: getStatus(fullEnv.temperature, 18, 30, 10, 36), trend: fullEnv.temperature > 32 ? '⚠ Elevated' : '✓ Normal' },
    { icon: Droplets, label: 'Humidity', value: fullEnv.humidity?.toFixed(0), unit: '%', color: '#00a8ff', status: getStatus(fullEnv.humidity, 50, 80, 35, 90), trend: null },
    { icon: Leaf, label: 'Soil Moisture', value: fullEnv.soil_moisture?.toFixed(0), unit: '%', color: '#22c55e', status: getStatus(fullEnv.soil_moisture, 40, 75, 25, 85), trend: fullEnv.soil_moisture < 30 ? '⚠ Dry' : fullEnv.soil_moisture > 80 ? '⚠ Saturated' : '✓ Adequate' },
    { icon: Sun, label: 'Light Intensity', value: fullEnv.light_intensity?.toFixed(0), unit: 'W/m²', color: '#fcd34d', status: getStatus(fullEnv.light_intensity, 200, 900, 50, 200), trend: null },
    { icon: FlaskConical, label: 'Soil pH', value: fullEnv.soil_ph?.toFixed(1), unit: 'pH', color: '#a855f7', status: getStatus(fullEnv.soil_ph, 6.0, 7.0, 5.5, 7.5), trend: null },
    { icon: Wind, label: 'CO₂ Level', value: fullEnv.co2_level?.toFixed(0), unit: 'ppm', color: '#6b7280', status: getStatus(fullEnv.co2_level, 350, 800, 800, 1200), trend: null },
    { icon: Heart, label: 'Plant Health', value: fullEnv.plant_health?.toFixed(0), unit: '/100', color: '#ec4899', status: getStatus(fullEnv.plant_health, 75, 100, 50, 75), trend: fullEnv.plant_health > 85 ? '✓ Excellent' : fullEnv.plant_health > 70 ? '~ Good' : '⚠ Declining' },
    { icon: CloudRain, label: 'Rain Probability', value: fullEnv.rain_probability?.toFixed(0), unit: '%', color: '#0ea5e9', status: 'dim', trend: fullEnv.rain_probability > 70 ? '🌧 Rain expected' : null },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>🌱 Bio-Dome Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>
            {state?.location?.name || 'Mumbai, India'} ·{' '}
            {mode === 'live' ? <span style={{ color: 'var(--accent)' }}>🟢 Live Weather</span> : <span style={{ color: 'var(--warn)' }}>🟡 Simulation Mode</span>}
            {weather.data_source === 'simulation' && mode === 'live' && (
              <span style={{ color: 'var(--warn)' }}> ⚠ Live weather unavailable — using simulation data</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDemo} disabled={demoRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: demoRunning ? 'rgba(0,200,150,0.05)' : 'rgba(0,200,150,0.15)', border: '1px solid rgba(0,200,150,0.4)', color: 'var(--accent)' }}>
            {demoRunning ? <><RotateCcw size={12} className="animate-spin" /> DEMO RUNNING</> : <><Play size={12} /> 🎬 START DEMO</>}
          </button>
          <button onClick={() => api.triggerCycle()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.3)', color: '#00a8ff' }}>
            <Zap size={12} /> Run Cycle
          </button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="grid grid-cols-12 gap-4">

        {/* Left: Sensor grid */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {sensors.map((s, i) => <SensorCard key={i} {...s} />)}
          </div>
        </div>

        {/* Center: Digital Twin + Actuators */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="glass p-3">
            <div className="text-xs font-semibold mb-2 text-center" style={{ color: 'var(--accent)' }}>🌿 Digital Twin</div>
            <DigitalTwin env={fullEnv} actuators={actuators} />
          </div>
          <div className="glass p-4">
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>⚡ Actuators</div>
            <ActuatorPanel actuators={actuators} />
          </div>
        </div>

        {/* Right: Agent cards + Activity */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="glass p-4">
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>🤖 Agent Control Center</div>
            <div className="grid grid-cols-1 gap-2">
              {agents.map((a, i) => <AgentCard key={i} agent={a} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Panel + Activity */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6 glass p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: '#a855f7' }}>🧠 WHY DID THE SYSTEM DO THIS?</div>
          <DecisionPanel decision={decision} />
        </div>
        <div className="col-span-12 lg:col-span-6 glass p-4">
          <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>📡 Agent Communication Stream</div>
          <ActivityStream activities={activity} />
        </div>
      </div>

      {/* Simulation Controls */}
      <div className="glass p-4">
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--warn)' }}>🧪 Simulation Scenarios</div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {SCENARIOS.map(({ id, label, icon, color }) => (
            <button key={id}
              onClick={() => handleScenario(id)}
              disabled={loading && activeScenario === id}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{
                background: activeScenario === id ? `${color}25` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${activeScenario === id ? `${color}60` : 'var(--border)'}`,
                color: activeScenario === id ? color : 'var(--dim)',
                boxShadow: activeScenario === id ? `0 0 15px ${color}20` : 'none',
              }}>
              <span className="text-xl">{icon}</span>
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

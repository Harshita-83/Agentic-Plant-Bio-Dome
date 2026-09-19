import React from 'react'
import { useNavigate } from 'react-router-dom'

const PIPELINE_STEPS = [
  { icon: '🌐', label: 'ONLINE DATA', desc: 'Live weather from Open-Meteo API (temperature, humidity, rain, wind, clouds, sunrise/sunset)', color: '#00a8ff' },
  { icon: '⚙️', label: 'DATA PROCESSING', desc: 'Physics-based simulation merges live weather with calculated soil, light, CO₂ and plant model', color: '#22c55e' },
  { icon: '🤖', label: '8 AI AGENTS', desc: 'Soil · Climate · Light · Plant Health · Irrigation · Nutrient · Decision · Memory', color: '#00c896' },
  { icon: '📡', label: 'AGENT COMMUNICATION', desc: 'Agents publish observations to shared message bus — parallel execution, then Decision Agent collects', color: '#f59e0b' },
  { icon: '🧠', label: 'DECISION AGENT', desc: 'Resolves conflicts (e.g. irrigate vs rain expected), prioritises actions, computes confidence', color: '#a855f7' },
  { icon: '⚡', label: 'ACTION SYSTEM', desc: 'Executes approved actions: irrigation pump, cooling fan, grow light, nutrients, humidity control', color: '#ec4899' },
  { icon: '🌿', label: 'DIGITAL ENVIRONMENT', desc: 'Simulated environment state updates in response to actions — soil moisture, plant health, etc.', color: '#00c896' },
  { icon: '🔄', label: 'FEEDBACK LOOP', desc: 'Updated environment becomes input to the next perception cycle — continuous closed-loop control', color: '#00a8ff' },
  { icon: '📊', label: 'MEMORY', desc: 'Memory Agent stores events, patterns and learns from outcomes to improve future recommendations', color: '#f59e0b' },
  { icon: '↩️', label: 'CONTINUOUS LOOP', desc: 'System repeats every 30 seconds — autonomous operation with no human intervention required', color: '#4a7a8a' },
]

const AGENTS = [
  { icon: '🌱', name: 'Soil Agent', role: 'Monitors soil moisture, pH and nutrients. Detects dry soil, overwatering, nutrient deficiency and unsuitable pH conditions.' },
  { icon: '🌡️', name: 'Climate Agent', role: 'Monitors temperature, humidity, wind and rain forecast. Detects heat stress, cold risk, high humidity (fungal risk) and forecasts rain.' },
  { icon: '☀️', name: 'Light Agent', role: 'Tracks sun angle, cloud cover and grow light status. Determines whether PAR (Photosynthetically Active Radiation) is sufficient.' },
  { icon: '🪴', name: 'Plant Health Agent', role: 'Calculates Plant Health Score (0–100) by combining all stressor inputs. Identifies dominant stressors and priority interventions.' },
  { icon: '💧', name: 'Irrigation Agent', role: 'Multi-condition irrigation decision: evaluates soil moisture, temperature, humidity, rain probability and active precipitation before recommending.' },
  { icon: '🧪', name: 'Nutrient Agent', role: 'Monitors nutrient index and soil pH. pH affects bioavailability — detects deficiency severity and recommends appropriate supplementation.' },
  { icon: '🧠', name: 'Decision Agent', role: 'Central coordinator. Collects all agent messages, resolves conflicts (e.g. irrigation vs rain), prioritises actions and explains reasoning.' },
  { icon: '📊', name: 'Memory Agent', role: 'Persistent storage of all events, decisions and outcomes. Derives learning patterns (e.g. average irrigation volume, heat event frequency).' },
]

export default function Architecture() {
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--accent)' }}>System Architecture</div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>🌱 Agentic Plant Bio-Dome</h1>
        <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--dim)' }}>
          Autonomous Multi-Agent Environmental Intelligence
        </p>
      </div>

      {/* Core statement */}
      <div className="glass p-6 accent-glow">
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>PROJECT STATEMENT</div>
        <blockquote className="text-sm leading-relaxed italic" style={{ color: 'var(--text)' }}>
          "Instead of using physical sensors, our system uses live environmental data and a digital twin. Multiple autonomous agents independently perceive different aspects of the environment, communicate their observations, reason about the situation, and collaborate through a Decision Agent. The system then performs a simulated action and observes the resulting environmental change. The Memory Agent stores the outcome and uses historical information in future decisions."
        </blockquote>
      </div>

      {/* Pipeline */}
      <div>
        <div className="text-xs font-semibold mb-4 text-center" style={{ color: 'var(--accent)' }}>AGENTIC PIPELINE — DATA TO ACTION</div>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-6 top-6 bottom-6 w-px" style={{ background: 'linear-gradient(180deg, rgba(0,200,150,0.4), rgba(0,200,150,0.05))' }} />
          <div className="space-y-2">
            {PIPELINE_STEPS.map(({ icon, label, desc, color }, i) => (
              <div key={i} className="flex gap-4 items-start pl-2 animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 z-10"
                  style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                  {icon}
                </div>
                <div className="flex-1 py-2 px-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)' }}>
                  <div className="text-xs font-bold mb-0.5" style={{ color }}>{label}</div>
                  <div className="text-xs" style={{ color: 'var(--dim)' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent descriptions */}
      <div>
        <div className="text-xs font-semibold mb-4 text-center" style={{ color: 'var(--accent)' }}>THE 8 AGENTS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AGENTS.map(({ icon, name, role }) => (
            <div key={name} className="glass p-4 hover:border-biodome-accent/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{name}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--dim)' }}>{role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Agentic concepts */}
      <div>
        <div className="text-xs font-semibold mb-4 text-center" style={{ color: 'var(--accent)' }}>AGENTIC AI CONCEPTS DEMONSTRATED</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '👁️', label: 'Perception', desc: 'Agents observe real/simulated environmental data each cycle' },
            { icon: '🔬', label: 'Reasoning', desc: 'Each agent analyses observations using domain-specific logic' },
            { icon: '📋', label: 'Planning', desc: 'Agents propose context-aware action recommendations' },
            { icon: '🤝', label: 'Collaboration', desc: 'Messages shared via bus; Decision Agent integrates all views' },
            { icon: '⚖️', label: 'Decision Making', desc: 'Conflict resolution: e.g. irrigation vs imminent rain' },
            { icon: '⚡', label: 'Execution', desc: 'Actions applied to digital twin — actuator state changes' },
            { icon: '🔄', label: 'Feedback', desc: 'Environment updates create next perception cycle input' },
            { icon: '🧠', label: 'Memory', desc: 'Historical patterns improve future recommendations' },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="glass p-3 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-xs font-bold mb-1" style={{ color: 'var(--accent)' }}>{label}</div>
              <div className="text-xs" style={{ color: 'var(--dim)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="glass p-6">
        <div className="text-xs font-semibold mb-3" style={{ color: 'var(--accent)' }}>TECHNOLOGY STACK</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { layer: 'Frontend', tech: 'React 18 + Vite + Tailwind CSS' },
            { layer: 'Charts', tech: 'Recharts' },
            { layer: 'Icons', tech: 'Lucide React' },
            { layer: 'Backend', tech: 'Python 3.11 + FastAPI' },
            { layer: 'Real-time', tech: 'WebSocket (FastAPI)' },
            { layer: 'Database', tech: 'SQLite via aiosqlite' },
            { layer: 'Weather API', tech: 'Open-Meteo (free, no API key)' },
            { layer: 'Orchestration', tech: 'Custom async message-passing' },
            { layer: 'Simulation', tech: 'Physics-based environmental model' },
          ].map(({ layer, tech }) => (
            <div key={layer} className="flex items-start gap-2 py-2 px-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ color: 'var(--accent)' }}>▸</span>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text)' }}>{layer}</div>
                <div style={{ color: 'var(--dim)' }}>{tech}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={() => navigate('/dashboard')}
          className="px-8 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #00c896, #00a876)', color: '#001a12', boxShadow: '0 0 30px rgba(0,200,150,0.3)' }}>
          🌿 ENTER BIO-DOME
        </button>
      </div>
    </div>
  )
}

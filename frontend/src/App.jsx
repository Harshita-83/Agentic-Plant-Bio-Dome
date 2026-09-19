import React, { useState, useCallback, useRef, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useWebSocket } from './hooks/useWebSocket'
import { api } from './services/api'

import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import PlantHealth from './pages/PlantHealth'
import Environment from './pages/Environment'
import AgentLog from './pages/AgentLog'
import Memory from './pages/Memory'
import Architecture from './pages/Architecture'

import {
  Leaf, LayoutDashboard, Activity, Wind, BookOpen, Brain, Map,
  Wifi, WifiOff, Radio, ChevronRight, Menu, X
} from 'lucide-react'

// ---- Shared state context ----
export const AppContext = React.createContext(null)

function AppLayout({ children, state, connected, mode, setMode, location, setLocation }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cityInput, setCityInput] = useState('')

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/health', icon: Activity, label: 'Plant Health' },
    { to: '/environment', icon: Wind, label: 'Environment' },
    { to: '/agents', icon: Brain, label: 'Agent Logs' },
    { to: '/memory', icon: BookOpen, label: 'Memory' },
    { to: '/architecture', icon: Map, label: 'Architecture' },
  ]

  const handleLocationSubmit = async (e) => {
    e.preventDefault()
    if (!cityInput.trim()) return
    try {
      await api.setLocation(cityInput)
      setLocation(cityInput)
    } catch {}
    setCityInput('')
  }

  const toggleMode = async () => {
    const newMode = mode === 'live' ? 'simulation' : 'live'
    try { await api.setMode(newMode) } catch {}
    setMode(newMode)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside className={`flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', flexShrink: 0 }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(0,200,150,0.3), rgba(0,168,255,0.2))', border: '1px solid rgba(0,200,150,0.4)' }}>
            🌱
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-xs font-bold tracking-widest" style={{ color: 'var(--accent)' }}>BIO-DOME</div>
              <div className="text-xs" style={{ color: 'var(--dim)' }}>Agentic AI System</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto p-1 rounded"
            style={{ color: 'var(--dim)' }}>
            {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive ? 'nav-active' : 'text-biodome-dim hover:text-biodome-text hover:bg-white/5'}`
              }>
              <Icon size={16} className="flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Status panel */}
        {sidebarOpen && (
          <div className="p-3 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
            {/* Connection */}
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'dot-online' : 'dot-danger'}`} />
              <span style={{ color: connected ? 'var(--accent)' : 'var(--danger)' }}>
                {connected ? 'System Online' : 'Reconnecting...'}
              </span>
            </div>

            {/* Mode toggle */}
            <button onClick={toggleMode}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: mode === 'live' ? 'rgba(0,200,150,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${mode === 'live' ? 'rgba(0,200,150,0.3)' : 'rgba(245,158,11,0.3)'}`,
                color: mode === 'live' ? 'var(--accent)' : 'var(--warn)',
              }}>
              {mode === 'live' ? <Wifi size={12} /> : <Radio size={12} />}
              {mode === 'live' ? '🟢 LIVE DATA' : '🟡 SIMULATION'}
            </button>

            {/* Location */}
            <form onSubmit={handleLocationSubmit} className="flex gap-1">
              <input value={cityInput} onChange={e => setCityInput(e.target.value)}
                placeholder={location || 'City name...'}
                className="flex-1 px-2 py-1 rounded text-xs bg-transparent border outline-none"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }} />
              <button type="submit" className="px-2 py-1 rounded text-xs"
                style={{ background: 'rgba(0,200,150,0.15)', color: 'var(--accent)' }}>
                <ChevronRight size={12} />
              </button>
            </form>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const [state, setState] = useState(null)
  const [mode, setMode] = useState('live')
  const [location, setLocation] = useState('Mumbai, India')
  const [connected, setConnected] = useState(false)

  const handleWsMessage = useCallback((data) => {
    if (data.type === 'full_state') {
      setState(data)
      if (data.mode) setMode(data.mode)
      if (data.location?.name) setLocation(data.location.name)
    } else if (data.type === 'agents_update') {
      setState(prev => prev ? { ...prev, agents: data.agents } : prev)
    } else if (data.type === 'cycle_start') {
      // no-op, handled by full_state
    }
  }, [])

  const wsConnected = useWebSocket(handleWsMessage)

  useEffect(() => {
    setConnected(wsConnected)
  }, [wsConnected])

  // Fallback: poll state if WS disconnected
  useEffect(() => {
    if (!wsConnected) {
      const id = setInterval(async () => {
        try {
          const s = await api.getState()
          setState({ type: 'full_state', ...s })
        } catch {}
      }, 5000)
      return () => clearInterval(id)
    }
  }, [wsConnected])

  const ctxValue = { state, mode, setMode, location, setLocation, connected }

  return (
    <AppContext.Provider value={ctxValue}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/architecture" element={
            <AppLayout state={state} connected={connected} mode={mode} setMode={setMode} location={location} setLocation={setLocation}>
              <Architecture state={state} />
            </AppLayout>
          } />
          <Route path="/*" element={
            <AppLayout state={state} connected={connected} mode={mode} setMode={setMode} location={location} setLocation={setLocation}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/health" element={<PlantHealth />} />
                <Route path="/environment" element={<Environment />} />
                <Route path="/agents" element={<AgentLog />} />
                <Route path="/memory" element={<Memory />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  )
}

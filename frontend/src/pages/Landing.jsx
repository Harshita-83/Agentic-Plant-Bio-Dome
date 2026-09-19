import React from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Landing() {
  const navigate = useNavigate()

  const handleDemo = async () => {
    try { await api.startDemo() } catch {}
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d2820 0%, #080d12 60%)' }}>

      {/* Background grid */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(0,200,150,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,150,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #00c896, transparent)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full opacity-5 animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, #00a8ff, transparent)', filter: 'blur(60px)', animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl px-8">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl accent-glow"
            style={{ background: 'linear-gradient(135deg, rgba(0,200,150,0.2), rgba(0,168,255,0.1))', border: '1px solid rgba(0,200,150,0.4)' }}>
            🌱
          </div>
        </div>

        {/* Title */}
        <div className="mb-2 text-xs font-mono tracking-[0.3em] uppercase" style={{ color: 'var(--accent)' }}>
          College Research Project · Agentic AI
        </div>
        <h1 className="text-5xl font-bold mb-2 leading-tight">
          <span style={{ background: 'linear-gradient(135deg, #00c896, #00e5a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AGENTIC</span>
        </h1>
        <h1 className="text-5xl font-bold mb-2" style={{ color: 'var(--text)' }}>PLANT BIO-DOME</h1>
        <p className="text-base mt-4 leading-relaxed" style={{ color: 'var(--dim)' }}>
          An autonomous multi-agent ecosystem that perceives, reasons,<br />
          collaborates, and acts to maintain optimal plant growth.
        </p>

        {/* Stats bar */}
        <div className="flex justify-center gap-8 mt-8 mb-10 py-4 px-8 rounded-2xl"
          style={{ background: 'rgba(13,26,31,0.8)', border: '1px solid var(--border)' }}>
          {[
            { val: '8', label: 'AI Agents' },
            { val: 'LIVE', label: 'Weather Data' },
            { val: 'Physics', label: 'Simulation' },
            { val: 'SQLite', label: 'Memory' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{val}</div>
              <div className="text-xs" style={{ color: 'var(--dim)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/dashboard')}
            className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a876)', color: '#001a12', boxShadow: '0 0 30px rgba(0,200,150,0.3)' }}>
            🌿 ENTER BIO-DOME
          </button>
          <button onClick={handleDemo}
            className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(0,168,255,0.1)', border: '1px solid rgba(0,168,255,0.4)', color: '#00a8ff' }}>
            🎬 START DEMO
          </button>
          <button onClick={() => navigate('/architecture')}
            className="px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--dim)' }}>
            🗺 ARCHITECTURE
          </button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs" style={{ color: 'var(--dim)', opacity: 0.5 }}>
          Multi-Agent AI System · React + FastAPI · Open-Meteo Live Weather
        </p>
      </div>
    </div>
  )
}

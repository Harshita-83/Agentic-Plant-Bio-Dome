import axios from 'axios'

const BASE = 'https://agentic-plant-bio-dome.onrender.com/api'

export const api = {
  getState: () => axios.get(`${BASE}/state`).then(r => r.data),
  getWeather: () => axios.get(`${BASE}/weather`).then(r => r.data),
  setMode: (mode) => axios.post(`${BASE}/mode`, { mode }).then(r => r.data),
  setLocation: (city) => axios.post(`${BASE}/location`, { city }).then(r => r.data),
  applyScenario: (scenario) => axios.post(`${BASE}/scenario`, { scenario }).then(r => r.data),
  startDemo: () => axios.post(`${BASE}/demo/start`).then(r => r.data),
  triggerCycle: () => axios.post(`${BASE}/cycle`).then(r => r.data),
  controlActuator: (actuator, state, ml = 120) =>
    axios.post(`${BASE}/actuator`, { actuator, state, ml }).then(r => r.data),

  // History
  getEnvHistory: (limit = 100) =>
    axios.get(`${BASE}/history/environment?limit=${limit}`).then(r => r.data),

  getAgentLogs: (agent = null, limit = 200) => {
    const q = agent
      ? `?agent=${encodeURIComponent(agent)}&limit=${limit}`
      : `?limit=${limit}`

    return axios.get(`${BASE}/history/agents${q}`).then(r => r.data)
  },

  getDecisions: (limit = 50) =>
    axios.get(`${BASE}/history/decisions?limit=${limit}`).then(r => r.data),

  getMemory: (limit = 100) =>
    axios.get(`${BASE}/history/memory?limit=${limit}`).then(r => r.data),

  getActions: (limit = 100) =>
    axios.get(`${BASE}/history/actions?limit=${limit}`).then(r => r.data),

  getHealthTrend: (limit = 50) =>
    axios.get(`${BASE}/history/health?limit=${limit}`).then(r => r.data),

  getIrrigationStats: () =>
    axios.get(`${BASE}/stats/irrigation`).then(r => r.data),
}

// Render uses HTTPS, so WebSocket must use WSS
export const WS_URL = 'wss://agentic-plant-bio-dome.onrender.com/ws'
```

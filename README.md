# 🌱 Agentic Plant Bio-Dome

**Multi-Agent AI System for Autonomous Plant Growth and Environmental Management**

A fully working college-level Agentic AI project demonstrating:
- **Perception** → **Reasoning** → **Planning** → **Collaboration** → **Decision Making** → **Action** → **Feedback** → **Memory**

---

## 🖥️ Requirements (New Laptop Setup)

### Software to Install First

| Software | Version | Download |
|----------|---------|----------|
| **Python** | 3.10, 3.11, or 3.12 | https://www.python.org/downloads/ |
| **Node.js** | 18, 20, or 22 (LTS) | https://nodejs.org/ |
| **Git** (optional) | any | https://git-scm.com/ |

> ⚠️ During Python install, **check "Add Python to PATH"** before clicking Install.

---

## 🚀 Quick Start (Fresh Machine)

### Step 1 — Open two terminal windows (PowerShell or CMD)

---

### Terminal 1 — Backend

```bash
cd C:\Users\----\----\MEG\backend
pip install -r requirements.txt
python -m uvicorn api.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

### Terminal 2 — Frontend

```bash
cd C:\Users\----\----\--\frontend
npm install
npm run dev
```

You should see:
```
VITE v5.x  ready in 400ms
➜  Local:   http://localhost:5173/
```

---

### Step 3 — Open Browser

👉 **http://localhost:5173**

---

## 📦 Python Packages (auto-installed via requirements.txt)

```
fastapi          — Web framework for the API
uvicorn          — ASGI server to run FastAPI
websockets       — Real-time WebSocket support
httpx            — Async HTTP client (for weather API calls)
aiosqlite        — Async SQLite database
python-dotenv    — Environment variable loading
pydantic         — Data validation
pydantic-settings — Settings management
aiohttp          — Async HTTP (fallback client)
```

---

## 📦 Node.js Packages (auto-installed via npm install)

```
react            — UI framework
react-dom        — React DOM rendering
react-router-dom — Client-side routing (navigation between pages)
recharts         — Interactive charts (all graphs)
lucide-react     — Icons
axios            — HTTP requests to backend
date-fns         — Date/time formatting
vite             — Dev server and bundler
tailwindcss      — Utility CSS framework
autoprefixer     — CSS vendor prefixes
postcss          — CSS processing
```

---

## 🌐 Internet Required?

- **Live weather mode**: Yes — uses [Open-Meteo](https://open-meteo.com/) free API (no account needed)
- **Simulation mode**: No — works fully offline with physics-based simulation

If internet is unavailable, the app automatically shows:
> ⚠ Live weather unavailable — using simulation data.

---

## 📁 Project Structure

```
MEG/
├── backend/
│   ├── agents/           ← 8 AI agents
│   ├── services/         ← Weather API + simulation physics
│   ├── api/main.py       ← FastAPI entry point
│   ├── orchestrator.py   ← Agent coordination engine
│   ├── database.py       ← SQLite async layer
│   └── requirements.txt  ← Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/        ← Dashboard, PlantHealth, Environment, AgentLog, Memory, Architecture, Landing
│   │   ├── components/   ← Shared UI components
│   │   ├── hooks/        ← WebSocket hook
│   │   └── services/     ← API client
│   └── package.json      ← Node dependencies
└── README.md
```

---

## 🤖 The 8 Agents

| Agent | Responsibility |
|-------|---------------|
| 🌱 Soil Agent | Moisture, pH, nutrients |
| 🌡️ Climate Agent | Temperature, humidity, rain, wind |
| ☀️ Light Agent | Light intensity, day/night, grow light |
| 🪴 Plant Health Agent | Health score (0–100), stress detection |
| 💧 Irrigation Agent | Multi-condition water decision |
| 🧪 Nutrient Agent | Deficiency detection + supplementation |
| 🧠 Decision Agent | Conflict resolution + action planning |
| 📊 Memory Agent | Persistent learning from history |

---

## 🧪 Demo Scenarios (Dashboard → Simulation Buttons)

| Button | What it does |
|--------|-------------|
| 🌵 Dry Soil | Moisture → 16%, agents detect and irrigate |
| 🔥 Heat Wave | Temp → 39°C, fan activates |
| 🌑 Low Light | Full overcast, grow light activates |
| 🌧️ Heavy Rain | Rain 95%, irrigation deferred |
| 🦠 Plant Disease | Health drops, multi-agent response |
| 🧪 Nutrient Def. | Nutrients → 20%, supplement recommended |
| 💦 Overwatering | Moisture → 90%, drainage alert |
| 🌱 Normal | Reset all to healthy baseline |

---

## 🎬 Demo Mode

Click **START DEMO** on the dashboard for an automated 90-second walkthrough:
1. Normal conditions → soil dries → agents detect → Decision Agent approves irrigation → soil recovers → health improves → Memory stores outcome

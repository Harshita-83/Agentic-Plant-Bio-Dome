"""
FastAPI main entry point.
REST endpoints + WebSocket for real-time updates.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

from orchestrator import orchestrator
from database import (
    get_recent_environment, get_agent_logs, get_decisions,
    get_memory_facts, get_actions, get_health_trend, get_irrigation_stats
)

app = FastAPI(title="Agentic Plant Bio-Dome API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await orchestrator.start()


@app.on_event("shutdown")
async def shutdown():
    orchestrator.stop()


# ---- WebSocket ----
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    orchestrator.register_ws(ws)
    # Send current state immediately
    try:
        state = orchestrator.get_full_state()
        await ws.send_text(json.dumps({"type": "full_state", **state}))
        while True:
            await asyncio.sleep(1)  # Keep connection alive
            try:
                data = await asyncio.wait_for(ws.receive_text(), timeout=0.1)
            except asyncio.TimeoutError:
                pass
    except WebSocketDisconnect:
        orchestrator.unregister_ws(ws)
    except Exception:
        orchestrator.unregister_ws(ws)


# ---- REST: State ----
@app.get("/api/state")
async def get_state():
    return orchestrator.get_full_state()


@app.get("/api/weather")
async def get_weather():
    return orchestrator._current_weather


# ---- REST: Scenarios ----
class ScenarioRequest(BaseModel):
    scenario: str


@app.post("/api/scenario")
async def apply_scenario(req: ScenarioRequest, background_tasks: BackgroundTasks):
    valid = ["DRY_SOIL", "HEAT_WAVE", "LOW_LIGHT", "HEAVY_RAIN", "PLANT_DISEASE",
             "NUTRIENT_DEFICIENCY", "OVERWATERING", "NORMAL"]
    if req.scenario not in valid:
        raise HTTPException(400, f"Unknown scenario. Valid: {valid}")
    background_tasks.add_task(orchestrator.apply_scenario, req.scenario)
    return {"status": "ok", "scenario": req.scenario}


# ---- REST: Demo ----
@app.post("/api/demo/start")
async def start_demo(background_tasks: BackgroundTasks):
    background_tasks.add_task(orchestrator.run_demo)
    return {"status": "demo_started"}


# ---- REST: Mode ----
class ModeRequest(BaseModel):
    mode: str  # "live" | "simulation"


@app.post("/api/mode")
async def set_mode(req: ModeRequest):
    if req.mode not in ["live", "simulation"]:
        raise HTTPException(400, "mode must be 'live' or 'simulation'")
    orchestrator.set_mode(req.mode)
    return {"status": "ok", "mode": req.mode}


# ---- REST: Location ----
class LocationRequest(BaseModel):
    city: str


@app.post("/api/location")
async def set_location(req: LocationRequest):
    await orchestrator.set_location(req.city)
    return {"status": "ok", "location": orchestrator._location}


# ---- REST: Trigger cycle ----
@app.post("/api/cycle")
async def trigger_cycle(background_tasks: BackgroundTasks):
    background_tasks.add_task(orchestrator.run_cycle)
    return {"status": "cycle_triggered"}


# ---- REST: History ----
@app.get("/api/history/environment")
async def environment_history(limit: int = 100):
    return await get_recent_environment(limit)


@app.get("/api/history/agents")
async def agent_log_history(agent: Optional[str] = None, limit: int = 200):
    return await get_agent_logs(agent, limit)


@app.get("/api/history/decisions")
async def decision_history(limit: int = 50):
    return await get_decisions(limit)


@app.get("/api/history/memory")
async def memory_history(limit: int = 100):
    return await get_memory_facts(limit)


@app.get("/api/history/actions")
async def action_history(limit: int = 100):
    return await get_actions(limit)


@app.get("/api/history/health")
async def health_trend(limit: int = 50):
    return await get_health_trend(limit)


@app.get("/api/stats/irrigation")
async def irrigation_stats():
    return await get_irrigation_stats()


# ---- REST: Manual actuator control ----
class ActuatorRequest(BaseModel):
    actuator: str  # pump | fan | grow_light | nutrient_supply | humidity_ctrl
    state: bool
    ml: Optional[int] = 120


@app.post("/api/actuator")
async def control_actuator(req: ActuatorRequest):
    from services.simulation_service import env_state
    if req.actuator == "pump":
        env_state.set_pump(req.state, req.ml)
    elif req.actuator == "fan":
        env_state.set_fan(req.state)
    elif req.actuator == "grow_light":
        env_state.set_grow_light(req.state)
    elif req.actuator == "nutrient_supply":
        env_state.set_nutrient_supply(req.state)
    elif req.actuator == "humidity_ctrl":
        env_state.set_humidity_ctrl(req.state)
    else:
        raise HTTPException(400, "Unknown actuator")
    return {"status": "ok", "actuator": req.actuator, "state": req.state}


@app.get("/api/health")
async def health_check():
    return {"status": "online", "agents": 8, "mode": orchestrator._mode}

"""
Orchestrator — coordinates all 8 agents through the full
Perception → Multi-Agent Analysis → Collaboration → Decision → Action → Feedback → Memory cycle.
Runs on a background asyncio loop and broadcasts state via WebSocket.
"""
import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

from agents.soil_agent import SoilAgent
from agents.climate_agent import ClimateAgent
from agents.light_agent import LightAgent
from agents.plant_health_agent import PlantHealthAgent
from agents.irrigation_agent import IrrigationAgent
from agents.nutrient_agent import NutrientAgent
from agents.decision_agent import DecisionAgent
from agents.memory_agent import MemoryAgent
from services.simulation_service import env_state
from services.weather_service import fetch_weather
from database import (
    init_db, insert_environment, insert_agent_log,
    insert_decision, insert_action, get_memory_facts
)


class AgentOrchestrator:
    CYCLE_INTERVAL = 30  # seconds between full agent cycles

    def __init__(self):
        self.bus: asyncio.Queue = asyncio.Queue()
        self.soil = SoilAgent(self.bus)
        self.climate = ClimateAgent(self.bus)
        self.light = LightAgent(self.bus)
        self.health = PlantHealthAgent(self.bus)
        self.irrigation = IrrigationAgent(self.bus)
        self.nutrient = NutrientAgent(self.bus)
        self.decision = DecisionAgent(self.bus)
        self.memory = MemoryAgent(self.bus)

        self.all_agents = [
            self.soil, self.climate, self.light, self.health,
            self.irrigation, self.nutrient, self.decision, self.memory
        ]

        self._ws_clients: set = set()
        self._activity_stream: list = []
        self._current_weather: dict = {}
        self._current_env: dict = {}
        self._last_decision: dict = {}
        self._demo_running: bool = False
        self._location = {"lat": 19.076, "lon": 72.877, "name": "Mumbai, India"}
        self._mode: str = "live"  # "live" or "simulation"
        self._running: bool = False
        self._task: Optional[asyncio.Task] = None

    # ---- WebSocket broadcast ----
    def register_ws(self, ws):
        self._ws_clients.add(ws)

    def unregister_ws(self, ws):
        self._ws_clients.discard(ws)

    async def _broadcast(self, data: dict):
        if not self._ws_clients:
            return
        msg = json.dumps(data)
        dead = set()
        for ws in self._ws_clients:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._ws_clients.discard(ws)

    def _add_activity(self, agent: str, icon: str, message: str, level: str = "info"):
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent": agent,
            "icon": icon,
            "message": message,
            "level": level,
        }
        self._activity_stream.insert(0, entry)
        self._activity_stream = self._activity_stream[:100]  # Keep last 100
        return entry

    # ---- Main cycle ----
    async def run_cycle(self):
        """Execute one complete agent orchestration cycle."""
        # 1. Fetch weather
        if self._mode == "live":
            weather = await fetch_weather(self._location["lat"], self._location["lon"])
        else:
            from services.weather_service import _simulated_weather
            weather = _simulated_weather()

        self._current_weather = weather

        # 2. Apply override modifiers from simulation service
        effective_weather = dict(weather)
        if env_state.override_temperature is not None:
            effective_weather["temperature"] = env_state.override_temperature
        if env_state.override_humidity is not None:
            effective_weather["humidity"] = env_state.override_humidity
        if env_state.override_rain_probability is not None:
            effective_weather["rain_probability"] = env_state.override_rain_probability
        if env_state.override_cloud_cover is not None:
            effective_weather["cloud_cover"] = env_state.override_cloud_cover
        if env_state.override_precipitation is not None:
            effective_weather["precipitation"] = env_state.override_precipitation

        # 3. Update simulation
        sim_data = env_state.update(effective_weather, dt_seconds=self.CYCLE_INTERVAL)

        # 4. Build full env snapshot
        full_env = {**effective_weather, **sim_data, "data_source": weather.get("data_source", "simulation")}
        self._current_env = full_env

        # 5. Run sub-agents (parallel)
        await self._broadcast({"type": "cycle_start", "timestamp": datetime.now(timezone.utc).isoformat()})
        self._add_activity("System", "🔄", "New decision cycle started", "system")

        # Run agents concurrently
        sub_agents = [self.soil, self.climate, self.light, self.health, self.irrigation, self.nutrient]
        tasks = [agent.run_cycle(full_env) for agent in sub_agents]
        messages = await asyncio.gather(*tasks, return_exceptions=False)

        # Collect messages from bus
        agent_messages = []
        while not self.bus.empty():
            msg = await self.bus.get()
            agent_messages.append(msg.to_dict())

        # 6. Broadcast individual agent observations
        for msg in agent_messages:
            self._add_activity(msg["sender"], "", msg["data"].get("observation", ""), "agent")
            await insert_agent_log(
                msg["sender"],
                msg["data"].get("observation", ""),
                msg["data"].get("reasoning", ""),
                msg["data"].get("recommendation", ""),
            )

        await self._broadcast({"type": "agents_update", "agents": [a.status_dict() for a in self.all_agents]})

        # 7. Memory context for Decision Agent
        memory_context = await get_memory_facts(limit=5)
        self.decision.set_memory_context(memory_context)

        # 8. Decision Agent
        self.decision.state = "THINKING"
        await self._broadcast({"type": "agents_update", "agents": [a.status_dict() for a in self.all_agents]})
        decision = await self.decision.decide(full_env, agent_messages, memory_context)
        self._last_decision = decision
        self._add_activity("Decision Agent", "🧠", decision["decision"], "decision")

        await insert_decision(
            decision["decision"],
            "\n".join(decision["reasoning_points"]),
            decision["confidence"],
            json.dumps(decision["actions"]),
            agent_inputs=decision["agent_inputs"],
        )

        # 9. Execute actions
        for action in decision["actions"]:
            await self._execute_action(action, full_env)

        # 10. Memory agent
        await self.memory.run_cycle(full_env)
        await self.memory.store_decision(decision, full_env)
        self._add_activity("Memory Agent", "📊", f"Cycle #{self.memory._cycle_count} stored. {self.memory.last_observation}", "memory")

        # 11. Persist environment snapshot
        await insert_environment({**full_env})

        # 12. Final broadcast
        await self._broadcast({
            "type": "full_state",
            "weather": effective_weather,
            "environment": sim_data,
            "actuators": env_state.actuator_states(),
            "agents": [a.status_dict() for a in self.all_agents],
            "decision": decision,
            "activity": self._activity_stream[:20],
            "location": self._location,
            "mode": self._mode,
        })

    async def _execute_action(self, action: dict, env: dict):
        action_type = action.get("type")
        value = action.get("value", "ON")
        health_before = env.get("plant_health", 0)
        soil_before = env.get("soil_moisture", 0)

        if action_type == "IRRIGATION":
            ml = int(value)
            env_state.set_pump(True, ml)
            self._add_activity("Action System", "💧", f"Irrigation pump ON — {ml} ml applied", "action")
            await insert_action("IRRIGATION", str(ml), "Irrigation approved by Decision Agent",
                                soil_before=soil_before, health_before=health_before)
        elif action_type == "FAN":
            env_state.set_fan(True)
            self._add_activity("Action System", "🌬️", "Cooling fan activated", "action")
            await insert_action("FAN", "ON", "Heat stress detected", health_before=health_before)
        elif action_type == "GROW_LIGHT":
            env_state.set_grow_light(True)
            self._add_activity("Action System", "💡", "Grow light activated", "action")
            await insert_action("GROW_LIGHT", "ON", "Insufficient natural light", health_before=health_before)
        elif action_type == "NUTRIENTS":
            env_state.set_nutrient_supply(True)
            self._add_activity("Action System", "🧪", "Nutrient supply activated", "action")
            await insert_action("NUTRIENTS", "ON", "Nutrient deficiency", health_before=health_before)
        elif action_type == "HUMIDITY_CTRL":
            env_state.set_humidity_ctrl(True)
            self._add_activity("Action System", "🌫️", "Humidity control activated", "action")

        self.decision.last_action = action.get("label", action_type)

    # ---- Simulation scenarios ----
    async def apply_scenario(self, scenario: str):
        """Apply a predefined simulation scenario."""
        from services.weather_service import invalidate_cache

        if scenario == "DRY_SOIL":
            env_state.soil_moisture = 16.0
            self._add_activity("Simulation", "🌵", "DRY SOIL scenario activated — moisture forced to 16%", "scenario")
        elif scenario == "HEAT_WAVE":
            env_state.override_temperature = 39.0
            env_state.override_humidity = 38.0
            self._add_activity("Simulation", "🔥", "HEAT WAVE scenario — temperature 39°C, humidity 38%", "scenario")
        elif scenario == "LOW_LIGHT":
            env_state.override_cloud_cover = 100.0
            self._add_activity("Simulation", "🌑", "LOW LIGHT scenario — full overcast", "scenario")
        elif scenario == "HEAVY_RAIN":
            env_state.override_rain_probability = 95.0
            env_state.override_precipitation = 15.0
            env_state.soil_moisture = min(90, env_state.soil_moisture + 20)
            self._add_activity("Simulation", "🌧️", "HEAVY RAIN scenario — precipitation 15 mm/hr", "scenario")
        elif scenario == "PLANT_DISEASE":
            env_state.disease_modifier = 1.0
            env_state.plant_health = max(30, env_state.plant_health - 20)
            self._add_activity("Simulation", "🦠", "PLANT DISEASE scenario — health modifier applied", "scenario")
        elif scenario == "NUTRIENT_DEFICIENCY":
            env_state.soil_nutrients = 20.0
            self._add_activity("Simulation", "🧪", "NUTRIENT DEFICIENCY — nutrients forced to 20/100", "scenario")
        elif scenario == "OVERWATERING":
            env_state.soil_moisture = 90.0
            self._add_activity("Simulation", "💦", "OVERWATERING scenario — moisture forced to 90%", "scenario")
        elif scenario == "NORMAL":
            env_state.reset_to_normal()
            invalidate_cache()
            self._add_activity("Simulation", "🌱", "NORMAL CONDITIONS restored", "scenario")

        self._mode = "simulation"
        # Trigger immediate cycle
        await self.run_cycle()

    # ---- Demo mode ----
    async def run_demo(self, broadcast_fn=None):
        """60-90 second predefined demo sequence."""
        if self._demo_running:
            return
        self._demo_running = True
        self._add_activity("DEMO", "🎬", "Demo sequence started", "system")
        await self._broadcast({"type": "demo_start"})

        try:
            # Step 1: Normal
            env_state.reset_to_normal()
            self._mode = "simulation"
            self._add_activity("DEMO", "🌱", "Step 1: Normal environment conditions", "demo")
            await self.run_cycle()
            await asyncio.sleep(5)

            # Step 2: Soil becomes dry
            self._add_activity("DEMO", "🌵", "Step 2: Soil moisture declining...", "demo")
            env_state.soil_moisture = 18.0
            await self.run_cycle()
            await asyncio.sleep(5)

            # Step 3: Agents detect, communicate — run another cycle
            self._add_activity("DEMO", "🔍", "Step 3: Agents detecting stress conditions", "demo")
            await self.run_cycle()
            await asyncio.sleep(6)

            # Step 4: Decision → irrigate
            self._add_activity("DEMO", "🧠", "Step 4: Decision Agent evaluating...", "demo")
            await asyncio.sleep(3)

            # Step 5: Irrigation approved & executed (handled in run_cycle)
            self._add_activity("DEMO", "💧", "Step 5: Irrigation approved and executed", "demo")
            await self.run_cycle()
            await asyncio.sleep(5)

            # Step 6: Soil recovers
            self._add_activity("DEMO", "📈", "Step 6: Soil moisture recovering...", "demo")
            for _ in range(3):
                await self.run_cycle()
                await asyncio.sleep(4)

            # Step 7: Plant health improves
            self._add_activity("DEMO", "🌿", "Step 7: Plant health improving", "demo")
            await self.run_cycle()
            await asyncio.sleep(4)

            # Step 8: Memory stores
            self._add_activity("DEMO", "📊", "Step 8: Memory Agent recording outcome", "demo")
            await asyncio.sleep(2)

            # Step 9: Normal
            self._add_activity("DEMO", "✅", "Step 9: System returned to monitoring mode", "demo")
            await self._broadcast({"type": "demo_complete"})

        finally:
            self._demo_running = False

    # ---- Background loop ----
    async def start(self):
        await init_db()
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def _loop(self):
        while self._running:
            try:
                await self.run_cycle()
            except Exception as e:
                self._add_activity("System", "⚠️", f"Cycle error: {e}", "error")
            await asyncio.sleep(self.CYCLE_INTERVAL)

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()

    # ---- State getters ----
    def get_full_state(self):
        return {
            "weather": self._current_weather,
            "environment": self._current_env,
            "actuators": env_state.actuator_states(),
            "agents": [a.status_dict() for a in self.all_agents],
            "decision": self._last_decision,
            "activity": self._activity_stream[:30],
            "location": self._location,
            "mode": self._mode,
        }

    async def set_location(self, city: str):
        from services.weather_service import get_location_coords, invalidate_cache
        lat, lon, name = await get_location_coords(city)
        self._location = {"lat": lat, "lon": lon, "name": name}
        invalidate_cache()

    def set_mode(self, mode: str):
        self._mode = mode
        if mode == "live":
            from services.weather_service import invalidate_cache
            # Clear overrides
            env_state.override_temperature = None
            env_state.override_humidity = None
            env_state.override_rain_probability = None
            env_state.override_cloud_cover = None
            env_state.override_precipitation = None
            invalidate_cache()


# Singleton
orchestrator = AgentOrchestrator()

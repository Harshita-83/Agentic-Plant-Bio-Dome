"""Agent 4 — Plant Health Agent 🪴"""
from agents.base_agent import BaseAgent


class PlantHealthAgent(BaseAgent):
    name = "Plant Health Agent"
    icon = "🪴"
    description = "Calculates plant health score and detects stress conditions"

    _prev_health: float = 88.0

    async def perceive(self, env: dict) -> str:
        health = env.get("plant_health", 88)
        prev = self._prev_health
        self._prev_health = health
        delta = health - prev
        trend = f"↑ {abs(delta):.1f}" if delta > 0 else f"↓ {abs(delta):.1f}" if delta < 0 else "→ stable"
        label = "Critical" if health < 40 else "Poor" if health < 60 else "Fair" if health < 75 else "Good" if health < 90 else "Excellent"
        return f"Plant health: {health:.0f}/100 ({label}) {trend} from previous cycle."

    async def reason(self, env: dict, obs: str) -> str:
        h = env.get("plant_health", 88)
        m = env.get("soil_moisture", 60)
        t = env.get("temperature", 25)
        n = env.get("soil_nutrients", 68)
        lux = env.get("light_intensity", 500)
        disease = env.get("disease_modifier", 0)
        stressors = []
        if m < 25:
            stressors.append(f"severe water stress (moisture {m}%)")
        elif m < 35:
            stressors.append(f"mild water stress (moisture {m}%)")
        if t > 36:
            stressors.append(f"heat stress ({t}°C)")
        if n < 30:
            stressors.append(f"nutrient stress ({n}/100)")
        if lux < 150:
            stressors.append("light stress (insufficient PAR)")
        if disease > 0:
            stressors.append(f"disease stress (severity {disease:.1f})")
        if not stressors:
            return f"No significant stress detected. Health at {h:.0f}/100."
        return f"Active stressors: {'; '.join(stressors)}. Combined stress is reducing plant health."

    async def plan(self, env: dict, reasoning: str) -> tuple[str, dict]:
        h = env.get("plant_health", 88)
        m = env.get("soil_moisture", 60)
        t = env.get("temperature", 25)
        n = env.get("soil_nutrients", 68)
        lux = env.get("light_intensity", 500)
        priorities = []
        if h < 50:
            priorities.append("URGENT: Multi-stress intervention required immediately")
        if m < 25:
            priorities.append("Priority 1: Irrigation")
        if t > 36:
            priorities.append("Priority 2: Cooling")
        if n < 30:
            priorities.append("Priority 3: Nutrients")
        if lux < 150:
            priorities.append("Priority 4: Grow light")
        if not priorities:
            priorities.append("No action required — plant in healthy state")
        return "; ".join(priorities) + ".", {
            "plant_health": h,
            "health_critical": h < 50,
            "health_poor": h < 70,
            "water_stress": m < 35,
            "heat_stress": t > 32,
            "nutrient_stress": n < 40,
            "light_stress": lux < 200,
        }

"""Agent 2 — Climate Agent 🌡️"""
import asyncio
from agents.base_agent import BaseAgent


class ClimateAgent(BaseAgent):
    name = "Climate Agent"
    icon = "🌡️"
    description = "Monitors temperature, humidity, wind, rain and weather forecast"

    async def perceive(self, env: dict) -> str:
        t = env.get("temperature", 25)
        h = env.get("humidity", 60)
        w = env.get("wind_speed", 10)
        r = env.get("rain_probability", 10)
        prec = env.get("precipitation", 0)
        parts = []
        if t > 36:
            parts.append(f"extreme heat {t}°C")
        elif t > 32:
            parts.append(f"elevated temperature {t}°C")
        elif t < 10:
            parts.append(f"cold stress risk {t}°C")
        else:
            parts.append(f"temperature normal {t}°C")
        if h > 85:
            parts.append(f"high humidity {h}% (fungal risk)")
        elif h < 35:
            parts.append(f"low humidity {h}% (desiccation risk)")
        else:
            parts.append(f"humidity {h}%")
        if r > 70:
            parts.append(f"rain imminent ({r}% probability)")
        elif r > 40:
            parts.append(f"rain possible ({r}%)")
        if prec > 0:
            parts.append(f"active precipitation {prec} mm/hr")
        return "Climate: " + "; ".join(parts) + "."

    async def reason(self, env: dict, obs: str) -> str:
        t = env.get("temperature", 25)
        h = env.get("humidity", 60)
        r = env.get("rain_probability", 10)
        issues = []
        if t > 36:
            issues.append(f"heat stress threshold exceeded ({t}°C > 36°C) — cooling urgently required")
        elif t > 32:
            issues.append(f"elevated temperature ({t}°C) — plant transpiration rate elevated")
        if h > 85:
            issues.append(f"high humidity ({h}%) — fungal disease probability elevated")
        elif h < 35:
            issues.append(f"low humidity ({h}%) — leaf water loss accelerated")
        if r > 70:
            issues.append(f"high rain probability ({r}%) — irrigation likely unnecessary")
        if not issues:
            return "Climate conditions within optimal range. No climate-related stress detected."
        return "Climate analysis: " + "; ".join(issues) + "."

    async def plan(self, env: dict, reasoning: str) -> tuple[str, dict]:
        t = env.get("temperature", 25)
        h = env.get("humidity", 60)
        r = env.get("rain_probability", 10)
        recs = []
        need_fan = False
        need_humidity_ctrl = False
        if t > 36:
            recs.append("Activate cooling fan — extreme heat")
            need_fan = True
        elif t > 32:
            recs.append("Consider fan activation")
            need_fan = True
        if h > 85:
            recs.append("Humidity control recommended to reduce fungal risk")
            need_humidity_ctrl = True
        elif h < 35:
            recs.append("Humidity control recommended — add moisture")
            need_humidity_ctrl = True
        if r > 70:
            recs.append("Defer irrigation — significant rainfall expected")
        if not recs:
            recs.append("Climate conditions acceptable — no action required")
        return "; ".join(recs) + ".", {
            "need_fan": need_fan,
            "need_humidity_ctrl": need_humidity_ctrl,
            "rain_expected": r > 70,
            "temperature": t,
            "humidity": h,
            "rain_probability": r,
        }

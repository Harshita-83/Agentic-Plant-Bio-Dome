"""Agent 1 — Soil Agent 🌱"""
import asyncio
from agents.base_agent import BaseAgent


class SoilAgent(BaseAgent):
    name = "Soil Agent"
    icon = "🌱"
    description = "Monitors soil moisture, pH, and nutrient levels"

    async def perceive(self, env: dict) -> str:
        m = env["soil_moisture"]
        ph = env["soil_ph"]
        n = env["soil_nutrients"]
        parts = []
        if m < 20:
            parts.append(f"soil moisture critically low at {m}%")
        elif m < 35:
            parts.append(f"soil moisture low at {m}%")
        elif m > 85:
            parts.append(f"soil over-saturated at {m}%")
        else:
            parts.append(f"soil moisture adequate at {m}%")
        if ph < 5.8:
            parts.append(f"pH too acidic ({ph})")
        elif ph > 7.2:
            parts.append(f"pH too alkaline ({ph})")
        else:
            parts.append(f"pH optimal ({ph})")
        if n < 20:
            parts.append(f"nutrients critically depleted ({n}/100)")
        elif n < 40:
            parts.append(f"nutrients low ({n}/100)")
        else:
            parts.append(f"nutrients acceptable ({n}/100)")
        return "Soil status: " + "; ".join(parts) + "."

    async def reason(self, env: dict, obs: str) -> str:
        m = env["soil_moisture"]
        n = env["soil_nutrients"]
        issues = []
        if m < 20:
            issues.append("critical water deficit — plant roots cannot uptake nutrients effectively")
        elif m < 35:
            issues.append("moderate moisture deficit — evapotranspiration rate exceeds intake")
        elif m > 85:
            issues.append("waterlogging risk — anaerobic conditions may cause root rot")
        if n < 20:
            issues.append("severe nutrient depletion — deficiency symptoms expected soon")
        elif n < 40:
            issues.append("moderate nutrient deficit — supplementation advised")
        if not issues:
            return "Soil parameters within acceptable range. No immediate intervention required."
        return "Analysis: " + "; ".join(issues) + "."

    async def plan(self, env: dict, reasoning: str) -> tuple[str, dict]:
        m = env["soil_moisture"]
        n = env["soil_nutrients"]
        recs = []
        need_irrigation = False
        need_nutrients = False
        if m < 20:
            recs.append("Urgent irrigation required")
            need_irrigation = True
        elif m < 35:
            recs.append("Irrigation recommended")
            need_irrigation = True
        if n < 40:
            recs.append("Nutrient replenishment recommended")
            need_nutrients = True
        if not recs:
            recs.append("Continue monitoring — conditions stable")
        return "; ".join(recs) + ".", {
            "need_irrigation": need_irrigation,
            "need_nutrients": need_nutrients,
            "soil_moisture": m,
            "soil_ph": env["soil_ph"],
            "soil_nutrients": n,
        }

"""Agent 6 — Nutrient Agent 🧪"""
from agents.base_agent import BaseAgent


class NutrientAgent(BaseAgent):
    name = "Nutrient Agent"
    icon = "🧪"
    description = "Monitors nutrient levels, detects deficiencies and recommends supplementation"

    async def perceive(self, env: dict) -> str:
        n = env.get("soil_nutrients", 68)
        ph = env.get("soil_ph", 6.5)
        h = env.get("plant_health", 88)
        level = "Critical" if n < 20 else "Deficient" if n < 40 else "Low" if n < 55 else "Adequate" if n < 75 else "High"
        return (
            f"Nutrient index: {n:.0f}/100 ({level}). "
            f"Soil pH: {ph:.1f} ({'acidic' if ph < 6 else 'alkaline' if ph > 7 else 'optimal'}). "
            f"Plant health proxy: {h:.0f}/100."
        )

    async def reason(self, env: dict, obs: str) -> str:
        n = env.get("soil_nutrients", 68)
        ph = env.get("soil_ph", 6.5)
        h = env.get("plant_health", 88)
        issues = []
        if n < 20:
            issues.append(f"severe nutrient depletion ({n}/100) — nitrogen/phosphorus/potassium critically low")
        elif n < 40:
            issues.append(f"moderate nutrient deficiency ({n}/100) — supplementation recommended")
        elif n < 55:
            issues.append(f"slight nutrient deficit ({n}/100) — monitor closely")
        if ph < 5.8:
            issues.append(f"acidic pH ({ph}) reduces nutrient bioavailability — consider pH correction")
        elif ph > 7.2:
            issues.append(f"alkaline pH ({ph}) may lock out micronutrients")
        if h < 65 and n < 50:
            issues.append("poor plant health correlates with nutrient stress — intervention needed")
        if not issues:
            return f"Nutrient status adequate ({n}/100). No supplementation required."
        return "Nutrient analysis: " + "; ".join(issues) + "."

    async def plan(self, env: dict, reasoning: str) -> tuple[str, dict]:
        n = env.get("soil_nutrients", 68)
        should_supplement = False
        if n < 20:
            rec = f"URGENT: Apply full-strength NPK supplement immediately (index {n:.0f}/100)"
            should_supplement = True
        elif n < 40:
            rec = f"Apply balanced nutrient solution — moderate deficiency ({n:.0f}/100)"
            should_supplement = True
        elif n < 55:
            rec = f"Light supplementation advisable ({n:.0f}/100)"
            should_supplement = True
        else:
            rec = f"Nutrient levels adequate ({n:.0f}/100) — hold supplementation"
        return rec + ".", {
            "should_supplement": should_supplement,
            "soil_nutrients": n,
            "nutrient_critical": n < 20,
        }

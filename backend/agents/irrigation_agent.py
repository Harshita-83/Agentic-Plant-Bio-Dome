"""Agent 5 — Irrigation Agent 💧"""
from agents.base_agent import BaseAgent


class IrrigationAgent(BaseAgent):
    name = "Irrigation Agent"
    icon = "💧"
    description = "Decides irrigation need considering soil, climate and rain forecast"

    async def perceive(self, env: dict) -> str:
        m = env.get("soil_moisture", 60)
        r = env.get("rain_probability", 10)
        t = env.get("temperature", 25)
        prec = env.get("precipitation", 0)
        pump = env.get("actuators", {}).get("pump", False)
        status = "ACTIVE" if pump else "OFF"
        return (
            f"Irrigation pump: {status}. "
            f"Soil moisture: {m}%. "
            f"Rain probability: {r}%. "
            f"Temperature: {t}°C. "
            f"Active precipitation: {'yes' if prec > 0 else 'none'}."
        )

    async def reason(self, env: dict, obs: str) -> str:
        m = env.get("soil_moisture", 60)
        r = env.get("rain_probability", 10)
        t = env.get("temperature", 25)
        h = env.get("humidity", 60)
        prec = env.get("precipitation", 0)
        reasons = []

        if prec > 2:
            return f"Active rainfall detected ({prec} mm/hr) — irrigation entirely unnecessary."

        if r > 75:
            return f"Rain highly probable ({r}%) within next 3 hours — irrigation would be wasteful; defer to allow rain to act first."

        if m < 20:
            reasons.append(f"critically dry soil ({m}%)")
        elif m < 35:
            reasons.append(f"moderately dry soil ({m}%)")
        else:
            reasons.append(f"soil moisture acceptable ({m}%)")

        if t > 30:
            reasons.append(f"elevated temperature ({t}°C) increases water demand")
        if h < 40:
            reasons.append(f"low humidity ({h}%) accelerates transpiration")
        if r < 30:
            reasons.append(f"rain unlikely ({r}%) — natural replenishment not expected soon")

        return "Irrigation reasoning: " + "; ".join(reasons) + "."

    async def plan(self, env: dict, reasoning: str) -> tuple[str, dict]:
        m = env.get("soil_moisture", 60)
        r = env.get("rain_probability", 10)
        t = env.get("temperature", 25)
        h = env.get("humidity", 60)
        prec = env.get("precipitation", 0)

        # Multi-condition decision — not just a simple threshold
        should_irrigate = False
        ml_amount = 0
        reason_str = ""

        if prec > 2 or r > 75:
            should_irrigate = False
            reason_str = f"Defer — {'active rain' if prec > 2 else f'rain expected ({r}%)'}"
        elif m < 20:
            should_irrigate = True
            # More water needed in hot, dry, low-humidity conditions
            ml_amount = int(100 + (t - 25) * 3 + (60 - h) * 0.5)
            reason_str = f"Critical moisture deficit. Apply {ml_amount} ml."
        elif m < 35 and t > 28 and r < 40:
            should_irrigate = True
            ml_amount = int(80 + (t - 25) * 2)
            reason_str = f"Dry + warm + no rain expected. Apply {ml_amount} ml."
        else:
            reason_str = "Moisture adequate. No irrigation needed."

        return reason_str, {
            "should_irrigate": should_irrigate,
            "ml_amount": ml_amount,
            "defer_reason": "" if should_irrigate else reason_str,
        }

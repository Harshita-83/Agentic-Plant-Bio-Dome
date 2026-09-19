"""Agent 3 — Light Agent ☀️"""
import math
from datetime import datetime, timezone
from agents.base_agent import BaseAgent


class LightAgent(BaseAgent):
    name = "Light Agent"
    icon = "☀️"
    description = "Monitors light intensity, day/night cycle and cloud cover"

    async def perceive(self, env: dict) -> str:
        lux = env.get("light_intensity", 0)
        cloud = env.get("cloud_cover", 20)
        hour = datetime.now(timezone.utc).hour
        is_day = 6 <= hour <= 18
        parts = []
        if not is_day:
            parts.append(f"night-time — no solar light available (hour {hour} UTC)")
        elif lux > 700:
            parts.append(f"strong solar radiation {lux:.0f} W/m²")
        elif lux > 300:
            parts.append(f"moderate light {lux:.0f} W/m²")
        elif lux > 50:
            parts.append(f"low light {lux:.0f} W/m² (cloud cover {cloud}%)")
        else:
            parts.append(f"insufficient light {lux:.0f} W/m² — heavy overcast or night")
        return "Light: " + "; ".join(parts) + "."

    async def reason(self, env: dict, obs: str) -> str:
        lux = env.get("light_intensity", 0)
        cloud = env.get("cloud_cover", 20)
        hour = datetime.now(timezone.utc).hour
        issues = []
        if not (6 <= hour <= 18):
            issues.append("night cycle — photosynthesis halted; grow light can extend photoperiod")
        elif lux < 150:
            issues.append(f"light below photosynthetic compensation point ({lux:.0f} W/m²) — plant cannot accumulate biomass")
        elif lux < 300:
            issues.append(f"sub-optimal light ({lux:.0f} W/m²) — growth rate reduced")
        if cloud > 80:
            issues.append(f"heavy cloud cover ({cloud}%) blocking most solar radiation")
        if not issues:
            return "Light levels sufficient for normal photosynthesis."
        return "Light analysis: " + "; ".join(issues) + "."

    async def plan(self, env: dict, reasoning: str) -> tuple[str, dict]:
        lux = env.get("light_intensity", 0)
        hour = datetime.now(timezone.utc).hour
        need_grow_light = False
        if lux < 200 or not (6 <= hour <= 18):
            need_grow_light = True
            rec = "Activate grow light — insufficient natural light"
        elif lux < 350:
            need_grow_light = True
            rec = "Grow light supplement recommended"
        else:
            rec = "Natural light sufficient — no artificial lighting required"
        return rec + ".", {
            "need_grow_light": need_grow_light,
            "light_intensity": lux,
            "is_day": 6 <= hour <= 18,
        }

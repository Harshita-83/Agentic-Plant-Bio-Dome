"""Agent 8 — Memory & Learning Agent 📊
Stores observations, decisions, actions and derives learning insights.
"""
import asyncio
from agents.base_agent import BaseAgent
from database import (
    insert_memory_fact, get_memory_facts, get_irrigation_stats,
    get_actions, get_agent_logs
)


class MemoryAgent(BaseAgent):
    name = "Memory Agent"
    icon = "📊"
    description = "Stores environmental history, agent observations, decisions and derives learned insights"

    _cycle_count: int = 0
    _dry_soil_count: int = 0
    _heat_events: list = []
    _irrigation_amounts: list = []

    async def perceive(self, env: dict) -> str:
        self._cycle_count += 1
        m = env.get("soil_moisture", 60)
        t = env.get("temperature", 25)
        if m < 30:
            self._dry_soil_count += 1
        if t > 35:
            self._heat_events.append(t)
        return (
            f"Memory cycle #{self._cycle_count}. "
            f"Dry soil events: {self._dry_soil_count}. "
            f"Heat events recorded: {len(self._heat_events)}."
        )

    async def reason(self, env: dict, obs: str) -> str:
        insights = []
        if self._dry_soil_count >= 3:
            insights.append(f"Pattern: dry soil has occurred {self._dry_soil_count} times — check drainage or irrigation schedule")
        if len(self._heat_events) >= 2:
            avg_t = sum(self._heat_events) / len(self._heat_events)
            insights.append(f"Heat stress pattern: {len(self._heat_events)} events, avg temp {avg_t:.1f}°C — cooling system reliability should be reviewed")
        if self._irrigation_amounts:
            avg_ml = sum(self._irrigation_amounts) / len(self._irrigation_amounts)
            insights.append(f"Average irrigation: {avg_ml:.0f} ml over {len(self._irrigation_amounts)} events")
        if not insights:
            return "Insufficient history for pattern analysis. Continuing data collection."
        return "Memory insights: " + "; ".join(insights) + "."

    async def plan(self, env: dict, reasoning: str) -> tuple[str, dict]:
        return "Memory updated. Insights available for Decision Agent context.", {
            "cycle_count": self._cycle_count,
            "dry_soil_count": self._dry_soil_count,
            "heat_events": len(self._heat_events),
        }

    async def store_decision(self, decision: dict, env: dict):
        """Called by orchestrator after a decision is made."""
        actions = decision.get("actions", [])
        for action in actions:
            if action["type"] == "IRRIGATION":
                ml = int(action.get("value", 0))
                self._irrigation_amounts.append(ml)
                await insert_memory_fact(
                    "IRRIGATION_EVENT",
                    f"Irrigation applied: {ml}ml at moisture={env.get('soil_moisture',0):.0f}%, temp={env.get('temperature',0):.0f}°C"
                )
            elif action["type"] == "FAN":
                await insert_memory_fact(
                    "COOLING_EVENT",
                    f"Cooling fan activated at temperature={env.get('temperature',0):.0f}°C"
                )
            elif action["type"] == "NUTRIENTS":
                await insert_memory_fact(
                    "NUTRIENT_EVENT",
                    f"Nutrient supplementation applied at index={env.get('soil_nutrients',0):.0f}/100"
                )

        # Store periodic insight every 10 cycles
        if self._cycle_count % 10 == 0:
            if self._dry_soil_count > 2:
                await insert_memory_fact(
                    "PATTERN",
                    f"Recurring dry soil pattern observed ({self._dry_soil_count} occurrences). Consider adjusting irrigation frequency.",
                    relevance=0.9
                )
            if self._irrigation_amounts:
                avg_ml = sum(self._irrigation_amounts) / len(self._irrigation_amounts)
                await insert_memory_fact(
                    "LEARNING",
                    f"Average irrigation volume: {avg_ml:.0f} ml across {len(self._irrigation_amounts)} events at current conditions.",
                    relevance=0.8
                )

    async def get_recent_context(self) -> list:
        """Return recent memory facts for Decision Agent to use."""
        facts = await get_memory_facts(limit=10)
        return facts

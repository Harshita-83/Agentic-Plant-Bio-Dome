"""
Base Agent — all 8 agents inherit from this.
Implements the Perception → Reasoning → Planning → Action cycle.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Optional
import asyncio


class AgentMessage:
    """Message passed between agents on the shared bus."""
    def __init__(self, sender: str, content: str, data: dict = None, priority: int = 5):
        self.sender = sender
        self.content = content
        self.data = data or {}
        self.priority = priority  # 1 = highest
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self):
        return {
            "sender": self.sender,
            "content": self.content,
            "data": self.data,
            "priority": self.priority,
            "timestamp": self.timestamp,
        }


class BaseAgent(ABC):
    """
    Abstract base for all Bio-Dome agents.
    Each agent goes through: perceive → reason → plan → act
    """
    name: str = "BaseAgent"
    icon: str = "🤖"
    description: str = ""

    def __init__(self, message_bus: asyncio.Queue):
        self.bus = message_bus
        self.state = "IDLE"
        self.last_observation: str = ""
        self.last_reasoning: str = ""
        self.last_recommendation: str = ""
        self.last_action: Optional[str] = None
        self.last_update: Optional[str] = None
        self._env_snapshot: dict = {}
        self._memory_context: list = []

    def set_memory_context(self, facts: list):
        """Inject relevant memory facts before reasoning."""
        self._memory_context = facts[-5:]  # Keep last 5 relevant facts

    async def run_cycle(self, env_data: dict) -> AgentMessage:
        """Execute one full perception→reason→plan→act cycle."""
        self._env_snapshot = env_data
        self.state = "OBSERVING"
        observation = await self.perceive(env_data)
        self.last_observation = observation

        self.state = "ANALYZING"
        await asyncio.sleep(0.05)
        reasoning = await self.reason(env_data, observation)
        self.last_reasoning = reasoning

        self.state = "PLANNING"
        await asyncio.sleep(0.05)
        recommendation, data = await self.plan(env_data, reasoning)
        self.last_recommendation = recommendation

        self.state = "COMPLETED"
        self.last_update = datetime.now(timezone.utc).isoformat()

        msg = AgentMessage(
            sender=self.name,
            content=f"{observation} {reasoning} → {recommendation}",
            data={
                "observation": observation,
                "reasoning": reasoning,
                "recommendation": recommendation,
                **data,
            }
        )
        await self.bus.put(msg)
        return msg

    @abstractmethod
    async def perceive(self, env_data: dict) -> str:
        """Observe the environment and return a text observation."""
        ...

    @abstractmethod
    async def reason(self, env_data: dict, observation: str) -> str:
        """Analyse the observation and return reasoning."""
        ...

    @abstractmethod
    async def plan(self, env_data: dict, reasoning: str) -> tuple[str, dict]:
        """Return (recommendation_text, extra_data_dict)."""
        ...

    def status_dict(self) -> dict:
        return {
            "name": self.name,
            "icon": self.icon,
            "description": self.description,
            "state": self.state,
            "last_observation": self.last_observation,
            "last_reasoning": self.last_reasoning,
            "last_recommendation": self.last_recommendation,
            "last_action": self.last_action,
            "last_update": self.last_update,
        }

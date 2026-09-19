"""Agent 7 — Decision Coordinator Agent 🧠
The central reasoning agent that collects all agent messages,
resolves conflicts, prioritises, and produces an action plan.
"""
import asyncio
from agents.base_agent import BaseAgent, AgentMessage


class DecisionAgent(BaseAgent):
    name = "Decision Agent"
    icon = "🧠"
    description = "Central coordinator — collects agent observations, resolves conflicts, creates action plan"

    _last_decision: dict = {}

    async def perceive(self, env: dict) -> str:
        return "Collecting observations from all sub-agents for this decision cycle."

    async def reason(self, env: dict, obs: str) -> str:
        return "Evaluating agent recommendations, resolving conflicts, and determining priority actions."

    async def plan(self, env: dict, reasoning: str) -> tuple[str, dict]:
        return "Action plan pending agent input collection.", {}

    async def decide(self, env: dict, agent_messages: list[dict], memory_context: list[dict]) -> dict:
        """
        Core decision logic — called by orchestrator after all agents have run.
        Returns a structured decision dict with full reasoning chain.
        """
        self.state = "THINKING"
        await asyncio.sleep(0.1)

        # Extract agent recommendations
        soil_msg = next((m for m in agent_messages if m["sender"] == "Soil Agent"), {})
        climate_msg = next((m for m in agent_messages if m["sender"] == "Climate Agent"), {})
        light_msg = next((m for m in agent_messages if m["sender"] == "Light Agent"), {})
        health_msg = next((m for m in agent_messages if m["sender"] == "Plant Health Agent"), {})
        irr_msg = next((m for m in agent_messages if m["sender"] == "Irrigation Agent"), {})
        nut_msg = next((m for m in agent_messages if m["sender"] == "Nutrient Agent"), {})

        soil_data = soil_msg.get("data", {})
        climate_data = climate_msg.get("data", {})
        light_data = light_msg.get("data", {})
        health_data = health_msg.get("data", {})
        irr_data = irr_msg.get("data", {})
        nut_data = nut_msg.get("data", {})

        actions = []
        reasoning_points = []
        confidence = 70.0

        # --- CONFLICT: irrigation agent says irrigate, climate agent says rain expected ---
        rain_expected = climate_data.get("rain_expected", False)
        should_irrigate = irr_data.get("should_irrigate", False)
        ml = irr_data.get("ml_amount", 0)

        if should_irrigate and rain_expected:
            reasoning_points.append(f"⚡ CONFLICT: Irrigation Agent recommends {ml}ml, but Climate Agent reports rain expected. Rain takes priority — deferring irrigation.")
            should_irrigate = False
            reasoning_points.append("🧠 Resolution: Defer irrigation to avoid overwatering when rain is imminent.")
        elif should_irrigate:
            reasoning_points.append(f"✅ Irrigation Agent recommends {ml}ml. Climate Agent confirms no rain expected. Soil moisture deficit confirmed.")
            actions.append({"type": "IRRIGATION", "value": str(ml), "label": f"💧 Irrigation ON — Apply {ml} ml"})
            reasoning_points.append(f"🧠 Decision: Approve irrigation ({ml} ml).")
            confidence = min(95, confidence + 15)

        # --- COOLING ---
        if climate_data.get("need_fan", False):
            t = env.get("temperature", 25)
            actions.append({"type": "FAN", "value": "ON", "label": f"🌬️ Cooling Fan ON — Temperature {t}°C"})
            reasoning_points.append(f"🌡️ Climate Agent: Heat stress at {t}°C. Fan activation approved.")
            confidence = min(95, confidence + 10)

        # --- GROW LIGHT ---
        if light_data.get("need_grow_light", False):
            actions.append({"type": "GROW_LIGHT", "value": "ON", "label": "💡 Grow Light ON — Insufficient natural light"})
            reasoning_points.append("☀️ Light Agent: Insufficient photosynthetically active radiation. Grow light approved.")
            confidence = min(95, confidence + 5)

        # --- NUTRIENTS ---
        if nut_data.get("should_supplement", False):
            actions.append({"type": "NUTRIENTS", "value": "ON", "label": "🧪 Nutrient Supply ON — Deficiency detected"})
            reasoning_points.append(f"🧪 Nutrient Agent: Deficiency at {nut_data.get('soil_nutrients',0):.0f}/100. Supplementation approved.")
            confidence = min(95, confidence + 10)

        # --- HUMIDITY ---
        if climate_data.get("need_humidity_ctrl", False):
            actions.append({"type": "HUMIDITY_CTRL", "value": "ON", "label": "🌫️ Humidity Control ON"})
            reasoning_points.append("💧 Climate Agent: Humidity out of optimal range. Control system activated.")

        # --- Memory influence ---
        if memory_context:
            latest = memory_context[-1] if memory_context else None
            if latest:
                reasoning_points.append(f"📊 Memory: {latest.get('fact_content','')}")
                confidence = min(95, confidence + 5)

        # Summary decision
        if actions:
            primary_action = actions[0]
            decision_text = f"Execute {len(actions)} action(s): " + ", ".join(a["label"] for a in actions)
        else:
            primary_action = {"type": "MONITOR", "value": "CONTINUE", "label": "✅ Continue monitoring — no intervention required"}
            decision_text = "No intervention required — continue monitoring."
            reasoning_points.append("🧠 All agents report acceptable conditions. System in observation mode.")
            confidence = 85.0

        self.state = "COMPLETED"
        self.last_recommendation = decision_text
        self.last_update = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()

        result = {
            "decision": decision_text,
            "reasoning_points": reasoning_points,
            "actions": actions,
            "primary_action": primary_action,
            "confidence": round(confidence, 1),
            "agent_inputs": {
                "soil": soil_data,
                "climate": climate_data,
                "light": light_data,
                "health": health_data,
                "irrigation": irr_data,
                "nutrients": nut_data,
            },
            "should_irrigate": should_irrigate,
            "ml_amount": ml if should_irrigate else 0,
        }
        self._last_decision = result
        return result

    def get_last_decision(self):
        return self._last_decision

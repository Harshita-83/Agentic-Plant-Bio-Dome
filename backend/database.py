"""
Database module — SQLite via aiosqlite.
Handles all persistent storage for the Bio-Dome system.
"""
import aiosqlite
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "biodome.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS environment_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                temperature REAL,
                humidity REAL,
                soil_moisture REAL,
                soil_ph REAL,
                soil_nutrients REAL,
                light_intensity REAL,
                co2_level REAL,
                rain_probability REAL,
                plant_health REAL,
                data_source TEXT DEFAULT 'simulation'
            );

            CREATE TABLE IF NOT EXISTS agent_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                agent_name TEXT NOT NULL,
                observation TEXT,
                reasoning TEXT,
                recommendation TEXT,
                action TEXT,
                result TEXT,
                state TEXT DEFAULT 'COMPLETED'
            );

            CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                decision TEXT NOT NULL,
                reasoning TEXT,
                confidence REAL,
                action_taken TEXT,
                result TEXT,
                agent_inputs TEXT
            );

            CREATE TABLE IF NOT EXISTS actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                action_type TEXT NOT NULL,
                value TEXT,
                reason TEXT,
                soil_moisture_before REAL,
                soil_moisture_after REAL,
                plant_health_before REAL,
                plant_health_after REAL
            );

            CREATE TABLE IF NOT EXISTS memory_facts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                fact_type TEXT NOT NULL,
                fact_content TEXT NOT NULL,
                relevance_score REAL DEFAULT 1.0
            );
        """)
        await db.commit()


async def insert_environment(data: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO environment_history
            (timestamp, temperature, humidity, soil_moisture, soil_ph,
             soil_nutrients, light_intensity, co2_level, rain_probability, plant_health, data_source)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (
            datetime.utcnow().isoformat(),
            data.get("temperature"), data.get("humidity"),
            data.get("soil_moisture"), data.get("soil_ph"),
            data.get("soil_nutrients"), data.get("light_intensity"),
            data.get("co2_level"), data.get("rain_probability"),
            data.get("plant_health"), data.get("data_source", "simulation")
        ))
        await db.commit()


async def insert_agent_log(agent_name: str, observation: str, reasoning: str,
                            recommendation: str, action: str = None, result: str = None, state: str = "COMPLETED"):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO agent_logs (timestamp, agent_name, observation, reasoning, recommendation, action, result, state)
            VALUES (?,?,?,?,?,?,?,?)
        """, (datetime.utcnow().isoformat(), agent_name, observation, reasoning, recommendation, action, result, state))
        await db.commit()


async def insert_decision(decision: str, reasoning: str, confidence: float,
                           action_taken: str, result: str = None, agent_inputs: dict = None):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO decisions (timestamp, decision, reasoning, confidence, action_taken, result, agent_inputs)
            VALUES (?,?,?,?,?,?,?)
        """, (datetime.utcnow().isoformat(), decision, reasoning, confidence, action_taken, result,
              json.dumps(agent_inputs or {})))
        await db.commit()


async def insert_action(action_type: str, value: str, reason: str,
                         soil_before: float = None, soil_after: float = None,
                         health_before: float = None, health_after: float = None):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO actions
            (timestamp, action_type, value, reason, soil_moisture_before, soil_moisture_after,
             plant_health_before, plant_health_after)
            VALUES (?,?,?,?,?,?,?,?)
        """, (datetime.utcnow().isoformat(), action_type, value, reason,
              soil_before, soil_after, health_before, health_after))
        await db.commit()


async def insert_memory_fact(fact_type: str, content: str, relevance: float = 1.0):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO memory_facts (timestamp, fact_type, fact_content, relevance_score)
            VALUES (?,?,?,?)
        """, (datetime.utcnow().isoformat(), fact_type, content, relevance))
        await db.commit()


async def get_recent_environment(limit: int = 100):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM environment_history ORDER BY id DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in reversed(rows)]


async def get_agent_logs(agent_name: str = None, limit: int = 200):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        if agent_name:
            async with db.execute(
                "SELECT * FROM agent_logs WHERE agent_name=? ORDER BY id DESC LIMIT ?",
                (agent_name, limit)
            ) as cursor:
                rows = await cursor.fetchall()
        else:
            async with db.execute(
                "SELECT * FROM agent_logs ORDER BY id DESC LIMIT ?", (limit,)
            ) as cursor:
                rows = await cursor.fetchall()
        return [dict(r) for r in rows]


async def get_decisions(limit: int = 50):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM decisions ORDER BY id DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_memory_facts(limit: int = 100):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM memory_facts ORDER BY id DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_actions(limit: int = 100):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM actions ORDER BY id DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_irrigation_stats():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT COUNT(*) as count, AVG(CAST(value as REAL)) as avg_ml FROM actions WHERE action_type='IRRIGATION'"
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else {"count": 0, "avg_ml": 0}


async def get_health_trend(limit: int = 50):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT timestamp, plant_health FROM environment_history ORDER BY id DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in reversed(rows)]

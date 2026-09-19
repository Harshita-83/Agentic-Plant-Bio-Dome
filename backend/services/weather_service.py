"""
Weather service — uses Open-Meteo (free, no API key required).
Falls back to realistic simulated data on any failure.
"""
import httpx
import math
import asyncio
from datetime import datetime, timezone
from typing import Optional

# Open-Meteo geocoding + weather endpoint
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

_cache: dict = {}
_cache_age: float = 0.0
_CACHE_TTL = 600  # 10 minutes


async def get_location_coords(city: str = "Mumbai") -> tuple[float, float, str]:
    """Return (lat, lon, display_name) for a city name."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(GEOCODING_URL, params={"name": city, "count": 1, "language": "en", "format": "json"})
            resp.raise_for_status()
            data = resp.json()
            if data.get("results"):
                r = data["results"][0]
                return r["latitude"], r["longitude"], f"{r['name']}, {r.get('country', '')}"
    except Exception:
        pass
    # Default: Mumbai
    return 19.076, 72.877, city


async def fetch_weather(lat: float = 19.076, lon: float = 72.877) -> dict:
    """
    Fetch current weather from Open-Meteo.
    Returns a normalised dict. Falls back to simulation on error.
    """
    global _cache, _cache_age
    import time
    now = time.time()
    if _cache and (now - _cache_age) < _CACHE_TTL:
        return _cache

    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m", "relative_humidity_2m", "precipitation",
                "cloud_cover", "wind_speed_10m", "weather_code"
            ],
            "hourly": [
                "precipitation_probability", "temperature_2m", "relative_humidity_2m"
            ],
            "daily": ["sunrise", "sunset", "precipitation_probability_max"],
            "timezone": "auto",
            "forecast_days": 2,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(WEATHER_URL, params=params)
            resp.raise_for_status()
            raw = resp.json()

        current = raw.get("current", {})
        hourly = raw.get("hourly", {})
        daily = raw.get("daily", {})

        # Rain probability next 3h
        hour_idx = 0
        try:
            hour_idx = next(
                i for i, t in enumerate(hourly.get("time", []))
                if t >= datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
            )
        except StopIteration:
            pass
        rain_prob_3h = max(hourly.get("precipitation_probability", [0])[hour_idx:hour_idx + 3] or [0])

        result = {
            "temperature": current.get("temperature_2m", 28.0),
            "humidity": current.get("relative_humidity_2m", 65.0),
            "precipitation": current.get("precipitation", 0.0),
            "cloud_cover": current.get("cloud_cover", 30.0),
            "wind_speed": current.get("wind_speed_10m", 10.0),
            "weather_code": current.get("weather_code", 0),
            "rain_probability": rain_prob_3h,
            "sunrise": daily.get("sunrise", [""])[0],
            "sunset": daily.get("sunset", [""])[0],
            "forecast_rain_max": daily.get("precipitation_probability_max", [0, 0])[0],
            "data_source": "live",
            "live": True,
        }
        _cache = result
        _cache_age = now
        return result

    except Exception as e:
        return _simulated_weather(error=str(e))


def _simulated_weather(error: str = "") -> dict:
    """Generate realistic weather simulation based on time of day."""
    hour = datetime.now(timezone.utc).hour
    # Temperature follows a day curve: cooler at night, peak ~14:00 UTC
    base_temp = 26.0
    temp_variation = 6.0 * math.sin(math.pi * (hour - 6) / 12) if 6 <= hour <= 18 else -3.0
    temperature = base_temp + temp_variation

    humidity = 70 - (temperature - 26) * 1.5  # Inverse relation
    cloud_cover = 25.0
    precipitation = 0.0
    rain_probability = 10.0

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
    return {
        "temperature": round(temperature, 1),
        "humidity": round(max(30, min(95, humidity)), 1),
        "precipitation": precipitation,
        "cloud_cover": cloud_cover,
        "wind_speed": 12.0,
        "weather_code": 0,
        "rain_probability": rain_probability,
        "sunrise": "2024-01-01T06:30",
        "sunset": "2024-01-01T18:30",
        "forecast_rain_max": 15.0,
        "data_source": "simulation",
        "live": False,
        "error": error,
    }


def invalidate_cache():
    global _cache, _cache_age
    _cache = {}
    _cache_age = 0.0

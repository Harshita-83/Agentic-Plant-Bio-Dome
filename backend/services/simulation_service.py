"""
Environmental simulation service.
Physics-based model for soil moisture, light, CO2, plant health etc.
Values change logically — NOT randomly.
"""
import math
from datetime import datetime, timezone
from typing import Optional


class EnvironmentState:
    """Single source of truth for the simulated environment."""

    def __init__(self):
        self.reset_to_normal()

    def reset_to_normal(self):
        self.soil_moisture = 62.0       # %
        self.soil_ph = 6.5              # pH
        self.soil_nutrients = 68.0      # 0-100 index
        self.co2_level = 420.0          # ppm
        self.plant_health = 88.0        # 0-100
        self.disease_modifier = 0.0     # 0 = no disease
        self.override_temperature: Optional[float] = None
        self.override_humidity: Optional[float] = None
        self.override_rain_probability: Optional[float] = None
        self.override_cloud_cover: Optional[float] = None
        self.override_precipitation: Optional[float] = None
        self._irrigation_timer = 0
        self._nutrient_timer = 0
        self._fan_on = False
        self._light_on = False
        self._nutrient_on = False
        self._humidity_ctrl_on = False
        self._pump_on = False

    # ---------- Actuator setters ----------
    def set_pump(self, on: bool, ml: float = 120):
        self._pump_on = on
        if on:
            self._irrigation_timer = ml  # ml remaining to apply

    def set_fan(self, on: bool):
        self._fan_on = on

    def set_grow_light(self, on: bool):
        self._light_on = on

    def set_nutrient_supply(self, on: bool):
        self._nutrient_on = on
        if on:
            self._nutrient_timer = 10

    def set_humidity_ctrl(self, on: bool):
        self._humidity_ctrl_on = on

    def actuator_states(self):
        return {
            "pump": self._pump_on,
            "fan": self._fan_on,
            "grow_light": self._light_on,
            "nutrient_supply": self._nutrient_on,
            "humidity_ctrl": self._humidity_ctrl_on,
        }

    # ---------- Physics update (called every cycle) ----------
    def update(self, weather: dict, dt_seconds: float = 30.0):
        """
        Advance the simulation by dt_seconds using real or simulated weather.
        All rates are per-second, scaled to dt.
        """
        temp = weather.get("temperature", 25.0)
        humidity = weather.get("humidity", 60.0)
        precip_mm = weather.get("precipitation", 0.0)     # mm/hr
        cloud_cover = weather.get("cloud_cover", 20.0)    # %
        hour = datetime.now(timezone.utc).hour

        dt_hr = dt_seconds / 3600.0

        # --- Soil moisture ---
        # Evapotranspiration: increases with temp and sun, decreases with humidity
        et_rate = max(0, (temp - 15) * 0.3 + (100 - humidity) * 0.05 - cloud_cover * 0.01)
        evap_loss = et_rate * dt_hr
        rain_gain = precip_mm * 0.8 * dt_hr                # 80% efficiency
        irrigation_gain = 0.0
        if self._pump_on and self._irrigation_timer > 0:
            ml_this_step = min(self._irrigation_timer, 20 * dt_hr * 60)
            irrigation_gain = ml_this_step * 0.08
            self._irrigation_timer -= ml_this_step
            if self._irrigation_timer <= 0:
                self._pump_on = False
        self.soil_moisture = max(5.0, min(95.0,
            self.soil_moisture - evap_loss + rain_gain + irrigation_gain))

        # --- Soil pH ---
        # Heavy rain slightly acidifies, irrigation with neutral water stabilises
        if precip_mm > 5:
            self.soil_ph = max(5.5, self.soil_ph - 0.002 * dt_hr)
        if irrigation_gain > 0:
            self.soil_ph = min(7.0, self.soil_ph + 0.001 * dt_hr)
        # Natural drift toward 6.5
        self.soil_ph += (6.5 - self.soil_ph) * 0.001 * dt_hr

        # --- Soil nutrients ---
        # Plant uptake rate (faster when healthy & moist)
        uptake = 0.5 * (self.plant_health / 100) * (self.soil_moisture / 100) * dt_hr
        if self._nutrient_on and self._nutrient_timer > 0:
            nutrient_gain = 3.0 * dt_hr
            self._nutrient_timer -= dt_hr
            if self._nutrient_timer <= 0:
                self._nutrient_on = False
        else:
            nutrient_gain = 0.0
        self.soil_nutrients = max(5.0, min(100.0, self.soil_nutrients - uptake + nutrient_gain))

        # --- CO2 ---
        # Higher during night (no photosynthesis), lower during peak daylight
        is_day = 6 <= hour <= 18
        if is_day and cloud_cover < 80:
            co2_delta = -0.5 * dt_hr * (self.plant_health / 100)
        else:
            co2_delta = 0.3 * dt_hr
        # Fan increases ventilation
        if self._fan_on:
            co2_delta -= 0.2 * dt_hr
        self.co2_level = max(350.0, min(1500.0, self.co2_level + co2_delta))

        # --- Fan cooling ---
        # Fan reduces effective temperature by ~3°C (handled in weather data passed to agents)

        # --- Humidity control ---
        # If humidity ctrl is on, converge humidity toward 65%
        if self._humidity_ctrl_on:
            humidity = humidity + (65 - humidity) * 0.05

        # --- Plant health ---
        health_delta = self._compute_health_delta(temp, humidity, cloud_cover)
        self.plant_health = max(10.0, min(100.0, self.plant_health + health_delta * dt_hr))

        return self._snapshot(weather)

    def _compute_health_delta(self, temp, humidity, cloud_cover):
        """Compute the per-hour change to plant health based on stressors."""
        delta = 0.0

        # Heat stress
        if temp > 35:
            delta -= 2.0 * ((temp - 35) / 10)
        elif temp > 30:
            delta -= 0.5
        elif 18 <= temp <= 28:
            delta += 0.3   # Optimal

        # Water stress
        if self.soil_moisture < 20:
            delta -= 2.5
        elif self.soil_moisture < 35:
            delta -= 0.8
        elif 40 <= self.soil_moisture <= 75:
            delta += 0.2
        elif self.soil_moisture > 85:
            delta -= 1.0   # Overwatering / root rot risk

        # Nutrient stress
        if self.soil_nutrients < 20:
            delta -= 1.5
        elif self.soil_nutrients < 35:
            delta -= 0.5

        # Light stress (cloud cover proxy)
        if cloud_cover > 90:
            delta -= 0.3
        elif cloud_cover < 40:
            delta += 0.1

        # pH stress
        if self.soil_ph < 5.5 or self.soil_ph > 7.5:
            delta -= 1.0
        elif 5.8 <= self.soil_ph <= 7.0:
            delta += 0.05

        # Disease
        delta -= self.disease_modifier * 3.0

        # CO2
        if self.co2_level > 1000:
            delta -= 0.5
        elif 400 <= self.co2_level <= 800:
            delta += 0.05

        # Grow light supplement at night
        if self._light_on:
            delta += 0.2

        return delta

    def _snapshot(self, weather: dict) -> dict:
        """Return current full state as a dict."""
        temp = weather.get("temperature", 25.0)
        humidity = weather.get("humidity", 60.0)
        cloud_cover = weather.get("cloud_cover", 20.0)
        hour = datetime.now(timezone.utc).hour

        # Light intensity: 0-1000 W/m²
        sun_angle_rad = math.pi * (hour - 6) / 12 if 6 <= hour <= 18 else 0
        base_light = max(0, math.sin(sun_angle_rad)) * 1000
        light_intensity = base_light * (1 - cloud_cover / 100)
        if self._light_on:
            light_intensity = max(light_intensity, 350)  # Grow light supplement

        return {
            "soil_moisture": round(self.soil_moisture, 1),
            "soil_ph": round(self.soil_ph, 2),
            "soil_nutrients": round(self.soil_nutrients, 1),
            "co2_level": round(self.co2_level, 0),
            "plant_health": round(self.plant_health, 1),
            "light_intensity": round(light_intensity, 0),
            "disease_modifier": self.disease_modifier,
            "actuators": self.actuator_states(),
        }


# Global singleton
env_state = EnvironmentState()

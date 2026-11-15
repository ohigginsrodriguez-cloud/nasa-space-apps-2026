"""Deterministic synthetic provider for UI and API development."""

from calendar import monthrange
from datetime import date
from math import cos, sin, tau

from app.catalog import Variable
from app.schemas.analysis import Observation, RegionInfo


class DemoProvider:
    """Generate clearly synthetic monthly data; never label it as NASA data."""

    id = "demo"
    source_url = None

    def get_series(
        self,
        variable: Variable,
        region: RegionInfo,
        start_date: date,
        end_date: date,
    ) -> list[Observation]:
        output: list[Observation] = []
        start_m = date(start_date.year, start_date.month, 1)
        end_m = date(end_date.year, end_date.month, 1)
        current = start_m
        # Avoid Python's process-randomized hash so demo examples are reproducible.
        region_factor = sum(ord(char) for char in region.id) % 97 / 97
        while current <= end_m:
            year_offset = current.year - 2001
            seasonal = sin(tau * (current.month - 1) / 12)
            noise = sin((current.year * 12 + current.month) * 1.37 + region_factor) * 0.17
            if variable.id == "temperature":
                value = 18.0 + 0.025 * year_offset + 7.5 * seasonal + noise
            elif variable.id == "precipitation":
                # Synthetic precipitation is a monthly total in mm.
                days = monthrange(current.year, current.month)[1]
                daily_rate = max(0.0, 2.2 + 0.25 * year_offset / 10 + 1.4 * seasonal + noise)
                value = daily_rate * days
            elif variable.id == "soil_moisture":
                value = max(0.05, min(0.95, 0.45 - 0.003 * year_offset - 0.15 * seasonal + noise * 0.1))
            elif variable.id == "relative_humidity":
                value = max(10.0, min(95.0, 55.0 - 0.05 * year_offset - 12.0 * seasonal + noise * 3.0))
            elif variable.id == "solar_radiation":
                value = max(1.0, 4.8 + 0.008 * year_offset + 1.8 * seasonal + noise * 0.2)
            elif variable.id == "surface_pressure":
                value = 98.5 + 0.001 * year_offset + 0.4 * seasonal + noise * 0.05
            elif variable.id == "wind_speed":
                value = max(0.5, 3.2 + 0.005 * year_offset + 0.8 * seasonal + noise * 0.15)
            else:
                raise ValueError(f"Demo provider does not support {variable.id}")

            output.append(
                Observation(date=current, value=round(value, 4))
            )
            current = (
                date(current.year + 1, 1, 1)
                if current.month == 12
                else date(current.year, current.month + 1, 1)
            )
        return output

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
        current = date(start_date.year, start_date.month, 1)
        final = date(end_date.year, end_date.month, 1)
        # Avoid Python's process-randomized hash so demo examples are reproducible.
        region_factor = sum(ord(char) for char in region.id) % 97 / 97
        while current <= final:
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
            else:
                raise ValueError(f"Demo provider does not support {variable.id}")

            if start_date <= current <= end_date:
                output.append(
                    Observation(date=current, value=round(value, 4))
                )
            current = (
                date(current.year + 1, 1, 1)
                if current.month == 12
                else date(current.year, current.month + 1, 1)
            )
        return output

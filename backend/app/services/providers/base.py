"""Provider contract: implementations return normalized monthly observations."""

from datetime import date
from typing import Protocol

from app.catalog import Variable
from app.schemas.analysis import Observation, RegionInfo


class DataProvider(Protocol):
    id: str
    source_url: str | None

    def get_series(
        self,
        variable: Variable,
        region: RegionInfo,
        start_date: date,
        end_date: date,
    ) -> list[Observation]:
        """Fetch one variable for a region and inclusive date range."""

"""Proveedor temporal basado en el dataset demo."""

from pathlib import Path

from app.services.data_loader import DEMO_VARIABLES
from app.services.providers.base import CsvDataProvider


class DemoProvider(CsvDataProvider):
    """Sirve datos sintéticos hasta elegir una fuente científica real."""

    def __init__(self, data_file: Path, precipitation_file: Path) -> None:
        super().__init__(
            variables=DEMO_VARIABLES,
            files_by_variable={
                "temperature": data_file,
                "precipitation": precipitation_file,
            },
        )

"""Lectura de fuentes de datos.

Este módulo conoce el formato original del CSV demo. Cuando se elija una
fuente NASA real, se puede añadir otro proveedor sin cambiar los modelos de la
API.
"""

import csv
from pathlib import Path
from typing import TypedDict


class RawRow(TypedDict):
    """Fila tal como se recibe antes de la normalización."""

    date: str
    value: str


DEMO_VARIABLES = [
    {
        "id": "temperature",
        "name": "Temperatura del aire",
        "unit": "degC",
        "description": "Temperatura media mensual de demostración.",
        "source": "demo",
        "product_id": None,
        "aggregation": "mean",
    },
    {
        "id": "precipitation",
        "name": "Precipitación",
        "unit": "mm",
        "description": "Precipitación mensual acumulada de demostración.",
        "source": "demo",
        "product_id": None,
        "aggregation": "sum",
    }
]


def load_demo_series(file_path: Path) -> list[RawRow]:
    """Lee el CSV demo y comprueba que tenga las columnas esperadas."""

    with file_path.open("r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)

        expected_columns = {"date", "value"}
        if not expected_columns.issubset(reader.fieldnames or set()):
            raise ValueError("CSV must contain date and value columns")

        rows: list[RawRow] = []
        for row in reader:
            rows.append(
                {
                    "date": row["date"],
                    "value": row["value"],
                }
            )

    return rows

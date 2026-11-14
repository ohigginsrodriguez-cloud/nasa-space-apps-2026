"""Conversión y limpieza mínima de observaciones temporales."""

from datetime import date
import math
from typing import Iterable

from app.schemas.series import Observation


def normalize_rows(rows: Iterable[dict[str, str]]) -> list[Observation]:
    """Convierte fechas y valores a tipos seguros para la API.

    Los valores vacíos se convierten en None. Esto permite que el frontend
    distinga entre cero y un dato que realmente no está disponible.
    """

    normalized: list[Observation] = []
    seen_dates: set[date] = set()

    for row in rows:
        observation_date = date.fromisoformat(row["date"])
        if observation_date in seen_dates:
            raise ValueError(f"Duplicate date: {observation_date}")
        seen_dates.add(observation_date)

        raw_value = row["value"].strip()
        if raw_value == "":
            numeric_value = None
        else:
            try:
                numeric_value = float(raw_value)
            except ValueError as error:
                raise ValueError(
                    f"Value is not numeric for date {observation_date}"
                ) from error

            # NaN e infinito son floats válidos para Python, pero no son
            # observaciones válidas para una serie científica o JSON.
            if not math.isfinite(numeric_value):
                numeric_value = None

        normalized.append(
            Observation(date=observation_date, value=numeric_value)
        )

    # Ordenar aquí garantiza que cualquier proveedor entregue la misma salida.
    return sorted(normalized, key=lambda observation: observation.date)


def filter_series_by_date(
    series: list[Observation],
    start: date | None,
    end: date | None,
) -> list[Observation]:
    """Filtra el intervalo solicitado, incluyendo ambos extremos."""

    return [
        observation
        for observation in series
        if (start is None or observation.date >= start)
        and (end is None or observation.date <= end)
    ]

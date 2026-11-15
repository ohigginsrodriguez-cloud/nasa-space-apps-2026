"""NASA POWER monthly point/regional API provider with local caching and retries."""

from __future__ import annotations

from calendar import monthrange
from datetime import date
import hashlib
import json
import logging
from math import cos, radians
from pathlib import Path
import time

import httpx

from app.catalog import Variable
from app.schemas.analysis import Observation, RegionInfo

logger = logging.getLogger(__name__)

NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/monthly"
NASA_POWER_DOCS_URL = "https://power.larc.nasa.gov/docs/services/api/temporal/monthly"
CACHE_DIR = Path("data/cache")


class NasaPowerProvider:
    """Fetch supported meteorological variables from NASA POWER with disk cache."""

    id = "nasa-power"
    source_url = NASA_POWER_DOCS_URL

    def __init__(self, timeout_seconds: float = 30.0, max_retries: int = 2) -> None:
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def _cache_key(self, route: str, params: dict) -> str:
        serialized = json.dumps({"route": route, "params": params}, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def _read_cache(self, cache_key: str) -> dict | None:
        cache_file = CACHE_DIR / f"{cache_key}.json"
        if cache_file.exists():
            try:
                return json.loads(cache_file.read_text(encoding="utf-8"))
            except Exception as e:
                logger.warning("Error reading cache file %s: %s", cache_file, e)
        return None

    def _write_cache(self, cache_key: str, payload: dict) -> None:
        cache_file = CACHE_DIR / f"{cache_key}.json"
        try:
            cache_file.write_text(json.dumps(payload), encoding="utf-8")
        except Exception as e:
            logger.warning("Error writing cache file %s: %s", cache_file, e)

    def get_series(
        self,
        variable: Variable,
        region: RegionInfo,
        start_date: date,
        end_date: date,
    ) -> list[Observation]:
        if not variable.nasa_power_available or not variable.remote_parameter:
            raise ValueError(f"NASA POWER does not support {variable.id}")

        route = "point" if region.type == "point" else "regional"
        if route == "regional" and (
            region.north - region.south < 2
            or region.east - region.west < 2
        ):
            raise ValueError(
                "NASA POWER regional queries require a bounding box at least "
                "2 degrees wide and 2 degrees tall; use a point for smaller areas."
            )

        params: dict[str, str | float] = {
            "parameters": variable.remote_parameter,
            "community": "RE",
            "start": str(start_date.year),
            "end": str(end_date.year),
            "format": "JSON",
        }
        if route == "point":
            params["latitude"] = region.south
            params["longitude"] = region.west
        else:
            params.update(
                {
                    "latitude-min": region.south,
                    "latitude-max": region.north,
                    "longitude-min": region.west,
                    "longitude-max": region.east,
                }
            )

        cache_key = self._cache_key(route, params)
        payload = self._read_cache(cache_key)

        if payload is None:
            url = f"{NASA_POWER_BASE_URL}/{route}"
            last_error: Exception | None = None

            for attempt in range(self.max_retries + 1):
                try:
                    response = httpx.get(
                        url,
                        params=params,
                        timeout=self.timeout_seconds,
                        headers={"User-Agent": "Earth-System-Trend-Detective/0.1"},
                    )
                    response.raise_for_status()
                    payload = response.json()
                    self._write_cache(cache_key, payload)
                    break
                except httpx.HTTPStatusError as error:
                    if error.response.status_code == 422:
                        try:
                            messages = error.response.json().get("messages", [])
                        except ValueError:
                            messages = []
                        detail = "; ".join(messages) or "NASA POWER rejected the request"
                        raise ValueError(detail) from error
                    last_error = error
                    if attempt < self.max_retries:
                        time.sleep(1.0 * (attempt + 1))
                except (httpx.HTTPError, ValueError) as error:
                    last_error = error
                    if attempt < self.max_retries:
                        time.sleep(1.0 * (attempt + 1))

            if payload is None:
                cached_fallback = self._read_cache(cache_key)
                if cached_fallback:
                    payload = cached_fallback
                else:
                    raise RuntimeError(
                        f"No se pudo conectar con la API de NASA POWER tras {self.max_retries + 1} intentos. "
                        "Verifica tu conexión a internet o utiliza el modo demo sintético."
                    ) from last_error

        features = payload.get("features")
        if route == "regional":
            parameter_maps = [
                (
                    feature.get("properties", {}).get("parameter", {}).get(
                        variable.remote_parameter, {}
                    ),
                    feature.get("geometry", {}).get("coordinates", [0, 0]),
                )
                for feature in features or []
            ]
        else:
            parameter_maps = [
                (
                    payload.get("properties", {})
                    .get("parameter", {})
                    .get(variable.remote_parameter, {}),
                    [],
                )
            ]
        if not parameter_maps or any(not isinstance(values, dict) for values, _ in parameter_maps):
            raise RuntimeError(
                f"NASA POWER response did not include {variable.remote_parameter}"
            )

        monthly_values: dict[str, list[tuple[float, float]]] = {}
        for values, coordinates in parameter_maps:
            latitude = float(coordinates[1]) if len(coordinates) > 1 else 0.0
            weight = max(cos(radians(latitude)), 0.0)
            for key, raw in values.items():
                monthly_values.setdefault(key, [])
                if raw is None:
                    continue
                value = float(raw)
                if value <= -999:
                    continue
                monthly_values[key].append((value, weight))

        output: list[Observation] = []
        start_m = date(start_date.year, start_date.month, 1)
        end_m = date(end_date.year, end_date.month, 1)
        for yyyymm, weighted_values in sorted(monthly_values.items()):
            try:
                observation_date = date(int(yyyymm[:4]), int(yyyymm[4:6]), 1)
            except (ValueError, IndexError):
                continue
            if int(yyyymm[4:6]) == 13:
                continue
            if observation_date < start_m or observation_date > end_m:
                continue

            total_weight = sum(weight for _, weight in weighted_values)
            if not total_weight:
                value = None
            else:
                value = sum(number * weight for number, weight in weighted_values) / total_weight
            if value is not None and variable.id == "precipitation":
                value *= monthrange(observation_date.year, observation_date.month)[1]
            output.append(
                Observation(
                    date=observation_date,
                    value=round(value, 4) if value is not None else None,
                )
            )
        return output

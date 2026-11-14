"""NASA POWER monthly point/regional API provider."""

from calendar import monthrange
from datetime import date
from math import cos, radians

import httpx

from app.catalog import Variable
from app.schemas.analysis import Observation, RegionInfo


NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/monthly"
NASA_POWER_DOCS_URL = "https://power.larc.nasa.gov/docs/services/api/temporal/monthly"


class NasaPowerProvider:
    """Fetch supported meteorological variables from NASA POWER."""

    id = "nasa-power"
    source_url = NASA_POWER_DOCS_URL

    def __init__(self, timeout_seconds: float = 30.0) -> None:
        self.timeout_seconds = timeout_seconds

    def get_series(
        self,
        variable: Variable,
        region: RegionInfo,
        start_date: date,
        end_date: date,
    ) -> list[Observation]:
        if not variable.nasa_power_available or not variable.remote_parameter:
            raise ValueError(f"NASA POWER does not support {variable.id}")

        # POWER monthly regional requests are preferable for a selected area;
        # point requests remain available when the user selected a coordinate.
        route = "point" if region.type == "point" else "regional"
        # NASA POWER's regional service rejects rectangles narrower than 2°
        # in either dimension. Do not silently expand user-selected regions.
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

        url = f"{NASA_POWER_BASE_URL}/{route}"
        try:
            response = httpx.get(
                url,
                params=params,
                timeout=self.timeout_seconds,
                headers={"User-Agent": "Earth-System-Trend-Detective/0.1"},
            )
            response.raise_for_status()
            payload = response.json()
        except httpx.HTTPStatusError as error:
            if error.response.status_code == 422:
                try:
                    messages = error.response.json().get("messages", [])
                except ValueError:
                    messages = []
                detail = "; ".join(messages) or "NASA POWER rejected the request"
                raise ValueError(detail) from error
            raise RuntimeError("NASA POWER request failed") from error
        except (httpx.HTTPError, ValueError) as error:
            raise RuntimeError("NASA POWER request failed") from error

        # Point responses contain one parameter map. Regional responses contain
        # one map per grid-cell feature; combine cells by cosine-latitude area
        # weights to produce a defensible area mean.
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

        # Build the union of monthly timestamps, then calculate a weighted mean
        # across valid grid cells independently for every month.
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
                # POWER regional payloads may include YYYY13 for annual
                # summaries; it is not a calendar month in the time series.
                continue
            if observation_date < start_m or observation_date > end_m:
                continue

            total_weight = sum(weight for _, weight in weighted_values)
            if not total_weight:
                value = None
            else:
                value = sum(number * weight for number, weight in weighted_values) / total_weight
            if value is not None and variable.id == "precipitation":
                # POWER's PRECTOTCORR monthly values are a daily rate in mm/day;
                # convert to a monthly accumulation to match the API contract.
                value *= monthrange(observation_date.year, observation_date.month)[1]
            output.append(
                Observation(
                    date=observation_date,
                    value=round(value, 4) if value is not None else None,
                )
            )
        return output

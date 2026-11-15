"""Validated API request and response models."""

from calendar import monthrange
from datetime import date, datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class RegionRequest(BaseModel):
    """Point, bounding box, or named region supplied to an analysis."""

    type: Literal["point", "bbox", "predefined"] = "predefined"
    id: str | None = None
    name: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    south: float | None = Field(default=None, ge=-90, le=90)
    west: float | None = Field(default=None, ge=-180, le=180)
    north: float | None = Field(default=None, ge=-90, le=90)
    east: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def validate_shape(self):
        if self.type == "point":
            if self.latitude is None or self.longitude is None:
                raise ValueError("point region requires latitude and longitude")
        elif self.type == "bbox":
            coords = (self.south, self.west, self.north, self.east)
            if any(value is None for value in coords):
                raise ValueError("bbox requires south, west, north, and east")
            if self.south >= self.north or self.west >= self.east:
                raise ValueError("bbox minimum coordinates must be below maximum coordinates")
        elif not self.id:
            raise ValueError("predefined region requires id")
        return self


class AnalysisRequest(BaseModel):
    """Input for a multi-variable time-series and trend analysis."""

    variable_ids: list[str] = Field(min_length=1, max_length=7)
    region: RegionRequest
    start_date: date
    end_date: date
    provider: Literal["demo", "nasa-power"] = "demo"

    @model_validator(mode="after")
    def validate_period_and_variables(self):
        if self.start_date > self.end_date:
            raise ValueError("start_date must be before or equal to end_date")
        today = datetime.now(timezone.utc).date()
        last_month = date(today.year, today.month, 1)
        if last_month.month == 1:
            last_month = date(last_month.year - 1, 12, 1)
        else:
            last_month = date(last_month.year, last_month.month - 1, 1)
        latest_complete_day = date(
            last_month.year,
            last_month.month,
            monthrange(last_month.year, last_month.month)[1],
        )
        if self.end_date > latest_complete_day:
            raise ValueError(
                f"end_date cannot exceed the last complete month ({latest_complete_day.isoformat()})"
            )
        if len(set(self.variable_ids)) != len(self.variable_ids):
            raise ValueError("variable_ids must not contain duplicates")
        return self


class RegionComparisonRequest(BaseModel):
    variable_id: str
    regions: list[RegionRequest] = Field(min_length=2, max_length=2)
    start_date: date
    end_date: date
    provider: Literal["demo", "nasa-power"] = "nasa-power"

    @model_validator(mode="after")
    def validate_period(self):
        if self.start_date > self.end_date:
            raise ValueError("start_date must be before or equal to end_date")
        first, second = self.regions
        coordinates = ("type", "id", "latitude", "longitude", "south", "west", "north", "east")
        if all(getattr(first, key) == getattr(second, key) for key in coordinates):
            raise ValueError("regions must represent two different locations")
        # Reuse the analysis validation so both endpoints enforce the same limit.
        AnalysisRequest(
            variable_ids=[self.variable_id],
            region=self.regions[0],
            start_date=self.start_date,
            end_date=self.end_date,
            provider=self.provider,
        )
        return self


class VariableInfo(BaseModel):
    id: str
    name: str
    description: str
    unit: str
    aggregation: str
    category: str = "Atmosphere"
    product: str | None
    status: str
    available: bool
    providers: list[str]


class RegionInfo(BaseModel):
    id: str
    name: str
    type: str
    south: float
    west: float
    north: float
    east: float


class Observation(BaseModel):
    date: date
    value: float | None


class TrendResult(BaseModel):
    method: str
    direction: str
    status: str = "ok"
    slope_per_year: float | None = None
    change_per_decade: float | None = None
    p_value: float | None = None
    confidence_interval_per_decade: list[float] | None = None
    significant: bool | None = None
    n_observations: int
    message: str
    warnings: list[str] = Field(default_factory=list)
    ols: dict | None = None
    mann_kendall: dict | None = None
    seasonal_mann_kendall: dict | None = None
    sen: dict | None = None
    trend_line: list[dict] = Field(default_factory=list)
    trend_band: list[dict] = Field(default_factory=list)
    alpha: float = 0.05
    data_source: str = "nasa_power"
    analysis_method: str = "annual_values"


class VariableSeries(BaseModel):
    variable: VariableInfo
    series: list[Observation]
    trend: TrendResult
    interpretation: dict | None = None


class AnalysisResponse(BaseModel):
    provider: str
    source_url: str | None
    region: RegionInfo
    period: dict[str, date | str]
    results: list[VariableSeries]
    multivariate_interpretation: dict | None = None


class RegionComparisonResponse(BaseModel):
    provider: str
    source_url: str | None
    period: dict[str, date | str]
    variable: VariableInfo
    regions: list[dict]
    spatial_interpretation: dict

"""Modelos de entrada y salida que forman el contrato de la API."""

from datetime import date

from pydantic import BaseModel, Field


class VariableInfo(BaseModel):
    """Describe una variable de ciencias de la Tierra."""

    id: str
    name: str
    unit: str
    description: str


class RegionInfo(BaseModel):
    """Representa la región usada para obtener la serie."""

    name: str
    type: str


class PeriodInfo(BaseModel):
    """Describe el intervalo y la frecuencia de los datos."""

    start: date
    end: date
    frequency: str = "monthly"


class SourceInfo(BaseModel):
    """Identifica de dónde provienen los datos."""

    provider: str
    dataset: str


class Observation(BaseModel):
    """Una observación temporal; value puede ser null si falta el dato."""

    date: date
    value: float | None = Field(default=None)


class SeriesResponse(BaseModel):
    """Respuesta común para cualquier proveedor de datos futuro."""

    variable: VariableInfo
    region: RegionInfo
    period: PeriodInfo
    source: SourceInfo
    series: list[Observation]

"""Single source of truth for application variable IDs and provider metadata."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Variable:
    id: str
    name: str
    description: str
    unit: str
    aggregation: str
    product: str | None
    remote_parameter: str | None
    demo_available: bool = False
    nasa_power_available: bool = False
    status: str = "pending"


# Provider-specific identifiers and aggregation rules live here so adding a
# variable does not require changes to the API routes or response schema.
VARIABLES: dict[str, Variable] = {
    "temperature": Variable(
        id="temperature",
        name="Temperatura del aire",
        description="Temperatura media mensual del aire a 2 metros.",
        unit="°C",
        aggregation="mean",
        product="NASA POWER meteorology, T2M",
        remote_parameter="T2M",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "precipitation": Variable(
        id="precipitation",
        name="Precipitación",
        description="Precipitación mensual acumulada.",
        unit="mm",
        aggregation="sum",
        product="NASA POWER meteorology, PRECTOTCORR",
        remote_parameter="PRECTOTCORR",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "soil_moisture": Variable(
        id="soil_moisture",
        name="Humedad del suelo",
        description="Contenido de agua en la capa de suelo definida por producto.",
        unit="m³/m³",
        aggregation="mean",
        product="GLDAS candidate; exact field pending validation",
        remote_parameter=None,
        status="pending",
    ),
    "ndvi": Variable(
        id="ndvi",
        name="Índice de vegetación (NDVI)",
        description="Índice espectral relacionado con verdor y actividad vegetal.",
        unit="Adimensional",
        aggregation="mean",
        product="MODIS MOD13C2 candidate",
        remote_parameter=None,
        status="pending",
    ),
    "evapotranspiration": Variable(
        id="evapotranspiration",
        name="Evapotranspiración",
        description="Flujo de agua desde superficie y vegetación a la atmósfera.",
        unit="mm",
        aggregation="sum",
        product="GLDAS candidate; exact field pending validation",
        remote_parameter=None,
        status="pending",
    ),
}


def variable_public_dict(variable: Variable, provider: str | None = None) -> dict:
    """Serialize variable metadata and provider availability for API clients."""
    if provider == "demo":
        available = variable.demo_available
    elif provider == "nasa-power":
        available = variable.nasa_power_available
    else:
        available = variable.demo_available or variable.nasa_power_available
    return {
        "id": variable.id,
        "name": variable.name,
        "description": variable.description,
        "unit": variable.unit,
        "aggregation": variable.aggregation,
        "product": variable.product,
        "status": variable.status,
        "available": available,
        "providers": [
            provider_id
            for provider_id, supported in (
                ("demo", variable.demo_available),
                ("nasa-power", variable.nasa_power_available),
            )
            if supported
        ],
    }

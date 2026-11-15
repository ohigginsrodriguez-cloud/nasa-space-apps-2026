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
    category: str = "Atmósfera"
    demo_available: bool = False
    nasa_power_available: bool = False
    status: str = "pending"


# Provider-specific identifiers and aggregation rules live here so adding a
# variable does not require changes to the API routes or response schema.
VARIABLES: dict[str, Variable] = {
    "temperature": Variable(
        id="temperature",
        name="Air temperature",
        description="Mean air temperature at 2 meters above the surface.",
        unit="°C",
        aggregation="mean",
        category="Atmosphere",
        product="NASA POWER meteorology, T2M (MERRA-2)",
        remote_parameter="T2M",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "precipitation": Variable(
        id="precipitation",
        name="Precipitation",
        description="Corrected monthly accumulated rainfall and snowfall.",
        unit="mm",
        aggregation="sum",
        category="Hydrology",
        product="NASA POWER meteorology, PRECTOTCORR (MERRA-2)",
        remote_parameter="PRECTOTCORR",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "soil_moisture": Variable(
        id="soil_moisture",
        name="Root-zone soil moisture",
        description="Relative moisture in the root zone (0 = dry, 1 = saturated).",
        unit="fraction (0–1)",
        aggregation="mean",
        category="Land surface",
        product="NASA POWER land assimilation, GWETROOT (MERRA-2)",
        remote_parameter="GWETROOT",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "relative_humidity": Variable(
        id="relative_humidity",
        name="Relative humidity",
        description="Percentage of water vapor in air relative to saturation at 2 m.",
        unit="%",
        aggregation="mean",
        category="Atmosphere",
        product="NASA POWER meteorology, RH2M (MERRA-2)",
        remote_parameter="RH2M",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "solar_radiation": Variable(
        id="solar_radiation",
        name="Surface solar radiation",
        description="Incident solar radiation flux at the surface under all-sky conditions.",
        unit="kW·h/m²/día",
        aggregation="mean",
        category="Energy",
        product="NASA POWER solar, ALLSKY_SFC_SW_DWN (CERES/SRB sources)",
        remote_parameter="ALLSKY_SFC_SW_DWN",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "surface_pressure": Variable(
        id="surface_pressure",
        name="Surface pressure",
        description="Atmospheric pressure exerted by the air mass over the local surface.",
        unit="kPa",
        aggregation="mean",
        category="Atmosphere",
        product="NASA POWER meteorology, PS (MERRA-2)",
        remote_parameter="PS",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "wind_speed": Variable(
        id="wind_speed",
        name="Wind speed",
        description="Mean wind speed at 10 meters above the ground.",
        unit="m/s",
        aggregation="mean",
        category="Atmosphere",
        product="NASA POWER meteorology, WS10M (MERRA-2)",
        remote_parameter="WS10M",
        demo_available=True,
        nasa_power_available=True,
        status="available",
    ),
    "ndvi": Variable(
        id="ndvi",
        name="Índice de vegetación (NDVI)",
        description="Densidad y verdor de la cubierta vegetal terrestre calculada por reflectancia espectral.",
        unit="Adimensional (-1 a 1)",
        aggregation="mean",
        category="Superficie terrestre",
        product="MODIS Terra/Aqua MOD13C2 (Earthdata Login requerido)",
        remote_parameter=None,
        demo_available=False,
        nasa_power_available=False,
        status="roadmap",
    ),
    "evapotranspiration": Variable(
        id="evapotranspiration",
        name="Evapotranspiración",
        description="Pérdida combinada de agua por evaporación del suelo y transpiración vegetal.",
        unit="mm",
        aggregation="sum",
        category="Hidrología",
        product="GLDAS Catchment Land Surface Model (Earthdata Login requerido)",
        remote_parameter=None,
        demo_available=False,
        nasa_power_available=False,
        status="roadmap",
    ),
    "swot_water": Variable(
        id="swot_water",
        name="Elevación de agua superficial (SWOT)",
        description="Variación en la altura y extensión de ríos, lagos y reservorios monitoreados por radar interferométrico.",
        unit="m",
        aggregation="mean",
        category="Océanos e Hidrología",
        product="Misión SWOT NASA/CNES/CSA (Earthdata Login requerido)",
        remote_parameter=None,
        demo_available=False,
        nasa_power_available=False,
        status="roadmap",
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
        "category": variable.category,
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

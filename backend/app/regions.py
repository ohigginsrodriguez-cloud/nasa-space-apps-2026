"""Curated reproducible example regions used by both API providers."""

from app.schemas.analysis import RegionInfo, RegionRequest


PREDEFINED_REGIONS: dict[str, RegionInfo] = {
    "sonoran-desert": RegionInfo(
        id="sonoran-desert",
        name="Desierto de Sonora · Phoenix, Arizona",
        type="predefined",
        south=32.5,
        west=-113.5,
        north=34.5,
        east=-111.0,
    ),
    "amazon-basin": RegionInfo(
        id="amazon-basin",
        name="Cuenca del Amazonas · zona demostrativa",
        type="predefined",
        south=-5.0,
        west=-65.0,
        north=-2.0,
        east=-60.0,
    ),
    "chesapeake-estuary": RegionInfo(
        id="chesapeake-estuary",
        name="Estuario de Chesapeake",
        type="predefined",
        south=37.5,
        west=-77.0,
        north=39.5,
        east=-75.0,
    ),
    "new-york-city": RegionInfo(
        id="new-york-city",
        name="Área metropolitana de Nueva York",
        type="predefined",
        # POWER Regional requires >=2° on each axis. This is an approximate
        # surrounding region for the API, not an exact metropolitan boundary.
        south=39.0,
        west=-75.5,
        north=41.1,
        east=-73.0,
    ),
}


def resolve_region(request: RegionRequest) -> RegionInfo:
    """Convert user region input to a validated bounding box for providers."""
    if request.type == "predefined":
        region = PREDEFINED_REGIONS.get(request.id or "")
        if region is None:
            raise ValueError(f"Unknown predefined region: {request.id}")
        return region

    if request.type == "point":
        lat = request.latitude
        lon = request.longitude
        return RegionInfo(
            id="custom-point",
            name=request.name or f"{lat:.4f}, {lon:.4f}",
            type="point",
            south=lat,
            west=lon,
            north=lat,
            east=lon,
        )

    return RegionInfo(
        id="custom-bbox",
        name=request.name or "Área personalizada",
        type="bbox",
        south=request.south,
        west=request.west,
        north=request.north,
        east=request.east,
    )

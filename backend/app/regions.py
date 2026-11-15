"""Curated reproducible example regions used by both API providers."""

from app.schemas.analysis import RegionInfo, RegionRequest


PREDEFINED_REGIONS: dict[str, RegionInfo] = {
    "sonoran-desert": RegionInfo(
        id="sonoran-desert",
        name="Sonoran Desert · Mexico",
        type="predefined",
        south=28.0,
        west=-112.0,
        north=30.0,
        east=-110.0,
    ),
    "lacandon-jungle": RegionInfo(
        id="lacandon-jungle",
        name="Lacandon Jungle · Chiapas",
        type="point",
        south=16.8,
        west=-91.3,
        north=16.8,
        east=-91.3,
    ),
    "tabasco-wetlands": RegionInfo(
        id="tabasco-wetlands",
        name="Centla Wetlands · Tabasco",
        type="point",
        south=18.4,
        west=-92.6,
        north=18.4,
        east=-92.6,
    ),
    "valley-of-mexico": RegionInfo(
        id="valley-of-mexico",
        name="Mexico City Valley and surroundings",
        type="predefined",
        # POWER Regional requires >=2° on each axis. This is an approximate
        # surrounding region for the API, not an exact metropolitan boundary.
        south=18.5,
        west=-100.2,
        north=20.5,
        east=-98.2,
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
        name=request.name or "Custom area",
        type="bbox",
        south=request.south,
        west=request.west,
        north=request.north,
        east=request.east,
    )

"""HTTP API: validate requests, orchestrate providers, and format responses."""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.catalog import VARIABLES, variable_public_dict
from app.regions import PREDEFINED_REGIONS, resolve_region
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    RegionInfo,
    VariableInfo,
    VariableSeries,
)
from app.services.aggregation import analyze_trend
from app.services.providers.registry import get_provider

app = FastAPI(
    title="Earth System Trend Detective API",
    description=(
        "Versioned API for environmental time series. NASA POWER provides "
        "monthly point and bounding-box data; the demo provider is synthetic."
    ),
    version="1.0.0",
)

# Local frontend origins only. Add the deployed site explicitly before release.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    """Simple liveness endpoint for local development and deployment checks."""
    return {"status": "ok"}


@app.get("/api/v1/variables", response_model=list[VariableInfo])
def list_variables(
    provider: str | None = Query(
        default=None,
        description="Optional provider filter: demo or nasa-power.",
    ),
) -> list[VariableInfo]:
    """Return the single application catalog with per-provider availability."""
    if provider not in (None, "demo", "nasa-power"):
        raise HTTPException(status_code=400, detail="Unknown provider")
    return [
        VariableInfo(**variable_public_dict(variable, provider))
        for variable in VARIABLES.values()
    ]


@app.get("/api/v1/regions", response_model=list[RegionInfo])
def list_regions() -> list[RegionInfo]:
    """Return reproducible predefined bounding-box regions."""
    return list(PREDEFINED_REGIONS.values())


@app.post("/api/v1/analysis", response_model=AnalysisResponse)
def create_analysis(request: AnalysisRequest) -> AnalysisResponse:
    """Fetch multiple variables and analyze their monthly time series."""
    unknown_ids = [item for item in request.variable_ids if item not in VARIABLES]
    if unknown_ids:
        raise HTTPException(
            status_code=422,
            detail={"message": "Unknown variable ID(s)", "ids": unknown_ids},
        )

    variables = [VARIABLES[item] for item in request.variable_ids]
    unavailable = [
        item.id
        for item in variables
        if not getattr(item, f"{request.provider.replace('-', '_')}_available")
    ]
    if unavailable:
        raise HTTPException(
            status_code=422,
            detail={
                "message": f"Variables unavailable from {request.provider}",
                "ids": unavailable,
            },
        )

    try:
        region = resolve_region(request.region)
        provider = get_provider(request.provider)
        results: list[VariableSeries] = []
        for variable in variables:
            series = provider.get_series(
                variable,
                region,
                request.start_date,
                request.end_date,
            )
            if not series:
                raise HTTPException(
                    status_code=404,
                    detail=f"No data for variable {variable.id} in the requested period",
                )
            results.append(
                VariableSeries(
                    variable=VariableInfo(
                        **variable_public_dict(variable, request.provider)
                    ),
                    series=series,
                    trend=analyze_trend(series, variable, data_source=request.provider),
                )
            )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return AnalysisResponse(
        provider=provider.id,
        source_url=provider.source_url,
        region=region,
        period={
            "start": request.start_date,
            "end": request.end_date,
            "frequency": "monthly",
        },
        results=results,
    )

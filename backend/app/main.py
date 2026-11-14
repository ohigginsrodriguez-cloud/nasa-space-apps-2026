"""Punto de entrada de la API del proyecto."""

from datetime import date
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.series import SeriesResponse, VariableInfo
from app.services.providers.demo_provider import DemoProvider
from app.services.normalizer import filter_series_by_date, normalize_rows


# La ruta se calcula a partir de este archivo para que la API funcione
# independientemente del directorio desde el que se ejecute Uvicorn.
# `parents[1]` corresponde a la carpeta `backend/`, donde está `data/`.
DEMO_FILE = Path(__file__).resolve().parents[1] / "data" / "demo-series.csv"

app = FastAPI(
    title="Earth System Trend Detective API",
    description="API inicial para consultar series temporales de demostración.",
    version="0.1.0",
)

# Durante el desarrollo, el frontend y el backend se ejecutan en puertos
# distintos. Esta configuración permite las peticiones desde Vite.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# El endpoint trabaja contra una abstracción de proveedor, no directamente
# contra un archivo. Más adelante se podrá reemplazar por NASA POWER, Giovanni,
# AppEEARS u otra fuente.
DATA_PROVIDER = DemoProvider(DEMO_FILE)


@app.get("/health")
def health_check() -> dict[str, str]:
    """Permite comprobar rápidamente si la API está funcionando."""

    return {"status": "ok"}


@app.get("/variables", response_model=list[VariableInfo])
def list_variables() -> list[VariableInfo]:
    """Devuelve las variables que el backend conoce actualmente."""

    return [
        VariableInfo(**variable)
        for variable in DATA_PROVIDER.available_variables()
    ]


@app.get("/series", response_model=SeriesResponse)
def get_series(
    variable: str = Query(
        default="surface_temperature",
        description="Identificador interno de la variable.",
    ),
    start: date | None = Query(
        default=None,
        description="Fecha inicial inclusiva en formato YYYY-MM-DD.",
    ),
    end: date | None = Query(
        default=None,
        description="Fecha final inclusiva en formato YYYY-MM-DD.",
    ),
    region: str = Query(
        default="Demo region",
        description="Nombre de la región de demostración.",
    ),
) -> SeriesResponse:
    """Devuelve una serie temporal normalizada desde el CSV demo."""

    # Validamos primero la variable para devolver un error claro al cliente.
    variable_info = next(
        (
            item
            for item in DATA_PROVIDER.available_variables()
            if item["id"] == variable
        ),
        None,
    )
    if variable_info is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown variable: {variable}",
        )

    if start is not None and end is not None and start > end:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before or equal to end date",
        )

    try:
        # El proveedor se ocupa de conocer el formato de su fuente.
        raw_rows = DATA_PROVIDER.get_series(variable)

        # El normalizador convierte los datos a la estructura común de la API.
        normalized_rows = normalize_rows(raw_rows)
        filtered_rows = filter_series_by_date(normalized_rows, start, end)
    except (OSError, ValueError) as error:
        # No exponemos detalles internos del sistema al consumidor de la API.
        raise HTTPException(
            status_code=500,
            detail="Could not load or normalize the demo dataset",
        ) from error

    if not filtered_rows:
        raise HTTPException(
            status_code=404,
            detail="No data available for the selected period",
        )

    return SeriesResponse(
        variable=VariableInfo(**variable_info),
        region={
            "name": region,
            "type": "demo",
        },
        period={
            "start": filtered_rows[0].date,
            "end": filtered_rows[-1].date,
            "frequency": "monthly",
        },
        source={
            "provider": "demo",
            "dataset": "demo-series",
        },
        series=filtered_rows,
    )

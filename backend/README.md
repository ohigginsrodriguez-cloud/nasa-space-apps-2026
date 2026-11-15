# Backend API

API versionada para consultar el catálogo, regiones, series mensuales y
resultados estadísticos. Tiene dos proveedores:

- `demo`: genera series sintéticas reproducibles para desarrollar el frontend.
- `nasa-power`: consulta la API mensual oficial de NASA POWER para las siete
  variables activas descritas en `docs/variable-catalog.md`.

Los resultados `demo` nunca deben describirse como observaciones NASA.

## Fuente recomendada para el MVP

NASA POWER offers a monthly REST API and regional bounding-box queries; the MVP
does not need to process large scientific files directly.

La API devuelve `PRECTOTCORR` en mm/day. Este backend convierte cada promedio
mensual de tasa diaria a acumulado mensual multiplicando por los días del mes.
La conversión queda centralizada en el proveedor. Verificar metadata de unidad
del producto antes de presentar una versión final.

NDVI, evapotranspiración y SWOT no están integradas. Se evalúan como roadmap
mediante productos MODIS, GLDAS y SWOT concretos; Giovanni sirve para explorar
y validar series, pero no se automatiza su sitio web.
Detalles: [`docs/data-source-strategy.md`](../docs/data-source-strategy.md).

## Instalación y ejecución

Desde la raíz:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --app-dir backend
```

En Windows, activar con `.venv\Scripts\activate`.

- Swagger: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/health>

La consulta real requiere conexión a Internet, pero no credenciales NASA.
Para un frontend desplegado en Netlify, define `FRONTEND_ORIGINS` en el
servicio de la API con la URL del sitio Netlify. Se aceptan varios orígenes
separados por comas.

## Endpoints

### Variables y disponibilidad por proveedor

```http
GET /api/v1/variables
GET /api/v1/variables?provider=nasa-power
```

### Regiones predefinidas

```http
GET /api/v1/regions
```

### Análisis de una o más variables

```http
POST /api/v1/analysis
Content-Type: application/json
```

Ejemplo:

```json
{
  "variable_ids": ["temperature", "precipitation"],
  "region": {"type": "predefined", "id": "sonoran-desert"},
  "start_date": "2001-01-01",
  "end_date": "2020-12-31",
  "provider": "nasa-power"
}
```

`region.type` acepta `predefined` o `bbox` in the current user-facing MVP. The
body includes `results[]`; each element contains variable metadata, the series,
trend statistics, and an evidence verdict. The response also includes the
exploratory multivariable diagnostic.

### Comparación espacial

`POST /api/v1/analysis/compare` compara una variable en dos regiones y devuelve
`spatial_interpretation`.

Cambiar `"provider": "demo"` para desarrollo sin realizar solicitudes externas.

## Pruebas

Desde la raíz del repositorio:

```bash
python -m pytest -q
```

Las pruebas de NASA POWER usan respuestas simuladas y no dependen de red.

## Organización

- `app/catalog.py`: IDs, unidades, proveedores y metadatos de variables.
- `app/regions.py`: regiones predefinidas y normalización espacial.
- `app/schemas/analysis.py`: contrato validado de entrada/salida.
- `app/services/providers/`: proveedores de datos intercambiables.
- `app/services/aggregation.py`: agregación anual y análisis de tendencias.
- `app/services/interpretation.py`: veredictos y patrones exploratorios en JSON.
- `app/main.py`: rutas y orquestación HTTP.

Para añadir una variable: añadir metadata al catálogo, implementar soporte en
el proveedor apropiado, agregar pruebas y solo entonces habilitarla.

# Backend API

API versionada para consultar el catálogo, regiones, series mensuales y
resultados estadísticos. Tiene dos proveedores:

- `demo`: genera series sintéticas reproducibles para desarrollar el frontend.
- `nasa-power`: consulta la API mensual oficial de NASA POWER para temperatura
  a 2 m (`T2M`) y precipitación corregida (`PRECTOTCORR`).

Los resultados `demo` nunca deben describirse como observaciones NASA.

## Fuente recomendada para el MVP

NASA POWER es la mejor integración inicial para `temperature` y
`precipitation`: tiene una API REST mensual, consultas por punto y bounding box,
no requiere que el equipo procese directamente archivos científicos grandes y
ambas variables se consultan con el mismo servicio.

La API devuelve `PRECTOTCORR` en mm/day. Este backend convierte cada promedio
mensual de tasa diaria a acumulado mensual multiplicando por los días del mes.
La conversión queda centralizada en el proveedor. Verificar metadata de unidad
del producto antes de presentar una versión final.

POWER no ofrece NDVI ni humedad del suelo como sustitutos directos adecuados.
Para esas variables se recomienda evaluar AppEEARS con productos MODIS/GLDAS,
o Giovanni para explorar y descargar series de referencia. No se automatiza el
sitio web de Giovanni ni se presentan estas variables como integradas.
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
  "region": {"type": "predefined", "id": "amazon-basin"},
  "start_date": "2001-01-01",
  "end_date": "2020-12-31",
  "provider": "nasa-power"
}
```

`region.type` acepta `predefined`, `bbox` o `point`. El cuerpo incluye
`results[]`; cada elemento contiene metadata de variable, serie y tendencia.

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
- `app/main.py`: rutas y orquestación HTTP.

Para añadir una variable: añadir metadata al catálogo, implementar soporte en
el proveedor apropiado, agregar pruebas y solo entonces habilitarla.

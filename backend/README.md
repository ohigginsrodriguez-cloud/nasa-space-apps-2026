# Backend

API inicial para consultar series temporales mensuales. Actualmente utiliza un
CSV local de demostración; todavía no representa una fuente NASA en vivo.

La región recibida por `/series` es informativa en esta etapa: todos los
usuarios reciben el mismo dataset demo. No debe interpretarse como un promedio
real de una región geográfica.

## Instalación

Desde la carpeta `backend/`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

En Windows, la activación equivalente es:

```powershell
.venv\Scripts\activate
```

## Ejecutar la API

Desde `backend/`:

```bash
uvicorn app.main:app --reload
```

La documentación interactiva estará disponible en:

```text
http://127.0.0.1:8000/docs
```

## Ejecutar pruebas

Desde la raíz del repositorio:

```bash
PYTHONPATH=backend python -m pytest tests/test_backend.py -q
```

## Endpoints iniciales

### Comprobar el estado

```text
GET /health
```

### Consultar variables

```text
GET /variables
```

### Consultar una serie

```text
GET /series
GET /series?start=2020-01-01&end=2020-12-31
```

Las fechas son inclusivas y usan el formato `YYYY-MM-DD`.

## Estructura

- `app/main.py`: crea la API y define los endpoints.
- `app/schemas/series.py`: contrato JSON de la API.
- `app/services/data_loader.py`: lectura del formato CSV demo.
- `app/services/normalizer.py`: conversión, ordenamiento y filtrado.
- `app/services/providers/`: abstracción y proveedores de fuentes de datos.
- `data/demo-series.csv`: datos locales temporales para desarrollo.

El proveedor demo está separado de la API para que más adelante se pueda añadir
un proveedor NASA sin cambiar el formato que consume el frontend.

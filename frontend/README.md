# Frontend

Educational tool for investigating Earth-system trends. The main flow has two
screens: guided investigation setup and a time series with statistical
analysis.

In `/dashboard`, users choose a variable, a valid rectangle, and period.
NASA POWER retrieves real data; `local-demo` is explicitly labeled synthetic
data for offline development. `/trends` displays the returned series and
analysis. Loading and error states are visible, and loaded data is reused
instead of requesting the same series twice.

## Datos y limitaciones

El frontend consume `POST /api/v1/analysis` mediante `src/services/api.ts`.
El backend es la única fuente del cálculo estadístico. `local-demo` genera
datos sintéticos; NASA POWER entrega las siete variables activas descritas en
el catálogo del proyecto.

El backend aplica regresión lineal y una prueba t bilateral de la pendiente
sobre agregados anuales completos, con tasa por año y década, p-value e
intervalo de confianza del 95 %. Mann–Kendall, Seasonal MK y Theil–Sen son
métodos complementarios. No corrige autocorrelación ni cambios de producto o
sensor y no permite inferir causalidad. NDVI, evapotranspiración y SWOT siguen
pendientes.

The map uses OpenStreetMap tiles and requires an Internet connection. The
rectangle remains defined by the application if tiles are unavailable.

## Desarrollo

Desde esta carpeta:

- `npm run dev`: inicia el servidor local.
- `npm run typecheck`: valida los tipos TypeScript.
- `npm run build`: crea la versión de producción.

Configure `VITE_API_URL` in `.env.local` if the backend is not at
`http://localhost:8000`. El backend permite por defecto los orígenes locales
`http://localhost:5173` and `http://127.0.0.1:5173`.

For Netlify, set `VITE_API_URL` to the deployed FastAPI URL. The repository
root contains the Netlify build configuration.

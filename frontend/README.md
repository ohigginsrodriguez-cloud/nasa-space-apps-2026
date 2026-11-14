# Frontend

Prototipo educativo para investigar tendencias en variables de ciencias de la
Tierra. El flujo principal tiene dos pantallas: configuración guiada de la
investigación y serie temporal con análisis estadístico.

En `/dashboard` se eligen variable, región y periodo paso a paso. El proveedor
se puede cambiar en el resumen final: NASA POWER obtiene datos reales y
`local-demo` permite trabajar sin red. En `/trends` se visualizan la serie y
el análisis devuelto por el backend.
Al generar una serie se indican los estados de carga y error; la gráfica
reutiliza los datos cargados para no solicitar la misma serie dos veces.
Las rutas previas de configuración redirigen a `/dashboard`; `/results`
redirige a `/trends`.

## Datos y limitaciones

El frontend consume `POST /api/v1/analysis` mediante `src/services/api.ts`.
El backend es la única fuente del cálculo estadístico. `local-demo` genera
datos sintéticos; NASA POWER obtiene temperatura y precipitación mensuales.

El backend aplica regresión lineal y una prueba t bilateral de la pendiente
sobre agregados anuales completos, con tasa por año y década, p-value e
intervalo de confianza del 95 %. No corrige autocorrelación ni cambios de
sensor y no permite inferir causalidad. Mann–Kendall y variables adicionales
siguen pendientes.

El mapa base usa teselas de OpenStreetMap y requiere conexión a internet; la
selección manual de coordenadas sigue disponible si no cargan las teselas.

## Desarrollo

Desde esta carpeta:

- `npm run dev`: inicia el servidor local.
- `npm run typecheck`: valida los tipos TypeScript.
- `npm run build`: crea la versión de producción.

Configura `VITE_API_URL` en `.env.local` si el backend no está en
`http://localhost:8000`. El backend permite por defecto los orígenes locales
`http://localhost:5173` y `http://127.0.0.1:5173`.

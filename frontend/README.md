# Frontend

Prototipo educativo para investigar tendencias en variables de ciencias de la
Tierra. El flujo principal tiene tres pantallas: configuración guiada de la
investigación, serie temporal con análisis estadístico y comparación regional.

En `/dashboard` se eligen variable, región, fuente y periodo paso a paso. En
`/trends` se visualizan la serie y su tendencia; `/comparison` permite
contrastar regiones. La configuración se conserva entre estas pantallas.
Al generar una serie se indican los estados de carga y error; la gráfica
reutiliza los datos cargados para no solicitar la misma serie dos veces.
Las rutas previas de configuración redirigen a `/dashboard`; `/results`
redirige a `/trends`.

## Datos y limitaciones

La única fuente seleccionable es una demo sintética local (2001–2025), no son
observaciones reales de NASA/NOAA. El rectángulo dibujado se conserva como
configuración, pero no se aplica a la serie de demostración. Las fuentes y
productos científicos se presentan como candidatos por validar; sus
resoluciones y coberturas no se afirman cuando aún no se han verificado.

El análisis aplica regresión lineal y una prueba t bilateral de la pendiente
sobre promedios de años completos, con tasa por año y década, p-value e
intervalo de confianza del 95 %. No corrige autocorrelación ni cambios de
sensor y no permite inferir causalidad. Mann–Kendall, consultas científicas en
vivo y análisis de geometrías personalizadas siguen pendientes.

El mapa base usa teselas de OpenStreetMap y requiere conexión a internet; la
selección manual de coordenadas sigue disponible si no cargan las teselas.

## Desarrollo

Desde esta carpeta:

- `npm run dev`: inicia el servidor local.
- `npm run typecheck`: valida los tipos TypeScript.
- `npm run build`: crea la versión de producción.

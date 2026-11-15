# Contexto y bitácora del proyecto

## Cómo retomar el trabajo

Leer primero este archivo, `README.md`, `docs/challenge-requirements.md` y
`docs/statistical-methodology.md`. Revisar `git status` antes de editar.
Actualizar esta bitácora al terminar cada cambio con archivos, decisiones,
pruebas ejecutadas y pendientes. El historial Git conserva el detalle exacto.

## Objetivo y arquitectura

NASA Space Apps 2026: **Be An Earth System Trend Detective!**
Flujo: variables → región/punto → periodo → serie temporal → tasa de cambio y
significancia. Textos de interfaz en español; código en inglés.

- Backend FastAPI: `backend/app`, entrada `main.py`.
- Catálogo: `backend/app/catalog.py`; regiones: `backend/app/regions.py`.
- Estadística: `services/aggregation.py`, `services/trend_stats.py`.
- Datos: `services/providers/nasa_power.py` y `demo_provider.py`.
- Contratos de API: `backend/app/schemas/analysis.py`.
- Frontend React/TypeScript: `frontend/src`.
- Estado: `context/ResearchContext.tsx`; HTTP: `services/api.ts`.
- Flujo principal: `pages/Dashboard.tsx`; mapa: `components/geography/MapSelector.tsx`.
- Comparación: `components/detective/RegionComparison.tsx`.
- Pruebas Python: `tests/`; frontend: `frontend/tests/`.
- Nunca presentar observaciones sintéticas como reales.

## Historial anterior, recuperado de Git

Estas son implementaciones previas, no una nueva certificación de cumplimiento
del 100%. Las afirmaciones científicas del README requieren verificación independiente.

| Commit | Fase | Cambios principales |
| --- | --- | --- |
| `ea756fa` | 1 | Normalización mensual en proveedores, series constantes/insuficientes, visibilidad del selector. |
| `5d3e5f9` | 2 | `trend_stats.py`, OLS, Mann-Kendall, Sen, Seasonal MK, anomalías, esquema ampliado y pruebas estadísticas. |
| `c0cc047` | 3 | `TimeSeriesChart.tsx`, tendencia y bandas, métricas, exportación CSV/JSON, adaptación de API y tipos. |
| `278c21d` | 4 | Catálogo de siete variables POWER, metadatos y roadmap satelital. |
| `57da8a6` | 5 | Asistente guiado, comparación de dos regiones, glosario. |
| `8f2b010` | 6 | Caché POWER, documentación, README y `scripts/verify_analysis.py`. |

Usar `git show --stat <commit>` para obtener los archivos exactos de cada fase.

## Corrección actual: límites del mapa y error 422

### Evidencia real de NASA POWER

Consultas realizadas al endpoint
`https://power.larc.nasa.gov/api/temporal/monthly/regional`
con `parameters=T2M&community=RE&start=2020&end=2020&format=JSON`,
latitud/longitud mínimas 0 y máximas iguales a:

- **1°:** respuesta: “Please provide at least a 2 degree range in latitude;
  otherwise use the point endpoint.” (también para longitud).
- **30°:** respuesta: “Please provide a maximum of 10 degree range in latitude.”
  (también para longitud).

Regla: **2° ≤ alto ≤ 10° y 2° ≤ ancho ≤ 10°**, no área en kilómetros
cuadrados. Los puntos no tienen esta restricción de tamaño. Demo conserva su
propio comportamiento, aunque sí valida coordenadas geográficas.

### Archivos modificados/creados

- `frontend/src/utils/configuration.ts`: completar validación previa inconclusa;
  mínimo, máximo, orden, valores finitos y rangos geográficos.
- `frontend/src/pages/Dashboard.tsx`: “Siguiente” y “Generar serie y analizar”
  bloqueados ante selección inválida; mensaje visible; el asistente limpia
  selecciones anteriores al aplicar su región.
- `frontend/src/components/geography/MapSelector.tsx`: comunica borradores
  incompletos/erróneos y selección pendiente; normaliza longitudes de clics en
  copias del mapa; explica límites; limpiar restaura la región predefinida.
- `frontend/src/services/api.ts`: valida geografía antes de enviar una consulta.
- `backend/app/services/providers/nasa_power.py`: rechaza también rectángulos
  mayores de 10° antes de consultar POWER.
- `frontend/tests/configuration.test.ts`: límites inclusivos, tamaños inválidos,
  coordenadas, puntos, regiones predeterminadas y demo.
- `frontend/package.json`: comando `npm test` con el runner de Node.
- `tests/test_geographic_limits.py`: rechazo sin llamadas de red y aceptación
  de límites 2°/10° con respuestas simuladas.
- `tests/test_backend.py`: aislar en directorios temporales la caché de dos
  pruebas existentes; conservar sus aserciones. Antes fallaban al reutilizar
  caché de ejecuciones anteriores.
- `README.md`: enlace a esta bitácora y comandos actualizados.

### Verificación

- `.venv/bin/pytest`: **37 passed**, una advertencia de deprecación de
  Starlette/httpx ajena al cambio.
- `npm --prefix frontend test`: **4 passed**.
- `npm --prefix frontend run build`: TypeScript + Vite correctos.
- No existe comando lint configurado.
- No se ejecutaron pruebas automatizadas de navegador. Verificación manual
  sugerida: dibujar 1×5°, 5×11° y 5×5°; comprobar bloqueo y recuperación;
  borrar una coordenada, completar otra vez, probar punto y limpiar área.
- El mensaje “Download the React DevTools” es informativo, no causa el 422.
- Otros errores 422 (fechas, parámetros, etc.) pueden existir; este cambio
  aborda la selección geográfica.

## Comparación mundial: propuesta y dificultad

Actualmente la comparación ofrece cuatro regiones predefinidas.

**Elegir dos ubicaciones en cualquier parte del mundo: dificultad moderada.**
Reutilizar `MapSelector` y `validateGeographicSelection` en cada panel, mantener
estados independientes A/B y pasar sus puntos o cajas a `runAnalysis`.
Congelar nombres/configuración junto a los resultados para no mostrar etiquetas
de una selección nueva sobre datos anteriores. La API ya acepta ambos tipos.
Añadir buscador de lugares sería una integración adicional de geocodificación.

**Comparar países completos o todas las regiones simultáneamente: dificultad alta.**
POWER regional no acepta un rectángulo mundial. Se necesitaría dividir áreas,
gestionar solicitudes/caché/concurrencia y agregar sin duplicar celdas, con
ponderación por área y máscaras de polígonos. Para gran escala conviene evaluar
archivos gridded de NASA y procesamiento por lotes. Hay que controlar también
comparaciones estadísticas múltiples si se buscan tendencias en muchas regiones.

Esta ampliación está propuesta, no implementada en esta corrección.

## Pendientes observados al retomar

- `RegionComparison.tsx` detecta signos opuestos sin exigir significancia en
  ambos; su texto causal no se demuestra únicamente por tendencias opuestas.
- Las gráficas comparativas no tienen `syncId` en el código revisado.
- No interpretar los porcentajes históricos del README como auditoría nueva.
- Cachés locales no versionadas en `data/cache/` y `backend/data/`: preservadas.
- No se volvió a ejecutar el benchmark científico en esta corrección geográfica.

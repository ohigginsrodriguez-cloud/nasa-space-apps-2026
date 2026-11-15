# Contexto y bitácora del proyecto

## Cómo retomar el trabajo

Leer primero este archivo, `README.md`, `docs/challenge-requirements.md` y
`docs/statistical-methodology.md`. Revisar `git status` antes de editar.
Actualizar esta bitácora al terminar cada cambio con archivos, decisiones,
pruebas ejecutadas y pendientes. El historial Git conserva el detalle exacto.

## Objetivo y arquitectura

### Vista múltiple y glosario

Al seleccionar dos o más variables se permite elegir paneles separados
(predeterminado) o una gráfica conjunta con ejes independientes en unidades
originales. Los resultados permiten alternar vistas, ocultar variables, acotar
meses, ajustar límites verticales por variable y ampliar la altura. El zoom
no recalcula significancia ni modifica las exportaciones.
El glosario usa un diálogo modal nativo en la capa superior del navegador,
bloquea el desplazamiento de fondo y contiene el scroll para aislar el mapa.
Verificación: 11 pruebas frontend, typecheck y build correctos.

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

Actualmente la comparación ofrece cuatro ubicaciones mexicanas predefinidas.

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

## Pendientes observados al retomar (antes de la corrección siguiente)

- `RegionComparison.tsx` detecta signos opuestos sin exigir significancia en
  ambos; su texto causal no se demuestra únicamente por tendencias opuestas.
- Las gráficas comparativas no tienen `syncId` en el código revisado.
- No interpretar los porcentajes históricos del README como auditoría nueva.
- Cachés locales no versionadas en `data/cache/` y `backend/data/`: preservadas.
- No se volvió a ejecutar el benchmark científico en esta corrección geográfica.

## Corrección posterior: error 422 y catálogo mexicano

### Causa reproducida

El servidor local respondió **422** al enviar las siete variables activas:
`variable_ids: List should have at most 5 items after validation, not 7`.
La UI permitía siete, pero `AnalysisRequest` tenía `max_length=5`.
El esquema ahora admite siete; el proveedor las consulta individualmente,
respetando el límite de un parámetro por petición regional de POWER.
No se afirma que todo 422 tenga esta causa: sigue siendo la respuesta correcta
ante solicitudes inválidas.

### Cambios y archivos

- `backend/app/schemas/analysis.py`: aceptar las siete variables activas.
- `frontend/src/utils/apiErrors.ts`, `services/api.ts`: mostrar errores
  estructurados de FastAPI legiblemente (antes terminaban como `[object Object]`);
  validar configuración antes de cualquier análisis, incluida comparación.
- `utils/configuration.ts`: máximo de siete y límite inferior POWER 1981.
- `backend/app/regions.py`, `frontend/src/data/mockData.ts`, `types/index.ts`:
  solo Sonora mexicano, Selva Lacandona, Pantanos de Centla y Valle de México.
  Lacandona/Centla son puntos representativos; Sonora/Valle son cajas de 2°×2°.
- `DetectiveWizard.tsx`: reutilizar catálogo mexicano, corregir conteo inclusivo
  de años y quitar promesa de máxima potencia estadística.
- `RegionSelector.tsx`: nombres correctos de variables sugeridas y texto México.
- `ResearchContext.tsx`, `Dashboard.tsx`: limpiar geografía personalizada al
  elegir otra región; reiniciar mapa al cambiar región; ejemplos usan sus fechas
  declaradas 1991–2023 y NASA POWER (antes cargaban demo y fechas diferentes).
- `RegionComparison.tsx`: regiones mexicanas, validación previa, sincronización
  de gráficas, ocultar resultados de configuraciones anteriores, etiqueta demo,
  exigir significancia OLS para banner y retirar afirmación causal no demostrada.
- `tests/test_mexico_regions.py`, `tests/test_backend.py`,
  `frontend/tests/apiErrors.test.ts`: regresiones del catálogo y siete variables.
- `scripts/verify_analysis.py`: usar Sonora mexicano y Lacandona; fallar realmente
  ante errores de descarga o discrepancias de MK además de OLS/Sen.
- README y `docs/region-guidelines.md`: geometrías, resultados reales y alcance.

### Comprobaciones ejecutadas

- Histórico de la primera integración: backend **42 passed** y frontend **7
  passed**; esa ejecución tenía la advertencia de deprecación Starlette/httpx.
- Servidor local `localhost:8000`: **cuatro análisis HTTP 200**, uno por cada
  región, **siete variables simultáneas**, periodo 1991–2023, 396 meses por variable.
  Datos NASA POWER reales (con la caché normal del proveedor); no respuestas simuladas.
- Benchmark Sonora temperatura / Lacandona precipitación: diferencias OLS, MK
  y Sen frente a SciPy/pymannkendall iguales a cero en la salida.
- UI servida en `localhost:5173`: HTTP 200. No se automatizó un navegador;
  las pruebas frontend comprueban validadores y contratos, no clics/renderizado.

### Operación y límites

Si se mantiene abierto un frontend antiguo, recargar la página. Si el backend
no usa `--reload`, reiniciarlo para cargar el nuevo límite y catálogo.
El aviso de React DevTools es normal en desarrollo.
Los puntos del mapa personalizados siguen disponibles; solo el catálogo de
regiones se restringió a México.
Los antiguos pendientes del banner comparativo y `syncId` quedaron corregidos.
La revisión actual no certifica ausencia de cualquier otro defecto científico
o visual ni convierte la tabla histórica en una auditoría exhaustiva.

## Auditoría y correcciones de interpretación (2026-11)

Trabajo iniciado sobre `dev` en `fdb4f4c`, sin modificar `main`, en la rama
`feature/scientific-interpretation-and-audit`.

- `pymannkendall` quedó declarado en `backend/requirements.txt`; ya no se
  requiere instalarlo manualmente aparte.
- El ajuste anual requiere 12 meses válidos; no extrapola años incompletos.
- Las variables de estado se agregan con promedio anual ponderado por días de
  cada mes; las variables acumulativas suman los 12 totales mensuales.
- El backend limita `end_date` al último mes calendario completo para análisis
  ordinarios y comparaciones.
- La API devuelve por variable un veredicto JSON con OLS, Mann-Kendall e IC;
  también devuelve procesos multivariables exploratorios. Se añadió
  `/api/v1/analysis/compare` para el JSON de divergencia espacial.
- La UI presenta estado de significancia, ambos p-values e IC debajo de cada
  gráfica individual y de cada gráfica regional. Los resultados no evaluables
  y la evidencia discordante no se muestran como “no significativos”.
- Los patrones de interconexión son hipótesis; no afirman causalidad.
- Se actualizaron catálogo, alcance y metodología para que reflejen las siete
  variables POWER, los años completos y las limitaciones vigentes.
- Cuando se seleccionan dos o más variables, la API y la UI muestran una
  interpretación conjunta aunque no exista un patrón predefinido: enumera las
  variables/unidades analizadas, resume sus veredictos y separa los patrones
  exploratorios de las conclusiones estadísticas individuales.
- Los controles de zoom comparten un componente; el arrastre con mouse usa
  actualización por frame y permite recorrer la ventana ampliada sin cambiar
  los cálculos.

Verificación ejecutada después de estos cambios: backend **51 passed**,
frontend **11 passed**, typecheck y build correctos; el benchmark NASA POWER
real valida OLS/MK/Sen frente a SciPy y pymannkendall. También se ejecutó el
E2E con Playwright y Chromium: siete paneles, zoom/arrastre, vista conjunta,
estado vacío, móvil y API real sin errores JavaScript. `httpx2` elimina la
advertencia deprecada de Starlette.
Primera fase de claridad para la submission: se añadió `ProjectGuideModal.tsx`,
accesible desde Dashboard y TrendsPage, con flujo de tres pasos, metodología,
documentación NASA POWER y disclaimer de no afiliación.
`TimeSeriesChart.tsx` ahora incluye un panel desplegable de procedencia con
fuente, región, periodo, método, productos/modelos, faltantes y documentación.
Se corrigió el overflow móvil introducido por estos controles: el encabezado y
las pestañas de `TrendsPage` se adaptan en viewport de 390 px sin ocultar
acciones.
Verificación final de esta fase: backend **51 passed**, frontend **11 passed**,
typecheck, build y E2E correctos.

Segunda fase de submission: se añadió `LanguageContext.tsx` con inglés por
defecto, selector EN/ES persistente y traducción del flujo principal, guía,
glosario, fechas, regiones y resultados clave. `docs/submission.md` contiene el
texto en inglés para la página de proyecto, uso de SI, referencias, disclaimer
y guion de demo de 30 segundos. El E2E se actualizó para validar la interfaz
inglesa; también se verificó el cambio EN/ES manualmente.

Tercera fase de presentación: la interfaz quedó únicamente en inglés, sin
selector de idioma. Se tradujeron los nombres y descripciones de variables,
ejemplos, asistente guiado, mapa, comparación regional, controles de zoom,
errores y resultados visibles. Se aumentaron tamaños de texto en tarjetas de
variables, asistente, mapa, comparación y controles de zoom; se actualizaron
los selectores E2E y sus pruebas de mensajes al inglés.
`docs/deployment.md` documenta el despliegue público y la verificación desde
navegación privada; `docs/demo-storyboard.md` prepara una alternativa de siete
diapositivas al video de 30 segundos. El despliegue real y los enlaces públicos
siguen pendientes porque requieren credenciales/servicios de hosting.

Fase de simplificación UX: se eliminó el filtro de categoría `All` y el roadmap
de misiones del selector principal para que las siete variables activas se
entiendan de un vistazo. El encabezado de Dashboard conserva únicamente
`How it works`; el propósito ahora se explica con una llamada principal y tres
resultados esperados. La selección geográfica añade tamaños rápidos de 2° × 2°
y 5° × 5°, lectura en vivo de ancho/alto y estado válido/no válido según las
restricciones de NASA POWER. También se tradujeron mensajes de carga, errores y
ejemplos restantes al inglés.

La limpieza de ramas solo debe borrar ramas ya fusionadas; se preservan las que
tienen commits exclusivos.

## Revisión del challenge y gráficas por variable

Ver `docs/challenge-review.md` para dictamen, tabla y evidencia actualizada.
Se separaron variables en paneles con ejes propios, botones mostrar/ocultar y
zoom por meses; el zoom no recalcula ni filtra exportaciones.

Archivos principales: `TimeSeriesChart.tsx`, `utils/chartData.ts`,
`RegionComparison.tsx`, `services/api.ts`, `types/index.ts`,
`aggregation.py`, `schemas/analysis.py`, metodología y README.
Pruebas nuevas: `frontend/tests/chartData.test.ts`,
`tests/test_chart_consistency.py`, `scripts/verify_chart_ui.mjs`.

Hallazgos corregidos: escala anual/mensual de lluvia, desplazamiento de medio año
de rectas, atribución incorrecta de significancia a MK, ubicación personalizada
mal titulada, etiqueta `annual_anomalies` sin uso real de anomalías, falta de
advertencia por años incompletos y explicación errónea de autocorrelación/IC.

Histórico: **44 tests backend, 10 frontend, build y benchmark** en aquella
revisión. Para la auditoría de noviembre de 2026, ver el registro actualizado
arriba; no asumir que este conteo histórico refleja la rama actual.

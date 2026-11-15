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
Flujo actual: variable → región → rectángulo válido → periodo → serie temporal
→ tasa de cambio y significancia. La interfaz visible está en inglés; el código
está en inglés.

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
La interfaz actual usa exclusivamente rectángulos regionales; los puntos
permanecen en contratos históricos del backend para compatibilidad, pero no se
ofrecen al usuario.
Los antiguos pendientes del banner comparativo y `syncId` quedaron corregidos.
La revisión actual no certifica ausencia de cualquier otro defecto científico
o visual ni convierte la tabla histórica en una auditoría exhaustiva.

## Auditoría y correcciones de interpretación (2026-11)

### Selector de mapa: conservar zoom al mover el rectángulo

- Corregido `frontend/src/components/geography/MapSelector.tsx`: `MapController`
  encuadra el rectángulo inicial una sola vez por montaje/región. Al mover o
  redimensionar el área ya no vuelve a ejecutar `fitBounds`, por lo que el zoom
  y la vista que eligió el usuario permanecen.
- Ampliado `scripts/verify_chart_ui.mjs`: acerca el mapa con los controles,
  arrastra el rectángulo y comprueba que su ancho proyectado no cambie (señal
  de que el zoom se conservó).
- Validación: la prueba Playwright completa pasó con la interacción del mapa,
  análisis real HTTP 200 y resto del flujo. Backend 51 tests y frontend 11
  tests pasaron; typecheck y build correctos.
- El backend ya estaba ejecutándose en el puerto 8000 al intentar iniciar otra
  instancia; esa instancia devolvió `Address already in use`. No afectó la
  prueba E2E, que se conectó al servicio ya disponible.

### Selector de mapa: arrastrar el rectángulo completo

- Se confirmó que el control central azul se podía arrastrar, pero la superficie
  del rectángulo no tenía manejador de movimiento. `MapSelector.tsx` ahora
  escucha `mousedown` en el rectángulo y `mousemove`/`mouseup` del mapa, conserva
  su ancho/alto y limita el movimiento a coordenadas válidas. El control azul
  permanece como alternativa.
- Se añadió cursor de movimiento e instrucciones que indican que se puede
  arrastrar tanto el rectángulo como el control central.
- La prueba E2E ahora comprueba que cambia la posición del rectángulo al
  arrastrar su superficie, que no cambia el zoom y que funciona también el
  control central.
- Verificación: **11 pruebas frontend**, typecheck y build correctos; Chromium
  completó el E2E con análisis API HTTP 200 y sin errores JS.

### Selector de mapa: no mover/resetear con hover o clic simple

- La interacción queda explícita: el usuario debe hacer clic y mantener
  presionado mientras arrastra. Hover y clic sin arrastre no modifican la
  selección; se detiene el evento de clic de Leaflet para evitar que llegue al
  mapa. El control central conserva el mismo comportamiento de arrastre.
- E2E verifica hover sin cambios, clic en el centro sin cambios y arrastre
  continuo cruzando el control central; comprueba cambio real de posición y
  que el zoom permanece.
- Comprobación final: Chromium E2E aprobado, **11 tests frontend**, typecheck y
  build aprobados.

### Selector de mapa: cambiar tamaño sin volver al centro predefinido

- Causa: `applyRectangle()` usaba siempre el centro original de la región para
  construir las nuevas dimensiones, por lo que un área previamente movida saltaba
  hacia atrás al elegir otro tamaño.
- Corrección: `MapSelector.tsx` ahora centra el nuevo rectángulo en el centro de
  la selección vigente (`draft`/`value`), cambiando solo alto y ancho. El
  `MapController` sigue preservando el zoom establecido.
- E2E comprueba arrastrar lejos de la posición inicial, elegir 4° × 4°, confirmar
  que el centro en pantalla no cambia, el tamaño sí cambia y el zoom se mantiene.
- Validación: navegador Chromium E2E aprobado; 11 pruebas frontend, typecheck y
  build aprobados.

### Selector de mapa: evitar arrastre enganchado

- Se reemplazaron los dos mecanismos independientes (superficie y control
  central) por eventos Pointer sobre el rectángulo con captura del puntero.
  Soltar fuera del mapa, cancelar, perder captura o perder foco finaliza el
  arrastre; si el mouse ya no tiene el botón presionado, el movimiento se detiene.
- El centro se marca con un pequeño punto no interactivo. El usuario arrastra
  cualquier parte del rectángulo; el indicador no intercepta eventos.
- La prueba de navegador cubre hover y clic sin arrastre, arrastrar cruzando el
  centro, cambiar tamaño, soltar fuera del mapa y volver a pasar el cursor,
  comprobando que no haya desplazamiento adicional. También verifica zoom.
- Validación: E2E Chromium con API HTTP 200, 11 pruebas frontend y build aprobados.

### Áreas personalizadas en la investigación y comparación

- Se retiró el desplegable de regiones predefinidas del flujo principal
  (`Dashboard.tsx`); la ubicación se delimita mediante el rectángulo del mapa.
  Los casos educativos existentes siguen siendo accesos rápidos precargados.
- `RegionComparison.tsx` utiliza dos instancias independientes de `MapSelector`:
  área A y área B. Cada una puede moverse y redimensionarse, y la validación
  bloquea áreas idénticas o inválidas. Las gráficas muestran las coordenadas
  devueltas por el servidor, y los resultados anteriores se ocultan al editar.
- `services/api.ts` envía dos regiones `bbox` nombradas a la ruta de comparación;
  `main.py` asigna identificadores distintos para evitar confundir resultados
  o datos demo. No se han eliminado las regiones históricas del contrato de API.
- `tests/test_custom_comparison.py` verifica geometría, identidad y rechazo de
  áreas iguales. El E2E ajusta tamaños distintos, mueve el área B y verifica
  que las coordenadas enviadas coincidan con las devueltas por la API.
- Verificación: 53 pruebas backend, 11 frontend y build aprobados; E2E Chromium
  aprobado contra la API HTTP 200. Advertencia conocida de Starlette/httpx.

### Simplificación de pantalla solicitada

- `Dashboard.tsx`: se retiró la sección «Start with a question» y sus tarjetas
  visibles. El encabezado conduce directamente al flujo de investigación. Los
  datos de ejemplos permanecen en código para no romper contratos históricos,
  pero ya no se ofrecen como accesos directos en esa pantalla.
- `TimeSeriesChart.tsx`: se retiró únicamente la barra informativa «Chart zoom»
  y su ayuda desplegable; los controles de zoom, visibilidad, vista y altura
  siguen funcionando y ocupan el espacio restante.
- `scripts/verify_chart_ui.mjs`: comprueba la ausencia de ambos bloques y que
  los controles de las gráficas sigan operativos. E2E Chromium, 11 pruebas
  frontend y build aprobados.

### Inglés y nombres de áreas en gráficas

- Se tradujeron al inglés los textos visibles restantes de los controles de
  gráficas, los mensajes de validación y encabezados de exportación CSV.
- Cada mapa permite escribir un nombre opcional definido por el usuario. Se
  envía junto con las coordenadas, se conserva en la respuesta y se muestra
  sobre cada gráfica; por defecto se usa `Selected area`, `Area A` o `Area B`.
  No se infiere automáticamente el nombre geográfico de un rectángulo amplio.
- Cambiar el nombre después de analizar marca el resultado principal como
  pendiente; en comparación oculta resultados anteriores hasta volver a ejecutar.
- Pruebas: 53 backend, 12 frontend, build y E2E Chromium. El E2E verifica nombres
  en solicitudes, respuestas y títulos para el análisis y la comparación.
- Los documentos históricos internos en español y los recursos del contexto
  de traducción se conservan; no se afirma que todo el repositorio esté traducido.

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

Fase científica de baja fricción: los detalles avanzados de métodos se
agruparon en un panel colapsable para no saturar el resultado principal.
Se añadió Seasonal Mann–Kendall junto a OLS, Mann–Kendall y Theil–Sen. Las
respuestas visibles del backend activo (catálogo, regiones, advertencias,
veredictos, patrones y divergencia espacial) se pasaron al inglés para evitar
que la interfaz English-only vuelva a mostrar mensajes en español. Se
actualizaron las aserciones afectadas y se mantienen **51 tests backend**, **11
frontend**, typecheck, build y E2E aprobados.

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

Fase final de identidad: el nombre visible se acortó a **Earth Trend Detective**
para que el propósito sea memorable, mientras la documentación conserva el
alineamiento con el proyecto oficial de NASA Space Apps. El primer bloque del
Dashboard ahora responde explícitamente qué hace la herramienta y usa una
jerarquía inspirada en NASA: azul institucional para la navegación y rojo NASA
para la marca, la llamada principal y los estados activos. Se eliminó el banner
de proveedor duplicado porque el estado de NASA POWER ya aparece en el header y
la procedencia se explica junto a los resultados.

## Investigación orientada a preguntas

La interfaz adopta una cabecera negra, fondo blanco, estructura azul y acciones
rojas inspiradas en la referencia NASA.gov. El hero pregunta “Is your region
changing?” y lleva al flujo de configuración. Los tres casos científicos ahora
son visibles y precargan directamente la revisión de región/periodo, antes de
consultar POWER. Se retiró el asistente paralelo del Dashboard y se plegaron
las opciones avanzadas de gráficas. El resumen muestra coordenadas cuando la
selección geográfica es personalizada.

Los resultados comienzan con `InvestigationFindings`: respuesta por variable
del backend, periodo, región consultada, años completos, límites y distinción
entre datos NASA y demo. No se inventan niveles de confianza ni probabilidades;
se mantienen los veredictos calculados y las advertencias científicas.
El usuario puede volver a refinar su pregunta. Se actualizó idioma y título
HTML y se añadió atribución/disclaimer al pie.

Validación: 51 pruebas backend, 11 frontend, typecheck, build y E2E aprobados.
Se comprobó además pregunta → revisión → resultados a 1440 y 390 px sin
desbordamiento horizontal. Pendientes: evaluación con usuarios, auditoría
completa de accesibilidad, despliegue público y video; estas mejoras de UX no
constituyen una puntuación oficial de jueces.

Revisión de inglés y selección: el proceso uvicorn activo conservaba código
antiguo en memoria y devolvía catálogo y veredictos españoles. Se reinició con
recarga del directorio backend/app. Se corrigieron además leyendas, tooltips,
fechas, formato numérico, errores y unidades todavía españoles. Los valores
muy pequeños en la gráfica principal usan notación científica para evitar
mostrar pendientes no nulas o p-values pequeños como cero.

El selector muestra las siete variables con descripciones visibles, selección
por etiqueta y metadatos plegados; se retiraron buscador, chips duplicados y
scroll interno. La comparación regional se conserva al final, plegada y con
su alcance explícito. Ver challenge-requirements.md para fuentes y limitaciones
de esta revisión del enunciado. El E2E comprueba ahora texto inglés de resultados
y acceso al comparador opcional.

Revisión de repetición y selección geográfica: se retiraron las tarjetas
estadísticas duplicadas que repetían el veredicto de `InvestigationFindings`;
la evidencia detallada permanece bajo cada gráfica. La relación multivariable
también quedó plegada. Los controles para ocultar/mostrar series están dentro
de `Choose visible series` y no compiten con la lectura principal.

La selección de área dejó de imponer el mapa como paso obligatorio. Una región
predefinida queda lista para analizar; `Customize the area (optional)` abre el
mapa, punto, rectángulo y coordenadas solo para quien necesita precisión
geográfica. Esto conserva la validación NASA POWER de 2°–10° para rectángulos
sin castigar el flujo principal.

La selección de variables ahora usa un selector desplegable: se añade una
variable por vez y cada variable seleccionada tiene información contextual y
eliminación independiente. En el mapa, un control azul situado en el centro
del rectángulo permite mover toda el área; las esquinas continúan redimensionando
la selección y las coordenadas siguen disponibles para precisión manual.
La interacción fue comprobada con Playwright a 1280 px.

Revisión final de interacción geográfica: el rectángulo ya no se dibuja con dos
clics ni tiene marcadores visibles en sus esquinas. Se crea automáticamente
centrado en la región, con tamaño válido de 5° × 5°; también se ofrecen 2° × 2°
y selección de punto. El usuario solo mueve el área mediante el control central
azul, por lo que no puede iniciar una consulta regional inválida por tamaño.
El mapa volvió a ser visible dentro del paso de región, no como opción avanzada.

El selector de variables pasó a un menú desplegable propio: cada opción tiene
su icono de información dentro del menú y las variables seleccionadas se
mantienen en una lista separada. Variables, región y periodo recibieron fondos
azul/rojo muy sutiles y controles con altura mínima de 44 px para mejorar
legibilidad y objetivos táctiles sin saturar la paleta.

La interfaz de variables usa un menú desplegable sencillo, ahora con un icono
de ayuda junto a cada opción y una lista compacta de variables seleccionadas.
La geografía usa
exclusivamente rectángulos: no se ofrece selección por punto ni dibujo libre.
Los tamaños disponibles son 2°, 3°, 4°, 5°, 6°, 8° y 10° por lado, todos
válidos para NASA POWER. El arrastre del rectángulo tiene una amortiguación del
20% para facilitar el posicionamiento. La escala base de texto se fijó en
16 px con títulos de sección mayores y objetivos táctiles mínimos de 44 px.

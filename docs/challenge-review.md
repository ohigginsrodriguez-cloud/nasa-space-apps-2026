# Revisión del reto y visualización

## Dictamen

El flujo implementado cubre los cuatro objetivos centrales del texto del reto.
Esto no equivale a garantizar premios ni a ausencia de todo defecto. Los
instrumentos y portales citados son recursos/ejemplos, no una lista de
integraciones obligatorias. Tampoco se exige implementar a la vez todos los
tests estadísticos, inteligencia artificial ni tendencias opuestas significativas.

| Requisito | Estado | Evidencia | Limitaciones / pendiente |
| --- | --- | --- | --- |
| Identificar variables del sistema Tierra | Cumplido | `catalog.py`, selector; siete variables POWER | Misiones adicionales en roadmap |
| Adquirir datos de una región | Cumplido | Proveedor POWER, `regions.py`, puntos y cajas validadas | Las cajas no son polígonos administrativos; Lacandona y Centla son puntos representativos |
| Generar y visualizar series suficientemente largas | Cumplido | Ejemplos 1991–2023, `TimeSeriesChart.tsx` | Menos de tres agregados anuales: no evaluable; menos de diez: advertencia |
| Cuantificar tasa y significancia | Cumplido | OLS/t-test, IC, MK y Sen en `trend_stats.py` | Supuestos de independencia; autocorrelación advertida, no corregida |
| Comprensión para estudiantes (opcional) | Implementado | Descripciones, glosario, tarjetas y ayuda | Validación con usuarios pendiente |
| Flujo guiado y ejemplos (opcional) | Implementado | Asistente y tres ejemplos mexicanos | Ejemplos precargan configuración; no son videos |
| Comparación regional (opcional) | Implementado | `RegionComparison.tsx`, gráficos sincronizados | No implica causa común ni garantiza signos opuestos |
| Estacionalidad avanzada (opcional) | Parcial | Agregados anuales completos y Seasonal MK | El ajuste anual no elimina toda variabilidad interanual; años incompletos se excluyen |

## Correcciones de esta revisión

- Panel independiente por variable, título/unidad, colores constantes y patrones
  distintos para observación/tendencia. Sin acumulación de ejes ni curvas de
  variables diferentes en el mismo espacio.
- Botones accesibles para ocultar/mostrar variables (también sus tarjetas), estado
  vacío comprensible y “Mostrar todas”.
- Zoom por meses sincronizado entre paneles y botón de restablecimiento.
  No cambia resultados, significancia ni exportación.
- Totales anuales de precipitación ya no se superponen directamente con valores
  mensuales: ajuste y banda se muestran como equivalente mensual (÷12).
- Fechas ordenadas y ajuste centrado correctamente en cada año.
- La API conserva la región realmente consultada en el dataset del frontend:
  selecciones personalizadas no se titulan como la región predefinida.
- Separación explícita entre significancia OLS y MK, estado “No evaluable”,
  pendiente cero visible y definición frecuentista del intervalo de confianza.
- Se corrigió la etiqueta `annual_anomalies`: el ajuste actual es `annual_values`.
  Los años incompletos ya no se extrapolan y se informa su exclusión.
- Cada gráfica muestra debajo el estado de significancia, p-values OLS/MK e
  intervalo; los resultados no evaluables no se etiquetan como no significativos.
- La API entrega JSON de veredicto, patrones multivariables y divergencia
  espacial, con advertencias explícitas contra inferencias causales.

## Pruebas ejecutadas

- `pytest -q`: **51 passed**, una advertencia de deprecación Starlette/httpx.
- `npm --prefix frontend test`: **11 passed**; typecheck y build correctos.
- `scripts/verify_analysis.py`: OLS, MK y Sen coinciden con SciPy/pymannkendall
  en las series POWER 1991–2023 comprobadas.
- La verificación e2e `scripts/verify_chart_ui.mjs` no pudo ejecutarse:
  Playwright no está disponible en la ruta externa documentada. El dashboard
  sí abrió en Chromium integrado, pero falta recorrer el flujo completo.
- Pruebas unitarias del zoom comprueban los meses incluidos; las de escala
  verifican que no se modifiquen observaciones ni resultados exportados.

Las consultas reales pueden usar la caché POWER del proyecto. Los tests unitarios
usan datos controlados; no se presentan como resultados ambientales reales.
No existe un comando lint configurado. No se hizo una evaluación con estudiantes
ni una auditoría completa de accesibilidad.

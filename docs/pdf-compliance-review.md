# Trend detective — revisión de requisitos y usabilidad

## Alcance

Se encontró un único PDF en el repositorio:
`document/El número ideal para un hackathon es entre 4 y 6 variables i - Copia.pdf`
(una página). No se pueden dar por revisados otros PDFs no disponibles.
También se contrastó `docs/challenge-requirements.md` con la implementación.
El PDF contiene una propuesta de catálogo; no es el enunciado oficial completo
del challenge.

## Resultado: cumplimiento parcial del PDF

| Propuesta del PDF | Implementación comprobada | Resultado |
| --- | --- | --- |
| Menú de 4–6 variables | Siete variables activas en `frontend/src/data/mockData.ts` | Difiere de la recomendación |
| Precipitación GPM, `GPM_3IMERGM_07_precipitation` | POWER `PRECTOTCORR`, MERRA-2 | Variable disponible, producto distinto |
| Temperatura MERRA-2, `M2TMNXSLV_5_12_4_T2M` | POWER `T2M`, derivado de MERRA-2 | Coincidencia conceptual; acceso/producto solicitado no integrado directamente |
| Humedad superficial GLDAS, `SoilMoi0_10cm_inst` | POWER `GWETROOT`, humedad relativa de zona radicular | No equivalente en profundidad, unidades ni producto |
| NDVI MODIS, `MOD13C2_061__CMG_0_05_deg_Monthly_NDVI` | Entrada `roadmap`, sin proveedor operativo | Pendiente |
| Evaporación GLDAS, `GLDAS_NOAH025_M_2_1_Evap_tavg` | Evapotranspiración en roadmap, sin proveedor operativo | Pendiente; verificar definición exacta del producto antes de integrarlo |
| Cobertura de México | Rectángulos elegidos por usuario; ejemplos mexicanos | Soportada por el flujo; no se ha probado cada ubicación |
| Resolución mensual | Proveedor POWER mensual y visualización mensual | Cumple |
| Historia 2000–2026 limpia | Fechas hasta el último mes completo, controles de faltantes | No se garantiza cobertura completa para cada producto, región y mes |

Evidencia principal: `backend/app/catalog.py`,
`backend/app/services/providers/registry.py`,
`backend/app/services/providers/nasa_power.py`.
Los únicos proveedores operativos registrados son POWER y demo.
No basta con renombrar las variables para satisfacer los productos del PDF.
El rango NDVI de 0–1 del PDF es una simplificación: debe respetarse el dominio
y la máscara de calidad del producto real, sin recortar valores arbitrariamente.

## Flujo del challenge documentado

La aplicación permite seleccionar variables, área y periodo; obtener datos;
ver series, pendientes, intervalos y significancia; y leer una interpretación
con limitaciones. Ofrece comparación opcional de dos áreas.

`aggregation.py` excluye años incompletos y requiere al menos tres años completos
para estimar una tendencia; tres años es un mínimo computacional, no garantía
de suficiente evidencia climática. La precipitación se suma anualmente y las
variables de media se ponderan por días. Se distinguen series constantes y
datos insuficientes. Los resultados explican que significancia no prueba
causalidad y que no significancia no demuestra ausencia de cambio.

Esto respalda el flujo mínimo resumido en los documentos locales, no certifica
cumplimiento de un enunciado oficial completo que no está entre los PDFs disponibles.

## Revisión de usabilidad

Puntos favorables comprobados en la interfaz y el recorrido de navegador:

- Tres pasos explícitos: variable → ubicación → periodo.
- Avance deshabilitado sin selección; resumen antes del análisis.
- Definiciones de variables al pasar el cursor o enfocar.
- Nombre opcional del área, tamaño del rectángulo y estado de validación.
- Resultados en lenguaje natural antes del detalle estadístico.
- Controles para separar/combinar, ocultar series y ajustar zoom.
- Datos sintéticos identificados; errores y estados de carga explícitos.

Pendientes concretos, sin cambiar el diseño solicitado:

1. Al retirar los botones, mover el rectángulo vuelve a depender del arrastre.
   El teclado de Leaflet desplaza el mapa, no sustituye el movimiento del área.
2. El selector anuncia `listbox`, pero requiere revisar interacción completa con
   flechas/Escape y selección múltiple conforme al patrón accesible.
3. El texto temporal dice que todas las observaciones se promedian; debería
   distinguir suma de precipitación y medias ponderadas de otras variables.
4. “Last complete month available” describe el calendario, no confirma que el
   proveedor ya haya publicado cada variable para ese mes.
5. La intuición para estudiantes requiere una prueba con usuarios; que el flujo
   automatizado pase no sustituye esa evaluación ni una auditoría WCAG completa.

## Para cerrar las diferencias

Prioridad: confirmar si el PDF define el catálogo obligatorio o solo orientativo.
Si es obligatorio, integrar y validar los productos reales de GPM/GLDAS/MODIS,
incluyendo acceso, unidades, cobertura y calidad, antes de ofrecerlos en el menú.
Después ajustar el catálogo a 4–6 variables y comprobar 2000–2026 hasta el último
mes efectivamente publicado. Mantener las diferencias explícitas mientras tanto.

## Validación

- Backend: 53 pruebas aprobadas.
- Frontend: 12 pruebas aprobadas y build de producción correcto.
- El script `scripts/verify_chart_ui.mjs` comprueba análisis y comparación reales,
  siete series, zoom, arrastre, nombres de áreas y ausencia de los controles retirados.

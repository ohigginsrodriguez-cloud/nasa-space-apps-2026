# Design Brief — Earth System Trend Detective

## Producto
Herramienta web para elegir una variable de ciencia de la Tierra (NASA POWER/MERRA-2),
una región y un periodo, y ver la serie temporal, la tasa de cambio y si la tendencia
es estadísticamente significativa (OLS, Mann-Kendall, Sen, IC 95%).

## Audiencia
Estudiantes de preparatoria y universidad, y público con algo de base científica.
Deben sentirse "detectives de datos": curiosos, guiados, nunca abrumados.

## Tono
Científico pero accesible. Español claro, sin jerga. Cada término técnico
(p-value, IC, Mann-Kendall) con tooltip "¿Qué significa?".

## Dirección visual
Tema espacial/observación terrestre, sobrio y creíble (no infantil, no "sci-fi" excesivo).
Prioridad: legibilidad de gráficas y jerarquía clara de resultados.

## Pantallas
1. Inicio / Detective guiado (3 preguntas)
2. Dashboard: selector de variable + región + periodo + gráfica
3. Panel de resultados (tasa/década, IC 95%, p-values, significativo sí/no)
4. Comparación de 2 regiones (banner "Tendencias opuestas")
5. Glosario / ayuda; sección "Próximamente" para satélites

## Reglas de datos y gráficas
- Serie observada, recta de tendencia (discontinua) y banda IC 95% bien distinguibles.
- Paleta apta para daltonismo; no depender solo del color (patrones de línea, íconos ↑ ↓).
- Datos demo siempre etiquetados "DEMO / SINTÉTICO".
- Estados de carga, error, serie constante y "no significativo" bien diseñados.

## Restricciones
- React + TypeScript + Recharts, estructura actual en frontend/src.
- Responsive (móvil y escritorio), contraste WCAG AA, foco visible, navegación por teclado.
- Textos de UI en español.

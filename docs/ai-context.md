# Contexto para asistentes de IA

## Proyecto

Este repositorio corresponde al NASA Space Apps Challenge 2026, challenge
“Be An Earth System Trend Detective!”. El objetivo es construir una aplicación
que ayude a seleccionar una variable de ciencias de la Tierra, seleccionar una
región y un periodo, visualizar una serie temporal y analizar su tendencia.

## Estado al iniciar

El repositorio comenzó con solo `main` y `dev`. La estructura de carpetas y
las reglas de colaboración están siendo preparadas antes de implementar el
producto. No asumir que ya existe un backend, frontend o API funcional.

La tecnología recomendada es React + Vite + TypeScript para frontend y Python
+ FastAPI + pandas/SciPy para backend y análisis. Antes de programar se debe
investigar y validar la fuente de datos. Consultar
`docs/technology-and-order.md`.

## Alcance actual

El MVP prioriza datos mensuales, pocas variables, regiones sencillas, una
fuente de datos validada, gráfico, pendiente, p-value y explicación clara.
Debe preferirse una implementación pequeña y verificable frente a soportar
muchos datasets.

## Reglas para ayudar

- Leer primero `README.md`, `docs/mvp-scope.md` y este archivo.
- No inventar endpoints, variables, unidades ni resultados científicos.
- Mantener separadas adquisición de datos, análisis estadístico y presentación.
- Documentar toda fuente y supuesto.
- No subir secretos ni credenciales.
- Si una decisión cambia el alcance o la metodología, proponerla y registrarla
  en `docs/decisions.md`.
- Los cambios de código deben incluir pruebas cuando sea posible.
- Usar ramas `feature/*` desde `dev` y PR hacia `dev`.

## Preguntas que una IA debe hacer si falta información

- ¿Qué fuente de datos y unidad se está usando?
- ¿La región representa un punto o un área?
- ¿Cómo se agregaron los datos temporal y espacialmente?
- ¿Qué método estadístico se aplicó?
- ¿Cómo se trataron valores faltantes y estacionalidad?

## Documentos de referencia

- `docs/challenge-requirements.md`
- `docs/data-sources.md`
- `docs/statistical-methodology.md`
- `docs/team-and-branches.md`
- `docs/github-workflow.md`
- `docs/technology-and-order.md`

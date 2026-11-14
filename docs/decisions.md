# Registro de decisiones

## ADR-001 — Empezar con un MVP limitado

- **Estado:** aceptada
- **Decisión:** comenzar con datos mensuales, pocas variables y un flujo
  completo.
- **Motivo:** integrar muchos datasets antes de validar el producto aumenta el
  riesgo técnico y científico.

## ADR-002 — Integración mediante `dev`

- **Estado:** aceptada
- **Decisión:** las ramas de trabajo se integran a `dev`; `main` recibe solo
  versiones presentables.
- **Motivo:** permite revisar cambios sin bloquear el trabajo del equipo.

## ADR-003 — No confundir tendencia con causalidad

- **Estado:** aceptada
- **Decisión:** la interfaz reportará cambios observados y significancia, pero
  no afirmará causas sin análisis adicional.

## ADR-004 — Catálogo con IDs internos estables

- **Estado:** aceptada
- **Decisión:** la aplicación usará IDs como `temperature` y `precipitation`;
  los nombres de productos remotos serán metadata.
- **Motivo:** los productos, versiones y proveedores pueden cambiar sin que la
  interfaz tenga que cambiar sus identificadores.

## ADR-005 — Cinco variables candidatas, dos para el MVP

- **Estado:** aceptada
- **Decisión:** el catálogo documentará temperatura, precipitación, humedad del
  suelo, NDVI y evapotranspiración; inicialmente solo se habilitarán las dos
  primeras.
- **Motivo:** ofrece diversidad científica sin prometer integraciones no
  validadas.

## ADR-006 — Agregación dependiente de la variable

- **Estado:** aceptada
- **Decisión:** cada variable declara si se agrega por promedio o suma.
- **Motivo:** precipitación y evapotranspiración acumuladas no deben tratarse
  igual que temperatura o NDVI.

## ADR-007 — Flujo guiado sin selección técnica de fuente

- **Estado:** aceptada
- **Decisión:** el usuario selecciona variable, región y periodo; el sistema
  muestra el producto usado como metadata.
- **Motivo:** la selección de producto es una decisión científica/técnica y no
  debe hacer más difícil el flujo educativo.

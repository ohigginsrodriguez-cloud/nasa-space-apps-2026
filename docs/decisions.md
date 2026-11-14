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

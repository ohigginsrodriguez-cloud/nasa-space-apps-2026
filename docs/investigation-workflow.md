# Flujo de investigación

Este es el flujo que debe seguir una persona usuaria y también el orden lógico
de la aplicación.

```text
Pregunta
  ↓
Variable
  ↓
Región
  ↓
Periodo
  ↓
Serie temporal
  ↓
Visualización
  ↓
Análisis de tendencia
  ↓
Interpretación y limitaciones
```

## Paso 0 — Formular una pregunta

La aplicación debe ayudar a transformar una curiosidad en una pregunta
medible, por ejemplo:

> ¿La temperatura media anual aumentó en esta región entre 2001 y 2025?

Una pregunta debe mencionar variable, región y periodo.

## Paso 1 — Elegir la variable

El usuario puede seleccionar una o varias variables validadas. Para cada una se
muestra definición, unidad, fuente, frecuencia y estado de disponibilidad.
Las variables pendientes no se pueden usar en un análisis.

## Paso 2 — Elegir la región

Se debe poder seleccionar una región predefinida, un punto o un rectángulo. En
una fase posterior se podrán aceptar polígonos. La aplicación debe conservar
las coordenadas, no solo el nombre visible.

## Paso 3 — Elegir el periodo

El usuario selecciona fecha inicial y final. El sistema valida que la fecha
inicial sea anterior, que exista cobertura y que la frecuencia sea compatible.
Para una tendencia climática se recomienda un periodo de varios años.

## Paso 4 — Crear la serie temporal

El sistema obtiene datos, aplica filtros espaciales y temporales, normaliza las
unidades y devuelve una observación por fecha. Debe mostrar la fuente y el
producto utilizados.

## Paso 5 — Examinar la serie

El gráfico debe permitir observar valores originales, unidad, fechas, datos
faltantes y línea de tendencia.

## Paso 6 — Analizar la tendencia

El resultado debe incluir dirección, pendiente, cambio por década, p-value,
intervalo de confianza, cantidad de observaciones y método utilizado.

## Paso 7 — Explicar sin exagerar

La aplicación debe distinguir entre tendencia observada, tendencia
estadísticamente significativa y causa de la tendencia. Solo las dos primeras
forman parte del MVP.

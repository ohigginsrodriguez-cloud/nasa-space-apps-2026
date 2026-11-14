# Metodología estadística inicial

## Salida mínima

Para una serie temporal se calculará:

- número de observaciones;
- fecha inicial y final;
- pendiente;
- cambio estimado por década;
- p-value;
- intervalo de confianza si el método lo proporciona;
- dirección: creciente, decreciente o sin tendencia clara;
- significancia con alpha = 0.05.

## Método inicial

El primer prototipo puede usar regresión lineal para comunicar la pendiente y
un test de tendencia como Mann-Kendall. Debe registrarse cuál método se usó en
cada resultado.

Antes del análisis se deben ordenar las fechas, convertir valores a números,
identificar faltantes y documentar si se agregaron datos mensuales. La
estacionalidad puede ocultar tendencias; si se elimina, la aplicación debe
decir cómo se hizo.

## Límites

La prueba inicial no resolverá todos los problemas de autocorrelación,
estacionalidad, cambios de sensor o sesgos de muestreo. El resultado es una
herramienta educativa de detección, no una conclusión científica definitiva.

# Fuentes de datos

## Orden de evaluación

1. Giovanni: referencia principal para explorar variables y validar series.
2. NASA POWER o una API NASA sencilla: candidata para el primer prototipo.
3. AppEEARS: alternativa para datos geoespaciales por área.
4. Hydrology Time Series: opción si el equipo se enfoca en hidrología.
5. CDO, KNMI, SWOT o RADARSAT: fuentes de apoyo o futuras extensiones.

La fuente definitiva se elegirá después de comprobar API, autenticación,
resolución temporal, cobertura espacial, unidades y límites de uso.

## Requisitos para registrar una fuente

Para cada dataset guardar:

- nombre y enlace oficial;
- misión, sensor o modelo;
- variable y descripción;
- unidad;
- resolución espacial y temporal;
- periodo disponible;
- método de agregación espacial;
- datos faltantes;
- licencia o condiciones de uso;
- fecha de consulta.

Durante el desarrollo se permite usar un CSV pequeño de prueba, pero debe
identificarse claramente como `demo` y no confundirse con datos científicos
obtenidos en vivo.

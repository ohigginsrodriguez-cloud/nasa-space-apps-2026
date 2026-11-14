# Fuentes de datos

## Diferencia entre plataforma y dataset

Giovanni, AppEEARS y Earthdata son plataformas o servicios de acceso; GPM,
MERRA-2, GLDAS y MODIS son misiones, modelos o familias de productos. La
aplicación debe registrar el producto concreto, no solo la plataforma usada
para encontrarlo.

## Orden de evaluación

1. NASA POWER Monthly API: primera opción para temperatura y precipitación en
   el MVP por su REST API y consultas mensuales por punto/área.
2. Giovanni: exploración y comparación de series para validar resultados.
3. AppEEARS o GES DISC: evaluar para productos MODIS y GLDAS.
4. GPM, MERRA-2, GLDAS o MODIS: seleccionar el producto que corresponda a
   cada variable.
5. Hydrology Time Series: alternativa para datos hidrológicos.
6. CDO, KNMI, SWOT o RADARSAT: fuentes de apoyo o futuras extensiones.

La fuente definitiva se elegirá después de comprobar API, autenticación,
resolución temporal, cobertura espacial, unidades y límites de uso.

La recomendación, parámetros iniciales y limitaciones están ampliados en
[`data-source-strategy.md`](data-source-strategy.md).

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

# Fuentes de datos

## Diferencia entre plataforma y dataset

Giovanni, AppEEARS y Earthdata son plataformas o servicios de acceso; GPM,
MERRA-2, GLDAS y MODIS son misiones, modelos o familias de productos. La
aplicación debe registrar el producto concreto, no solo la plataforma usada
para encontrarlo.

## Orden de evaluación

1. Giovanni: exploración y comparación de series.
2. GPM, MERRA-2, GLDAS o MODIS: seleccionar el producto que corresponda a
   cada variable.
3. NASA Earthdata/AppEEARS: acceso programático o extracción espacial.
4. Hydrology Time Series: alternativa para datos hidrológicos.
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

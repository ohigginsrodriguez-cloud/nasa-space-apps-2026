# Catálogo científico de variables

Este documento define qué variables puede investigar la aplicación. Separa el
identificador estable de la aplicación del producto o nombre remoto de NASA.
Los nombres de productos que aparecen aquí son **candidatos de investigación**;
no significan que la integración ya esté terminada.

## Catálogo vigente

La API habilita siete variables de NASA POWER. POWER incluye campos derivados
de MERRA-2 y otros productos modelados; no todos son mediciones directas de un
instrumento satelital individual.

| ID interno | Nombre para el usuario | Qué mide | Fuente/producto | Unidad de salida | Agregación | Estado |
|---|---|---|---|---|---|---|
| `temperature` | Temperatura del aire | Temperatura media a 2 m | NASA POWER `T2M` (MERRA-2) | °C | Promedio anual | Integrada |
| `precipitation` | Precipitación | Precipitación corregida cerca de superficie | NASA POWER `PRECTOTCORR`, convertida a mm/mes | mm/mes | Suma anual | Integrada |
| `soil_moisture` | Humedad del suelo (zona radicular) | Índice de humedad en zona de raíces | NASA POWER `GWETROOT` (MERRA-2) | fracción (0–1) | Promedio anual | Integrada |
| `relative_humidity` | Humedad relativa | Humedad relativa a 2 m | NASA POWER `RH2M` (MERRA-2) | % | Promedio anual | Integrada |
| `solar_radiation` | Radiación solar superficial | Radiación de onda corta en superficie | NASA POWER `ALLSKY_SFC_SW_DWN` (CERES/SRB) | kWh/m²/día | Promedio anual | Integrada |
| `surface_pressure` | Presión en superficie | Presión atmosférica superficial | NASA POWER `PS` | kPa | Promedio anual | Integrada |
| `wind_speed` | Velocidad del viento | Velocidad del viento a 10 m | NASA POWER `WS10M` | m/s | Promedio anual | Integrada |
| `ndvi` | Índice de vegetación (NDVI) | Verdor de la cubierta vegetal | MODIS MOD13C2 | Adimensional | Promedio | Roadmap; no integrada |
| `evapotranspiration` | Evapotranspiración | Evaporación y transpiración | GLDAS; producto/campo por validar | Por validar | Por validar | Roadmap |
| `swot_water` | Elevación de agua superficial | Altura/extensión de aguas superficiales | SWOT NASA/CNES/CSA | m | Por validar | Roadmap |

## Qué significa el estado

- **Demo:** existe un dataset local sintético para probar la interfaz. No es
  una observación NASA.
- **Pendiente:** la variable está propuesta, pero todavía no se validaron
  producto, unidad, periodo, cobertura y forma de consulta.
- **Validada:** Science comprobó la documentación oficial y registró todos los
  metadatos necesarios.
- **Integrada:** Backend puede obtenerla y normalizarla mediante la API.

## Variables del MVP

Las siete primeras variables están habilitadas para NASA POWER y para el
proveedor sintético claramente etiquetado. NDVI, evapotranspiración y SWOT son
roadmap y no se anuncian como integraciones disponibles.

La selección múltiple sí debe existir desde el comienzo. Sin embargo, el
análisis conjunto solo debe permitirse cuando las variables sean compatibles
en periodo, frecuencia, región y tratamiento de valores faltantes.

## Reglas de identificación

- El frontend y la API usan el `ID interno`.
- El producto NASA se guarda como metadata, no como ID de interfaz.
- No usar nombres de archivos remotos como nombres de variables.
- Una variable debe tener una unidad definida antes de habilitarse.
- Una variable acumulada no debe agregarse igual que una variable de estado.
- `temperature` no debe confundirse con temperatura superficial, temperatura
  del mar o temperatura a otra altura.
- `evapotranspiration` debe confirmarse contra la definición exacta del campo
  GLDAS antes de presentarse como evapotranspiración.

## Ficha obligatoria para habilitar una variable

Antes de cambiar el estado a `Validada`, completar:

- definición científica;
- ID interno;
- fuente y enlace oficial;
- misión, modelo o instrumento;
- producto y campo remoto;
- unidad original y unidad de salida;
- resolución espacial;
- resolución temporal;
- periodo disponible;
- cobertura geográfica;
- agregación temporal;
- agregación espacial;
- manejo de valores faltantes;
- limitaciones;
- fecha de verificación.

## Fuentes de referencia

- [NASA POWER Monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly)
- [NASA POWER Data Sources](https://power.larc.nasa.gov/docs/methodology/data/sources/)
- [GPM Data](https://gpm.nasa.gov/data)
- [MERRA-2](https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/)
- [GLDAS](https://ldas.gsfc.nasa.gov/gldas)
- [MODIS MOD13](https://lpdaac.usgs.gov/products/mod13c2v061/)
- [NASA Giovanni](https://giovanni.gsfc.nasa.gov/giovanni/)

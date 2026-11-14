# Catálogo científico de variables

Este documento define qué variables puede investigar la aplicación. Separa el
identificador estable de la aplicación del producto o nombre remoto de NASA.
Los nombres de productos que aparecen aquí son **candidatos de investigación**;
no significan que la integración ya esté terminada.

## Selección propuesta

Se proponen cinco variables porque cubren atmósfera, agua, suelo y vegetación
sin convertir el MVP en una plataforma de todos los datos de NASA.

| ID interno | Nombre para el usuario | Qué mide | Fuente/producto candidato | Unidad de salida | Agregación | Estado |
|---|---|---|---|---|---|---|
| `temperature` | Temperatura del aire | Temperatura del aire cerca de la superficie | MERRA-2, campo T2M | °C o K | Promedio | Demo |
| `precipitation` | Precipitación | Agua precipitada acumulada durante el periodo | GPM IMERG | mm | Suma | Demo |
| `soil_moisture` | Humedad del suelo | Agua contenida en una capa definida del suelo | GLDAS, 0–10 cm | m³/m³ | Promedio | Pendiente |
| `ndvi` | Índice de vegetación (NDVI) | Verdor o actividad relativa de la vegetación | MODIS MOD13C2 | Adimensional | Promedio | Pendiente |
| `evapotranspiration` | Evapotranspiración | Pérdida de agua por evaporación y transpiración | GLDAS, campo por validar | mm | Suma | Pendiente |

## Qué significa el estado

- **Demo:** existe un dataset local sintético para probar la interfaz. No es
  una observación NASA.
- **Pendiente:** la variable está propuesta, pero todavía no se validaron
  producto, unidad, periodo, cobertura y forma de consulta.
- **Validada:** Science comprobó la documentación oficial y registró todos los
  metadatos necesarios.
- **Integrada:** Backend puede obtenerla y normalizarla mediante la API.

## Variables del MVP

El MVP debe habilitar inicialmente:

```text
temperature
precipitation
```

Las otras tres variables permanecen visibles como futuras opciones, pero
deshabilitadas hasta validar sus productos.

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

- [GPM Data](https://gpm.nasa.gov/data)
- [MERRA-2](https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/)
- [GLDAS](https://ldas.gsfc.nasa.gov/gldas)
- [MODIS MOD13](https://lpdaac.usgs.gov/products/mod13c2v061/)
- [NASA Giovanni](https://giovanni.gsfc.nasa.gov/giovanni/)

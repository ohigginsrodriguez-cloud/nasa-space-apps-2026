# Estrategia para obtener datos

## Recomendación ejecutiva

La integración vigente usa **NASA POWER Monthly API** para siete variables
meteorológicas y de superficie. Ofrece una interfaz REST de baja complejidad y
consultas mensuales para punto y bounding box. Los productos exactos se
documentan por variable; POWER no debe etiquetarse en bloque como MERRA-2.
La radiación solar `ALLSKY_SFC_SW_DWN` usa productos CERES/SRB; la
meteorología proviene principalmente de MERRA-2/GEOS-IT.

Endpoint documentado:

```text
https://power.larc.nasa.gov/api/temporal/monthly
```

Documentación:

- [NASA POWER Monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly)
- [NASA POWER temporal APIs](https://power.larc.nasa.gov/docs/services/api/temporal)
- [NASA POWER parameter catalog](https://power.larc.nasa.gov/docs/tutorials/parameters)

## Variables del MVP en POWER

| ID interno | Parámetro POWER | Descripción | Unidad de salida | Tratamiento anual |
|---|---|---|---|---|
| `temperature` | `T2M` | Temperatura a 2 metros | °C | Promedio ponderado por días; años completos |
| `precipitation` | `PRECTOTCORR` | Precipitación corregida | mm/mes | Convertir tasa diaria con días del mes; sumar meses completos |
| `soil_moisture` | `GWETROOT` | Humedad de zona radicular | fracción (0–1) | Promedio ponderado por días |
| `relative_humidity` | `RH2M` | Humedad relativa a 2 m | % | Promedio ponderado por días |
| `solar_radiation` | `ALLSKY_SFC_SW_DWN` | Radiación solar incidente | kWh/m²/día | Promedio ponderado por días |
| `surface_pressure` | `PS` | Presión superficial | kPa | Promedio ponderado por días |
| `wind_speed` | `WS10M` | Velocidad del viento a 10 m | m/s | Promedio ponderado por días |

Los nombres internos no deben cambiar si posteriormente se cambia de proveedor.
Producto, parámetro remoto, unidad original y conversiones son metadata del
proveedor.

## Consulta espacial

- Para un punto: endpoint `monthly/point` con latitud y longitud.
- Para un rectángulo: endpoint `monthly/regional` con límites min/max.
- Para regiones predefinidas, el backend conserva un bounding box explícito.
- POWER Regional requiere un bounding box de al menos 2° de alto y 2° de ancho;
  áreas menores deben consultarse como punto o con otro proveedor. El backend
  no amplía silenciosamente el área dibujada.

POWER Regional devuelve una serie para el área consultada. La resolución y el
método de resumen deben indicarse con precisión en el resultado y verificarse
en la documentación/versiones actuales de POWER. No afirmar que un punto
representa un área.

## Limitaciones de POWER

- No cubre el catálogo completo del challenge.
- El parámetro de precipitación está expresado como tasa y requiere conversión.
- El servicio puede tener límites de tamaño o disponibilidad.
- Las estimaciones de reanálisis/modelo no son idénticas a una observación
  directa de instrumento.
- El soporte de variable debe comprobarse por parámetro y comunidad.

## Variables fuera de la integración actual

Para `ndvi`, evaluar AppEEARS con MODIS MOD13C2. Para `evapotranspiration`,
evaluar un producto GLDAS concreto mediante AppEEARS o GES DISC/OPeNDAP.
SWOT requiere validar producto, cobertura y muestreo temporal. Estos flujos
pueden requerir autenticación Earthdata,
solicitudes asíncronas y procesamiento de formatos geoespaciales.

Giovanni es excelente para explorar productos, crear series y validar
resultados durante investigación; no se tratará como una API de producción ni
se automatizará mediante scraping.

## Arquitectura para crecer

```text
ID interno
   ↓
Catálogo de variables
   ↓
Proveedor asociado al producto
   ↓
Conversión a observaciones mensuales normalizadas
   ↓
Agregación/análisis común
```

Cada proveedor debe retornar el mismo formato interno:

```json
{"date": "2020-01-01", "value": 12.3}
```

Para agregar una fuente nueva no se cambian rutas ni modelos públicos: se
agrega metadata en el catálogo, implementación del proveedor, conversión de
unidades y pruebas.

## Paso de validación antes de publicar resultados

Para cada parámetro:

1. Consultar documentación oficial.
2. Hacer una petición de prueba de pocos meses.
3. Revisar `units`, `longname` y valores faltantes en la respuesta.
4. Comparar con Giovanni u otra interfaz oficial.
5. Confirmar conversiones y agregación.
6. Guardar en metadata fecha de consulta, versión y fuente.

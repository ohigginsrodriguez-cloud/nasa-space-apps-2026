# Catálogo inicial de variables

Este catálogo separa el identificador estable que usa la aplicación del
producto específico de NASA. Los productos reales solo se habilitan después de
validar unidad, cobertura, periodo y método de agregación.

| ID usado por la aplicación | Variable | Producto candidato | Unidad | Agregación | Estado |
|---|---|---|---|---|---|
| `temperature` | Temperatura del aire | MERRA-2, T2M | K o °C | Promedio | Demo |
| `precipitation` | Precipitación acumulada | GPM IMERG | mm | Suma | Demo |
| `soil_moisture` | Humedad del suelo (0–10 cm) | GLDAS | m³/m³ | Promedio | Pendiente |
| `ndvi` | Índice de vegetación NDVI | MODIS MOD13C2 | Adimensional | Promedio | Pendiente |
| `evapotranspiration` | Evapotranspiración | GLDAS | mm | Suma | Pendiente |

## Reglas

- El frontend debe usar el ID de la primera columna, nunca el nombre del
  archivo o un identificador remoto.
- Cada variable debe documentar unidad y agregación antes de habilitarse.
- `Demo` significa datos locales sintéticos, no datos NASA.
- La precipitación y la evapotranspiración no deben promediarse como si fueran
  temperatura: normalmente representan acumulados y requieren suma.
- Los IDs de producto son candidatos y deben verificarse en documentación
  oficial antes de integrarse.

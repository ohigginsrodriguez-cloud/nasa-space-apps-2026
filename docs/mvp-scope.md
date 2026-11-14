# Alcance del MVP

## Primera versión

- Datos mensuales.
- Una fuente de datos principal y un dataset local de demostración.
- Variables iniciales: `temperature` y `precipitation`.
- `soil_moisture`, `ndvi` y `evapotranspiration` se mantienen en el catálogo,
  pero no se habilitan hasta validar sus productos.
- Región predefinida o rectangular; el punto se conserva como opción de
  exploración y se integra con datos reales después.
- Periodo seleccionable.
- Gráfico de puntos/serie temporal y línea de tendencia.
- Pendiente, cambio por década, p-value y etiqueta de significancia.
- Mensajes claros para usuarios sin formación estadística.
- Tratamiento visible de datos faltantes.

## Criterio de éxito

Una persona debe poder completar el flujo desde la interfaz, entender qué
variable analizó, ver cómo cambió y distinguir entre “tendencia observada” y
“tendencia estadísticamente significativa”.

## Orden de prioridad

1. Definiciones y contrato científico claros.
2. Flujo completo con datos de prueba.
3. Análisis correcto y verificable.
4. Conexión a una fuente NASA real.
5. Visualización y accesibilidad.
6. Variables y regiones adicionales.

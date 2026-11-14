# Tecnología recomendada y orden de construcción

## Stack recomendado

| Parte | Recomendación | Motivo |
|---|---|---|
| Frontend | React + Vite + TypeScript | Prototipado rápido y tipado |
| Gráficos | Plotly.js o Apache ECharts | Series temporales interactivas |
| Mapas | Leaflet | Regiones sencillas sin plataforma propietaria |
| Backend | Python + FastAPI | API clara y ecosistema científico |
| Análisis | pandas, NumPy, SciPy y pymannkendall | Datos y estadística en Python |
| Pruebas | pytest y Vitest | Pruebas de backend y frontend |

Python es especialmente recomendable para el análisis científico. Si el equipo
domina mucho más JavaScript, Node.js también es válido, pero no conviene
cambiar de stack sin una razón concreta.

## Orden recomendado

### 1. Alinear el problema

Antes de escribir código:

- leer el challenge;
- elegir una variable inicial;
- decidir región y resolución temporal;
- definir qué significa “significativa”;
- escribir un caso de uso.

**Resultado:** una descripción concreta del MVP.

### 2. Investigar y validar datos

La persona de ciencia y la de backend deben revisar Giovanni, NASA POWER,
AppEEARS u otra fuente, probar una consulta manual, confirmar unidades,
fechas, coordenadas y cobertura, y guardar una muestra pequeña.

No conviene empezar por la interfaz ni por una API compleja si todavía no se
sabe obtener un dato fiable.

### 3. Crear el prototipo estadístico

Con un CSV pequeño, la persona de análisis debe ordenar fechas, detectar
faltantes, calcular pendiente y p-value, y probar tendencias crecientes,
decrecientes y nulas. Esto debe funcionar sin frontend ni API.

### 4. Acordar el contrato de datos

Backend y análisis deben acordar un formato, por ejemplo:

```json
{
  "variable": "surface_temperature",
  "unit": "degC",
  "region": {"name": "Demo region"},
  "series": [{"date": "2010-01-01", "value": 20.4}]
}
```

Los nombres definitivos deben documentarse antes de conectar el frontend.

### 5. Construir la interfaz con datos de prueba

Frontend puede crear el gráfico con un CSV o JSON local mientras backend termina.
Así el equipo no queda bloqueado.

### 6. Integrar y validar

Conectar frontend y backend; probar fechas inválidas, regiones sin datos,
valores faltantes y unidades; revisar que los mensajes sean comprensibles.

### 7. Preparar la demo

Cada caso debe indicar pregunta, variable, región, periodo, fuente, gráfico,
interpretación y limitaciones.

### 8. Revisión final

Instalar desde cero, ejecutar pruebas, revisar README y fuentes, confirmar que
no se afirma causalidad y probar la demo con una persona que no conozca el
proyecto.

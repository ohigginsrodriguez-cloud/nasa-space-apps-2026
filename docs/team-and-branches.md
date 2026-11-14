# Equipo, tareas y ramas

Las ramas actuales son `main` y `dev`. `main` representa una versión
presentable; `dev` integra el trabajo antes de publicar una versión estable.

## Repartición para cinco personas

Hay cuatro personas de sistemas y una persona que no tiene experiencia técnica.
La persona no técnica tendrá un papel importante en investigación,
comunicación y validación del producto.

| Persona | Perfil | Responsabilidad | Rama inicial |
|---|---|---|---|
| Persona 1 | Sistemas | Ciencia, fuentes y documentación técnica | `feature/science-documentation` |
| Persona 2 | Sistemas | Backend y adquisición de datos | `feature/backend-data` |
| Persona 3 | Sistemas | Análisis estadístico y pruebas | `feature/statistical-analysis` |
| Persona 4 | Sistemas | Frontend, visualización e integración | `feature/frontend-visualization` |
| Persona 5 | No técnica | Investigación, contenido, UX, pruebas y demo | `feature/research-demo` |

Los nombres representan el área principal, no una propiedad exclusiva.

## Qué debe hacer cada persona

### Persona 1 — Ciencia y documentación

**Primero:** leer el challenge, investigar variables posibles, comparar
fuentes, unidades y resolución temporal, y elegir la variable inicial con el
equipo.

**Después:** mantener `docs/data-sources.md`, crear definiciones sencillas,
verificar unidades y registrar decisiones y limitaciones.

**Entregables:** ficha de cada variable, fuente oficial documentada y criterios
para saber si un resultado es razonable.

### Persona 2 — Backend y datos

**Primero:** probar manualmente la API o descarga elegida, guardar una muestra
pequeña y definir el formato común de una serie temporal.

**Después:** crear endpoints, validar fechas/región/variable, normalizar
fechas, unidades y valores faltantes, y añadir errores claros.

**Entregables:** API ejecutable, dataset de prueba y contrato de entrada/salida.

### Persona 3 — Análisis estadístico

**Primero:** entender pendiente, p-value y significancia; probar cálculos con
un CSV y comparar una serie creciente, decreciente y sin tendencia.

**Después:** implementar limpieza, pendiente, cambio por década, regresión
lineal y/o Mann-Kendall, con pruebas automatizadas.

**Entregables:** módulo estadístico independiente, tests y explicación de
supuestos y límites.

### Persona 4 — Frontend e integración

**Primero:** dibujar el flujo de pantallas y probar un gráfico con datos
locales; esperar el formato de datos acordado con backend.

**Después:** crear controles para variable, región y periodo, mostrar carga,
errores y faltantes, crear el gráfico y conectar la interfaz con el backend.

**Entregables:** flujo completo, gráfico con línea de tendencia y resultado
comprensible.

### Persona 5 — Investigación, contenido y demo

No necesita programar. **Primero:** leer el challenge y el video, investigar
qué significan las variables, identificar el público y preparar preguntas para
probar la aplicación.

**Después:** escribir textos de ayuda, preparar dos casos demostrativos,
probar la aplicación como persona nueva, registrar problemas de usabilidad,
preparar el guion y revisar que no se afirme causalidad.

**Entregables:** guion, casos de uso, lista de problemas de usabilidad,
revisión del README y material de presentación.

## Cómo se relacionan las ramas

```text
main  <- versiones estables y demostrables
  ^
dev   <- integración del equipo
  ^
feature/*  <- una tarea concreta por Pull Request
```

Las ramas de feature deben salir de `dev` y volver a `dev` mediante Pull
Request. Cuando se complete una parte, se integra y la rama puede cerrarse.

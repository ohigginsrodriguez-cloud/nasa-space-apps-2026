# Equipo y ramas

Las ramas actuales son `main` y `dev`. `main` representa una versión
presentable; `dev` integra el trabajo antes de publicar una versión estable.

## Responsabilidades sugeridas

| Persona | Área | Rama inicial |
|---|---|---|
| Persona 1 | Ciencia, fuentes y documentación | `feature/science-documentation` |
| Persona 2 | Backend y adquisición de datos | `feature/backend-data` |
| Persona 3 | Análisis estadístico y pruebas | `feature/statistical-analysis` |
| Persona 4 | Frontend y visualización | `feature/frontend-visualization` |
| Persona 5 | Integración, UX y demo | `feature/integration-demo` |

Los nombres representan el área inicial, no una propiedad exclusiva. Todos
pueden revisar y ayudar en otras áreas.

## Cómo se relacionan las ramas

```text
main  <- versiones estables y demostrables
  ^
dev   <- integración del equipo
  ^
feature/*  <- una tarea concreta por Pull Request
```

Las ramas de feature deben salir de `dev` y volver a `dev` mediante Pull
Request. No se deben mantener ramas permanentes por meses: cuando una
funcionalidad se termina, se integra y la rama puede cerrarse.

## Tareas iniciales por área

- Ciencia: definir variables, unidades, periodos y fuentes.
- Backend: diseñar el contrato de la API y normalizar una serie temporal.
- Estadística: implementar pendiente, p-value y prueba elegida.
- Frontend: crear controles, gráfico, estados de carga y errores.
- Integración: conectar todo, preparar ejemplos y probar la demo completa.

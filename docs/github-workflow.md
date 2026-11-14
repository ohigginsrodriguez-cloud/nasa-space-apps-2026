# Flujo de trabajo en GitHub

## GitHub Project

Usar estas columnas:

```text
Backlog -> Ready -> In Progress -> Review -> Done
```

Añadir también `Blocked` si una tarea no puede continuar.

Cada tarjeta debe indicar:

- objetivo concreto;
- responsable;
- área;
- prioridad;
- milestone (`MVP`, `Demo` o `Final`);
- criterio de terminado.

## Pull Requests

Todo PR debe incluir:

- qué cambió;
- cómo probarlo;
- issue relacionada (`Closes #123` cuando corresponda);
- capturas si cambia la interfaz;
- limitaciones o decisiones pendientes.

La persona autora no debe aprobar su propio PR. Al menos una persona debe
revisarlo antes del merge.

## Definición de terminado

Una tarea está terminada cuando el código/documentación está en un PR
aprobado, las pruebas relevantes pasan y la tarjeta del Project tiene una
descripción actualizada.

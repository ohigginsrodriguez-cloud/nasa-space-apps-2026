# Flujo de trabajo en GitHub

## Qué significa cada rama

- `main`: versión estable que se puede presentar o entregar.
- `dev`: versión de integración del equipo.
- `feature/*`: rama temporal para una tarea concreta.

No necesitan clonar el repositorio una vez por rama. Cada persona clona una
sola vez y cambia de rama cuando lo necesita.

## Primer día de cada integrante

Si todavía no tiene el repositorio:

```bash
git clone git@github.com:ohigginsrodriguez-cloud/nasa-space-apps-2026.git
cd nasa-space-apps-2026
git fetch --all
git switch feature/nombre-de-su-rama
```

Si ya tiene una copia local:

```bash
git fetch origin
git switch feature/nombre-de-su-rama
git pull origin feature/nombre-de-su-rama
```

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

## Pull Requests y aprobaciones

El flujo normal es:

```text
feature/* -> Pull Request -> dev -> Pull Request -> main
```

### PR de una feature a `dev`

La persona que desarrolla crea el PR cuando su tarea está lista. Otra persona
revisa el código, las pruebas y la descripción. Si todo está bien, alguien con
permiso hace **Approve** y después **Merge** hacia `dev`.

La aprobación y el merge son acciones distintas:

- **Approve:** la revisión dice que el cambio está listo.
- **Merge:** el cambio se incorpora realmente a la rama destino.

### PR de `dev` a `main`

No se debe aceptar cada feature directamente en `main`. Cuando `dev` tenga
una versión funcional y presentable:

1. Probar el flujo completo.
2. Revisar documentación y fuentes.
3. Confirmar que no hay secretos ni datos sin licencia clara.
4. Crear un PR de `dev` hacia `main`.
5. Revisarlo y aprobarlo.
6. Hacer merge a `main`.

Por tanto, sí: alguien debe aceptar/mergear el PR final para que los cambios
lleguen a `main`. Sin embargo, durante el desarrollo los PR normales se
aceptan hacia `dev`, no hacia `main`.

Después de integrar cambios en `dev`, las demás personas actualizan su rama:

```bash
git switch dev
git pull origin dev
git switch feature/su-rama
git merge dev
```

Cada integrante puede clonar el repositorio una sola vez; no hace falta clonar
una copia diferente por rama.

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

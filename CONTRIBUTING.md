# Cómo colaborar

## Flujo obligatorio

1. Actualizar la copia local:

   ```bash
   git switch dev
   git pull origin dev
   ```

2. Crear una rama para una tarea concreta:

   ```bash
   git switch -c feature/nombre-corto-de-la-tarea
   ```

3. Hacer cambios pequeños y relacionados.
4. Ejecutar las pruebas disponibles.
5. Hacer commit con un mensaje claro.
6. Subir la rama y abrir un Pull Request hacia `dev`:

   ```bash
   git push -u origin feature/nombre-corto-de-la-tarea
   ```

7. Pedir revisión a otra persona del equipo.
8. Solo después de aprobar el PR, hacer merge a `dev`.

## Reglas

- No hacer push directo a `main` ni a `dev`.
- Un PR debe resolver una tarea o issue concreta.
- No mezclar cambios de frontend, backend y documentación sin necesidad.
- No subir claves API, contraseñas, archivos `.env` ni datos pesados.
- Toda fuente de datos debe quedar documentada.
- Si una decisión cambia el alcance o el método científico, registrarla en
  `docs/decisions.md`.

## Convención de commits

Usar prefijos sencillos:

```text
feat: agrega selector de variables
fix: corrige fechas faltantes
docs: actualiza fuente de datos
test: agrega prueba de pendiente
refactor: reorganiza servicio de datos
```

# Requisitos del challenge

El challenge pide una herramienta que permita investigar tendencias en
variables de ciencias de la Tierra medidas por misiones o producidas por
modelos científicos.

## Flujo mínimo requerido

1. Elegir una variable.
2. Elegir una región.
3. Elegir un periodo suficientemente largo.
4. Obtener o cargar los datos.
5. Crear y visualizar una serie temporal.
6. Calcular la tasa de cambio.
7. Evaluar la significancia estadística.
8. Explicar el resultado y sus limitaciones.

## Interpretación

Un `p-value < 0.05` será presentado como evidencia de una tendencia
estadísticamente significativa bajo el método y supuestos elegidos. Un
`p-value >= 0.05` no demuestra que no exista cambio: significa que los datos
disponibles no proporcionan evidencia suficiente bajo ese criterio.

La aplicación no debe afirmar causalidad. Detectar una tendencia no prueba qué
proceso la causó.

## Qué no es necesario para el MVP

- Integrar todos los datasets de NASA.
- Hacer predicciones futuras.
- Probar causalidad.
- Soportar datos horarios y diarios desde el primer día.
- Reemplazar herramientas científicas profesionales.

## Comparación regional: revisión de noviembre de 2026

El resumen del reto menciona explícitamente que una variable puede tener
tendencias opuestas en regiones distintas. Esto justifica conservar la
comparación como exploración adicional, pero el resumen no exige un comparador
doble como paso obligatorio. El núcleo sigue siendo variable, región, serie,
tasa de cambio y significancia. La interfaz lo ofrece plegado al final de los
resultados. Comparar signos no prueba una causa común ni la significancia
estadística de la diferencia entre pendientes.

Fuente consultada: [sede Rohnert Park / Sonoma State](https://edeon.sonoma.edu/nasaspaceapps-26/),
que reproduce el resumen y enlaza al
[enunciado oficial](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/).
La página oficial devolvió un error de transporte en esta revisión; no se
presenta el resumen de la sede como una verificación nueva del texto completo.

# Metodología científica del proyecto

## Propósito

La aplicación es una herramienta educativa para detectar y comunicar cambios
en series temporales de variables de la Tierra. No pretende sustituir un
análisis científico completo ni demostrar causalidad.

## Conceptos principales

### Variable

Una cantidad medida por un instrumento o producida por un modelo, por ejemplo
temperatura, precipitación o NDVI. La definición depende del producto exacto.

### Serie temporal

Una colección de observaciones ordenadas por fecha. Para el MVP se prefieren
datos mensuales porque reducen ruido y hacen más sencillo explicar el análisis.

### Tendencia

Un cambio sostenido en una dirección durante el periodo estudiado. Una serie
puede mostrar una tendencia global, regional o ninguna tendencia clara.

### Pendiente

Representa el cambio estimado por unidad de tiempo. La interfaz debe mostrar
preferiblemente el cambio por década para facilitar la interpretación.

### Significancia estadística

El resultado principal usa una prueba t bilateral sobre la pendiente OLS y un
intervalo de confianza del 95%. Se califica como significativo cuando
`p < 0.05` y el intervalo no contiene cero. Mann-Kendall es evidencia
complementaria; las discrepancias entre métodos permanecen visibles.

Un `p >= 0.05` no significa que no exista ningún cambio. Significa que la
evidencia disponible no es suficiente bajo el criterio elegido.

## Flujo de análisis

1. Ordenar las observaciones por fecha.
2. Convertir valores y unidades.
3. Identificar valores faltantes y no válidos.
4. Aplicar la agregación temporal definida por la variable.
5. Decidir cómo se trata la estacionalidad.
6. Ajustar la tendencia.
7. Calcular pendiente y cambio por década.
8. Calcular p-value e intervalo de confianza.
9. Reportar observaciones, periodo y método.
10. Mostrar limitaciones junto al resultado.

## Reglas de agregación

| Tipo de variable | Ejemplo | Operación inicial |
|---|---|---|
| Estado o concentración | Temperatura, humedad del suelo, NDVI | Promedio |
| Acumulado | Precipitación, evapotranspiración acumulada | Suma |

La operación definitiva debe confirmarse con la definición del producto. No se
debe aplicar una regla solo por el nombre de la variable.

## Estacionalidad

Temperatura y precipitación suelen tener ciclos anuales. El MVP puede comenzar
con promedios anuales completos para explicar el flujo, pero debe indicar que
esa decisión elimina parte de la información mensual.

Si se analiza una tendencia mensual directamente, el equipo debe considerar
desestacionalizar o comparar la misma estación entre años.

## Datos faltantes

- No convertir un valor faltante en cero.
- Registrar cuántas observaciones faltan.
- No completar datos automáticamente sin documentar el método.
- Excluir del ajuste anual los años que no tengan 12 meses válidos.
- Mostrar al usuario cuándo el resultado tiene poca cobertura.

## Limitaciones conocidas

- La autocorrelación puede hacer que un p-value parezca más significativo de
  lo que realmente es.
- Una tendencia lineal no representa necesariamente cambios no lineales.
- Cambios de sensor o de producto pueden introducir discontinuidades.
- La significancia depende del periodo y la calidad de los datos.
- Una tendencia observada no demuestra su causa.
- Los datos cercanos al presente en POWER pueden ser provisionales o revisarse
  al actualizarse el producto; un mes calendario completo no garantiza que el
  producto de reanálisis ya haya sido finalizado.

Mann-Kendall, Seasonal Mann-Kendall y Theil-Sen están implementados como
métodos complementarios; no corrigen automáticamente la autocorrelación.

## Interpretación de patrones

La aplicación genera JSON para el veredicto estadístico, patrones
multivariables en una región y divergencia espacial de una variable entre dos
regiones. Los patrones físicos son exploratorios: la coincidencia de tendencias
no demuestra causalidad ni identifica por sí sola un mecanismo físico.

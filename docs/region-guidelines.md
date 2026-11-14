# Regiones y tratamiento espacial

## Tipos de región

### Región predefinida

Una región con nombre y geometría registrada. Es la opción más segura para la
primera demo porque permite reproducir resultados.

### Punto

Una coordenada de latitud y longitud. Debe documentarse si el dataset consulta
el píxel cercano o realiza interpolación.

### Bounding box

Un rectángulo definido por:

```json
{
  "type": "bbox",
  "south": 20,
  "west": -100,
  "north": 25,
  "east": -95
}
```

### Polígono

Se deja para una fase posterior porque requiere validar GeoJSON, geometrías
inválidas y límites del proveedor.

## Reglas de validación

- Latitud entre `-90` y `90`.
- Longitud entre `-180` y `180`.
- Sur menor que norte.
- Oeste menor que este para un rectángulo simple.
- Rechazar regiones vacías o inválidas.
- Guardar la región enviada junto con el resultado.

## Agregación espacial

El valor de una región normalmente será un promedio o suma espacial de las
celdas que intersectan el área. El método depende de la variable:

- Temperatura, humedad y NDVI: promedio espacial inicial.
- Precipitación acumulada: promedio areal de la precipitación, considerando el
  área y no una suma sin ponderación.
- Variables con máscara de tierra/agua: documentar la máscara aplicada.

No afirmar que un valor representa toda una región si solo se consultó un
punto.

## Regiones iniciales para ejemplos

Las regiones de la interfaz son ejemplos educativos y deben tener geometría
reproducible antes de usarse con datos reales:

- Desierto de Sonora.
- Cuenca del Amazonas.
- Estuario de Chesapeake.
- Área metropolitana de Nueva York.

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
- NASA POWER regional admite entre 2° y 10° en cada eje (límites inclusivos).
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

El catálogo ofrece únicamente ubicaciones mexicanas. Sus geometrías reproducibles
están en `backend/app/regions.py`:

| Región | Tipo | Coordenadas |
| --- | --- | --- |
| Desierto de Sonora · México | Rectángulo | Latitud 28–30°, longitud −112 a −110° |
| Selva Lacandona · Chiapas | Punto representativo | 16.8°, −91.3° |
| Pantanos de Centla · Tabasco | Punto representativo | 18.4°, −92.6° |
| Valle de México y alrededores | Rectángulo | Latitud 18.5–20.5°, longitud −100.2 a −98.2° |

Los rectángulos son áreas educativas aproximadas, no límites administrativos ni
máscaras de ecosistemas. Los puntos representan la celda del proveedor en esa
ubicación, no el promedio de toda la selva o humedal.

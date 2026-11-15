import type { DataConfiguration, DemoExample, Region, ScientificVariable } from '../types'

export const variables: ScientificVariable[] = [
  {
    id: 'temperature',
    name: 'Temperatura del aire',
    description: 'Temperatura media mensual del aire a 2 metros sobre la superficie.',
    unit: '°C',
    measurement: 'Grados Celsius',
  },
  {
    id: 'precipitation',
    name: 'Precipitación',
    description: 'Precipitación acumulada mensual corregida de lluvia y nieve.',
    unit: 'mm',
    measurement: 'Milímetros',
  },
  {
    id: 'soil_moisture',
    name: 'Humedad del suelo (raíz)',
    description: 'Humedad relativa en la zona radicular (0 = seco, 1 = saturado).',
    unit: 'fracción',
    measurement: 'Fracción (0–1)',
  },
  {
    id: 'relative_humidity',
    name: 'Humedad relativa',
    description: 'Porcentaje de vapor de agua en el aire respecto a saturación a 2 m.',
    unit: '%',
    measurement: 'Porcentaje',
  },
  {
    id: 'solar_radiation',
    name: 'Radiación solar superficial',
    description: 'Flujo solar incidente en superficie bajo cualquier condición de cielo.',
    unit: 'kW·h/m²/día',
    measurement: 'Kilovatios-hora por metro cuadrado por día',
  },
  {
    id: 'surface_pressure',
    name: 'Presión en superficie',
    description: 'Presión ejercida por la masa de aire sobre la superficie local.',
    unit: 'kPa',
    measurement: 'Kilopascales',
  },
  {
    id: 'wind_speed',
    name: 'Velocidad del viento',
    description: 'Velocidad media mensual del viento a 10 metros de altura.',
    unit: 'm/s',
    measurement: 'Metros por segundo',
  },
]

export const regions: Region[] = [
  {
    id: 'sonoran-desert',
    name: 'Desierto de Sonora · México',
    description: 'Región árida y cálida · rectángulo aproximado de 2° × 2°',
    prompt: 'En regiones áridas, examina si la temperatura y la radiación solar aumentan mientras la humedad decrece.',
    suggestedVariables: ['temperature', 'solar_radiation', 'relative_humidity'],
    center: [29, -111],
  },
  {
    id: 'lacandon-jungle',
    name: 'Selva Lacandona · Chiapas',
    description: 'Selva tropical húmeda · punto representativo',
    prompt: 'En la selva tropical, investiga si la precipitación acumulada y la humedad del suelo muestran secamiento sostenido.',
    suggestedVariables: ['precipitation', 'soil_moisture'],
    center: [16.8, -91.3],
  },
  {
    id: 'tabasco-wetlands',
    name: 'Pantanos de Centla · Tabasco',
    description: 'Humedales costeros · punto representativo',
    prompt: 'En cuencas estuarinas, explora cómo interactúan la precipitación y la temperatura en el régimen hidrológico.',
    suggestedVariables: ['precipitation', 'temperature'],
    center: [18.4, -92.6],
  },
  {
    id: 'valley-of-mexico',
    name: 'Valle de México y alrededores',
    description: 'Zona urbana y regional · rectángulo aproximado',
    prompt: 'Sobre una metrópolis, evalúa el calentamiento urbano y cambios en viento o humedad relativa.',
    suggestedVariables: ['temperature', 'wind_speed', 'relative_humidity'],
    center: [19.5, -99.2],
  },
]

export const demoExamples: DemoExample[] = [
  {
    id: 'desert-heat',
    title: '¿Cómo cambia el calor en el desierto?',
    description: 'Temperatura y Radiación Solar · Desierto de Sonora · 1991–2023 (33 años)',
    regionId: 'sonoran-desert',
    variableIds: ['temperature', 'solar_radiation'],
    timeRange: { startDate: '1991-01-01', endDate: '2023-12-31', interval: 'monthly' },
  },
  {
    id: 'lacandon-rain',
    title: '¿Está cambiando la lluvia en la selva?',
    description: 'Precipitación y Humedad del Suelo · Selva Lacandona · 1991–2023 (33 años)',
    regionId: 'lacandon-jungle',
    variableIds: ['precipitation', 'soil_moisture'],
    timeRange: { startDate: '1991-01-01', endDate: '2023-12-31', interval: 'monthly' },
  },
  {
    id: 'mexico-city-heat',
    title: '¿Cómo cambia la temperatura del Valle de México?',
    description: 'Temperatura · Valle de México y alrededores · 1991–2023 (33 años)',
    regionId: 'valley-of-mexico',
    variableIds: ['temperature'],
    timeRange: { startDate: '1991-01-01', endDate: '2023-12-31', interval: 'monthly' },
  },
]

export const defaultConfiguration: DataConfiguration = {
  variableIds: [],
  regionId: 'sonoran-desert',
  timeRange: { startDate: '1995-01-01', endDate: '2024-12-01', interval: 'monthly' },
  sourceId: 'nasa-power',
}

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
    name: 'Desierto de Sonora · Phoenix, Arizona',
    description: 'Región árida y cálida',
    prompt: 'En regiones áridas, examina si la temperatura y la radiación solar aumentan mientras la humedad decrece.',
    suggestedVariables: ['temperature', 'solar_radiation', 'relative_humidity'],
    center: [33.4484, -112.074],
  },
  {
    id: 'amazon-basin',
    name: 'Cuenca del Amazonas',
    description: 'Selva tropical húmeda',
    prompt: 'En la selva tropical, investiga si la precipitación acumulada y la humedad del suelo muestran secamiento sostenido.',
    suggestedVariables: ['precipitation', 'soil_moisture'],
    center: [-3.4653, -62.2159],
  },
  {
    id: 'chesapeake-estuary',
    name: 'Estuario de Chesapeake',
    description: 'Estuario de marea y cuenca costera',
    prompt: 'En cuencas estuarinas, explora cómo interactúan la precipitación y la temperatura en el régimen hidrológico.',
    suggestedVariables: ['precipitation', 'temperature'],
    center: [38.5, -76.4],
  },
  {
    id: 'new-york-city',
    name: 'Área metropolitana de Nueva York',
    description: 'Atmósfera urbana y periurbana',
    prompt: 'Sobre una metrópolis, evalúa el calentamiento urbano y cambios en viento o humedad relativa.',
    suggestedVariables: ['temperature', 'wind_speed', 'relative_humidity'],
    center: [40.7128, -74.006],
  },
]

export const demoExamples: DemoExample[] = [
  {
    id: 'desert-heat',
    title: '¿Cómo cambia el calor en el desierto?',
    description: 'Temperatura y Radiación Solar · Desierto de Sonora · 1991–2023 (33 años)',
    regionId: 'sonoran-desert',
    variableIds: ['temperature', 'solar_radiation'],
  },
  {
    id: 'amazon-rain',
    title: '¿Está cambiando la lluvia en la selva?',
    description: 'Precipitación y Humedad del Suelo · Cuenca del Amazonas · 1991–2023 (33 años)',
    regionId: 'amazon-basin',
    variableIds: ['precipitation', 'soil_moisture'],
  },
  {
    id: 'opposing-trends',
    title: 'Tendencias opuestas: Desierto vs Selva',
    description: 'Precipitación contrastante · Sonora vs Amazonas · 1995–2023',
    regionId: 'sonoran-desert',
    variableIds: ['precipitation'],
  },
]

export const defaultConfiguration: DataConfiguration = {
  variableIds: [],
  regionId: 'sonoran-desert',
  timeRange: { startDate: '1995-01-01', endDate: '2024-12-01', interval: 'monthly' },
  sourceId: 'nasa-power',
}

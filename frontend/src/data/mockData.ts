import type { DataConfiguration, DemoExample, Region, ScientificVariable } from '../types'

// Valores ficticios para probar la interfaz. No proceden de observaciones ni de NASA.
export const variables: ScientificVariable[] = [
  {
    id: 'temperature',
    name: 'Temperatura',
    description: 'Temperatura del aire cerca de la superficie.',
    unit: '°C',
    measurement: 'Grados Celsius',
  },
  {
    id: 'precipitation',
    name: 'Precipitación',
    description: 'Precipitación acumulada durante el mes.',
    unit: 'mm',
    measurement: 'Milímetros',
  },
]

export const regions: Region[] = [
  {
    id: 'sonoran-desert',
    name: 'Desierto de Sonora · Phoenix, Arizona',
    description: 'Región árida y cálida',
    prompt: 'En regiones desérticas puede ser interesante investigar el calor y la disponibilidad de lluvia.',
    suggestedVariables: ['temperature', 'precipitation'],
    center: [33.4484, -112.074],
  },
  {
    id: 'amazon-basin',
    name: 'Cuenca del Amazonas',
    description: 'Selva tropical húmeda',
    prompt: 'En una selva tropical, explora si la precipitación o la temperatura muestran una tendencia sostenida.',
    suggestedVariables: ['precipitation', 'temperature'],
    center: [-3.4653, -62.2159],
  },
  {
    id: 'chesapeake-estuary',
    name: 'Estuario de Chesapeake',
    description: 'Estuario de marea',
    prompt: 'En un estuario, las tendencias de temperatura y precipitación pueden ayudar a formular preguntas sobre el sistema local.',
    suggestedVariables: ['precipitation', 'temperature'],
    center: [38.5, -76.4],
  },
  {
    id: 'new-york-city',
    name: 'Área metropolitana de Nueva York',
    description: 'Atmósfera sobre una gran ciudad',
    prompt: 'Sobre una gran ciudad, compara la evolución de la temperatura con la precipitación.',
    suggestedVariables: ['temperature', 'precipitation'],
    center: [40.7128, -74.006],
  },
]

export const demoExamples: DemoExample[] = [
  {
    id: 'desert-heat',
    title: '¿Cómo cambia el calor en el desierto?',
    description: 'Temperatura mensual · Desierto de Sonora · 2001–2025',
    regionId: 'sonoran-desert',
    variableIds: ['temperature'],
  },
  {
    id: 'amazon-rain',
    title: '¿Está cambiando la lluvia en la selva?',
    description: 'Precipitación mensual · Cuenca del Amazonas · 2001–2025',
    regionId: 'amazon-basin',
    variableIds: ['precipitation'],
  },
]

export const defaultConfiguration: DataConfiguration = {
  variableIds: ['temperature', 'precipitation'],
  regionId: 'sonoran-desert',
  timeRange: { startDate: '2001-01-01', endDate: '2025-12-01', interval: 'monthly' },
  // NASA POWER es el camino real del MVP; se puede cambiar a local-demo para
  // desarrollar sin red o probar la interfaz de forma determinista.
  sourceId: 'nasa-power',
}

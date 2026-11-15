import type { DataConfiguration, DemoExample, Region, ScientificVariable } from '../types'

export const variables: ScientificVariable[] = [
  {
    id: 'temperature',
    name: 'Air temperature',
    description: 'Monthly mean air temperature at 2 meters above the surface.',
    unit: '°C',
    measurement: 'Degrees Celsius',
  },
  {
    id: 'precipitation',
    name: 'Precipitation',
    description: 'Corrected monthly accumulated rainfall and snowfall.',
    unit: 'mm',
    measurement: 'Millimeters',
  },
  {
    id: 'soil_moisture',
    name: 'Root-zone soil moisture',
    description: 'Relative moisture in the root zone (0 = dry, 1 = saturated).',
    unit: 'fraction',
    measurement: 'Fraction (0–1)',
  },
  {
    id: 'relative_humidity',
    name: 'Relative humidity',
    description: 'Percentage of water vapor in air relative to saturation at 2 m.',
    unit: '%',
    measurement: 'Percentage',
  },
  {
    id: 'solar_radiation',
    name: 'Surface solar radiation',
    description: 'Incident solar flux at the surface under all-sky conditions.',
    unit: 'kW·h/m²/day',
    measurement: 'Kilowatt-hours per square meter per day',
  },
  {
    id: 'surface_pressure',
    name: 'Surface pressure',
    description: 'Pressure exerted by the air mass over the local surface.',
    unit: 'kPa',
    measurement: 'Kilopascals',
  },
  {
    id: 'wind_speed',
    name: 'Wind speed',
    description: 'Monthly mean wind speed at 10 meters above the surface.',
    unit: 'm/s',
    measurement: 'Meters per second',
  },
]

export const regions: Region[] = [
  {
    id: 'sonoran-desert',
    name: 'Sonoran Desert · Mexico',
    description: 'Warm, arid region · approximate 2° × 2° rectangle',
    prompt: 'In arid regions, examine whether temperature and solar radiation rise while humidity declines.',
    suggestedVariables: ['temperature', 'solar_radiation', 'relative_humidity'],
    center: [29, -111],
  },
  {
    id: 'lacandon-jungle',
    name: 'Lacandon Jungle · Chiapas',
    description: 'Humid tropical forest · representative point',
    prompt: 'In tropical forest, investigate whether accumulated precipitation and soil moisture show sustained drying.',
    suggestedVariables: ['precipitation', 'soil_moisture'],
    center: [16.8, -91.3],
  },
  {
    id: 'tabasco-wetlands',
    name: 'Centla Wetlands · Tabasco',
    description: 'Coastal wetlands · representative point',
    prompt: 'In estuarine basins, explore how precipitation and temperature interact in the hydrological regime.',
    suggestedVariables: ['precipitation', 'temperature'],
    center: [18.4, -92.6],
  },
  {
    id: 'valley-of-mexico',
    name: 'Mexico City Valley and surroundings',
    description: 'Urban and regional zone · approximate rectangle',
    prompt: 'Around a metropolis, evaluate urban warming and changes in wind or relative humidity.',
    suggestedVariables: ['temperature', 'wind_speed', 'relative_humidity'],
    center: [19.5, -99.2],
  },
]

export const demoExamples: DemoExample[] = [
  {
    id: 'desert-heat',
    title: 'How is heat changing in the desert?',
    description: 'Air temperature and surface solar radiation · Sonoran Desert · 1991–2023 (33 years)',
    regionId: 'sonoran-desert',
    variableIds: ['temperature', 'solar_radiation'],
    timeRange: { startDate: '1991-01-01', endDate: '2023-12-31', interval: 'monthly' },
  },
  {
    id: 'lacandon-rain',
    title: 'Is rainfall changing in the forest?',
    description: 'Precipitation and soil moisture · Lacandon Jungle · 1991–2023 (33 years)',
    regionId: 'lacandon-jungle',
    variableIds: ['precipitation', 'soil_moisture'],
    timeRange: { startDate: '1991-01-01', endDate: '2023-12-31', interval: 'monthly' },
  },
  {
    id: 'mexico-city-heat',
    title: 'How is temperature changing in the Mexico City Valley?',
    description: 'Air temperature · Mexico City Valley and surroundings · 1991–2023 (33 years)',
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

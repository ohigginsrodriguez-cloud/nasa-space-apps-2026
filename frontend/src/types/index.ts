export type VariableId = 'temperature' | 'precipitation'
export type RegionId = 'sonoran-desert' | 'amazon-basin' | 'chesapeake-estuary' | 'new-york-city'
export type TemporalInterval = 'monthly'
export type SectionId = 'investigation' | 'analysis' | 'comparison'
export type VariableCategory = 'Atmósfera' | 'Hidrología' | 'Océanos' | 'Superficie terrestre'
export type IntegrationStatus = 'demo' | 'requires-configuration' | 'pending'

export interface ScientificVariable {
  id: VariableId
  name: string
  description: string
  unit: string
  measurement: string
}

export interface EnvironmentalVariable {
  id: string
  demoId?: VariableId
  name: string
  description: string
  category: VariableCategory
  unit: string
  measurement: string
  dataType: string
  potentialSources: string[]
  temporalResolution: string | null
  geographicCoverage: string | null
  integrationStatus: IntegrationStatus
}

export interface TimeRange {
  startDate: string
  endDate: string
  interval: TemporalInterval
}

export interface TimeSeriesPoint {
  date: string
  temperature: number
  precipitation: number
}

export interface Region {
  id: RegionId
  name: string
  description: string
  prompt: string
  suggestedVariables: VariableId[]
  center: [number, number]
}

export interface DemoExample {
  id: string
  title: string
  description: string
  regionId: RegionId
  variableIds: VariableId[]
}

export interface DataSource {
  id: string
  name: string
  organization: string
  description: string
  available: boolean
  status: IntegrationStatus
  variables: string[]
  dataType: string
  coverage: string | null
  temporalResolution: string | null
  accessMethod: string
  url?: string
}

export interface GeographicBounds {
  south: number
  west: number
  north: number
  east: number
}

export interface GeographicPoint {
  latitude: number
  longitude: number
}

export interface DataConfiguration {
  variableIds: VariableId[]
  regionId: RegionId
  timeRange: TimeRange
  sourceId: string
}

export interface TimeSeriesDataset {
  points: TimeSeriesPoint[]
  sourceId: string
  isDemonstration: boolean
  missingValueCount: number
}


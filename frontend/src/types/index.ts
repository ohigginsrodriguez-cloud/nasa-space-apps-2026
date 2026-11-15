export type VariableId =
  | 'temperature'
  | 'precipitation'
  | 'soil_moisture'
  | 'relative_humidity'
  | 'solar_radiation'
  | 'surface_pressure'
  | 'wind_speed'
export type RegionId = 'sonoran-desert' | 'amazon-basin' | 'chesapeake-estuary' | 'new-york-city'
export type TemporalInterval = 'monthly'
export type SectionId = 'investigation' | 'analysis'
export type VariableCategory =
  | 'Todas'
  | 'Atmósfera'
  | 'Hidrología'
  | 'Superficie terrestre'
  | 'Energía'
  | 'Océanos e Hidrología'
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
  available?: boolean
}

export interface TimeRange {
  startDate: string
  endDate: string
  interval: TemporalInterval
}

export interface TimeSeriesPoint {
  date: string
  [key: string]: string | number | null | [number, number] | undefined
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

export interface BackendVariable {
  id: VariableId
  name: string
  description: string
  unit: string
  aggregation: string
  category?: string
  product: string | null
  status: string
  available: boolean
  providers: string[]
}

export interface BackendTrend {
  method: string
  direction: 'increasing' | 'decreasing' | 'no_linear_change' | 'undetermined'
  status?: string
  slope_per_year: number | null
  change_per_decade: number | null
  p_value: number | null
  confidence_interval_per_decade: number[] | null
  significant: boolean | null
  n_observations: number
  message: string
  warnings?: string[]
  ols?: {
    status?: string
    slope_per_year?: number
    slope_per_decade?: number
    intercept?: number
    r_squared?: number
    p_value?: number
    ci95_per_decade?: number[] | null
    t_stat?: number
    df?: number
    stderr?: number
  } | null
  mann_kendall?: {
    status?: string
    s?: number
    var_s?: number
    z?: number
    p_value?: number | null
    tau?: number
    trend?: string
  } | null
  seasonal_mann_kendall?: {
    status?: string
    s?: number
    var_s?: number
    z?: number | null
    p_value?: number | null
    trend?: string
    seasons_evaluated?: number
  } | null
  sen?: {
    status?: string
    slope_per_year?: number | null
    slope_per_decade?: number | null
    intercept?: number | null
    ci95_per_decade?: number[] | null
  } | null
  trend_line?: Array<{ date: string; value: number }>
  trend_band?: Array<{ date: string; lower: number; upper: number }>
  alpha?: number
  data_source?: string
  analysis_method?: string
}

export interface BackendResult {
  variable: BackendVariable
  series: Array<{ date: string; value: number | null }>
  trend: BackendTrend
}

export interface TimeSeriesDataset {
  points: TimeSeriesPoint[]
  sourceId: string
  isDemonstration: boolean
  missingValueCount: number
  results: BackendResult[]
  sourceUrl: string | null
}

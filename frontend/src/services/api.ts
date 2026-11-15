import type { BackendResult, BackendVariable, DataConfiguration, GeographicBounds, GeographicPoint, RegionId, SpatialInterpretation, TimeSeriesDataset } from '../types'
import { validateConfiguration, validateGeographicSelection } from '../utils/configuration'
import { formatApiError } from '../utils/apiErrors'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface BackendAnalysis {
  provider: string
  source_url: string | null
  region: { id: string; name: string; type: string; south: number; west: number; north: number; east: number }
  period: { start: string; end: string; frequency: string }
  results: BackendResult[]
  multivariate_interpretation?: TimeSeriesDataset['multivariateInterpretation']
}

interface BackendComparison {
  provider: string
  source_url: string | null
  period: { start: string; end: string; frequency: string }
  variable: BackendVariable
  regions: Array<{
    region: NonNullable<TimeSeriesDataset['region']>
    series: BackendResult['series']
    trend: BackendResult['trend']
    interpretation: BackendResult['interpretation']
  }>
  spatial_interpretation: SpatialInterpretation
}

function regionBody(regionId: RegionId, bounds: GeographicBounds | null, point: GeographicPoint | null, name = '') {
  if (point) return { type: 'point', latitude: point.latitude, longitude: point.longitude }
  if (bounds) return { type: 'bbox', name: name.trim() || 'Selected area', ...bounds }
  return { type: 'predefined', id: regionId }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(formatApiError(body, response.status))
  }
  return response.json() as Promise<T>
}

export async function getVariables(provider: string): Promise<BackendVariable[]> {
  return request<BackendVariable[]>(`/api/v1/variables?provider=${provider}`)
}

export async function runAnalysis(
  configuration: DataConfiguration,
  bounds: GeographicBounds | null,
  point: GeographicPoint | null,
  areaName = '',
): Promise<TimeSeriesDataset> {
  const validationError = validateConfiguration(configuration)
    ?? validateGeographicSelection(configuration.sourceId, bounds, point)
  if (validationError) throw new Error(validationError)
  // The backend is the sole source of scientific calculations; the frontend
  // only adapts the response into chart-friendly points.
  const provider = configuration.sourceId === 'nasa-power' ? 'nasa-power' : 'demo'
  const response = await request<BackendAnalysis>('/api/v1/analysis', {
    method: 'POST',
    body: JSON.stringify({
      variable_ids: configuration.variableIds,
      region: regionBody(configuration.regionId, bounds, point, areaName),
      start_date: configuration.timeRange.startDate,
      end_date: configuration.timeRange.endDate,
      provider,
    }),
  })

  const pointMap = new Map<string, Record<string, string | number | null | [number, number]>>()
  response.results.forEach((result) => {
    // 1. Observed series points
    result.series.forEach((observation) => {
      const current = pointMap.get(observation.date) ?? { date: observation.date }
      current[result.variable.id] = observation.value
      pointMap.set(observation.date, current)
    })

    // 2. Trend line points (y_hat)
    if (result.trend.trend_line) {
      result.trend.trend_line.forEach((item) => {
        const current = pointMap.get(item.date) ?? { date: item.date }
        current[`trend_${result.variable.id}`] = item.value
        pointMap.set(item.date, current)
      })
    }

    // 3. Confidence band range points [lower, upper]
    if (result.trend.trend_band) {
      result.trend.trend_band.forEach((item) => {
        const current = pointMap.get(item.date) ?? { date: item.date }
        current[`band_${result.variable.id}`] = [item.lower, item.upper]
        current[`band_lower_${result.variable.id}`] = item.lower
        current[`band_upper_${result.variable.id}`] = item.upper
        pointMap.set(item.date, current)
      })
    }
  })

  return {
    region: response.region,
    points: [...pointMap.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))) as TimeSeriesDataset['points'],
    sourceId: configuration.sourceId,
    isDemonstration: provider === 'demo',
    missingValueCount: response.results.reduce((total, result) => total + result.series.filter((item) => item.value === null).length, 0),
    results: response.results,
    sourceUrl: response.source_url,
    multivariateInterpretation: response.multivariate_interpretation ?? null,
  }
}

export async function runRegionComparison(
  variableId: string,
  regionBounds: [GeographicBounds, GeographicBounds],
  startDate: string,
  endDate: string,
  sourceId: string,
  areaNames: [string, string] = ['', ''],
): Promise<{ datasets: [TimeSeriesDataset, TimeSeriesDataset]; interpretation: SpatialInterpretation }> {
  for (const bounds of regionBounds) {
    const error = validateGeographicSelection(sourceId, bounds, null)
    if (error) throw new Error(error)
  }
  if (['south', 'north', 'west', 'east'].every((key) => regionBounds[0][key as keyof GeographicBounds] === regionBounds[1][key as keyof GeographicBounds])) {
    throw new Error('Choose two different areas to compare.')
  }
  const provider = sourceId === 'nasa-power' ? 'nasa-power' : 'demo'
  const response = await request<BackendComparison>('/api/v1/analysis/compare', {
    method: 'POST',
    body: JSON.stringify({
      variable_id: variableId,
      regions: regionBounds.map((bounds, index) => ({ type: 'bbox', name: areaNames[index].trim() || `Area ${index === 0 ? 'A' : 'B'}`, ...bounds })),
      start_date: startDate,
      end_date: endDate,
      provider,
    }),
  })

  const datasets = response.regions.map((item) => {
    const result: BackendResult = {
      variable: response.variable,
      series: item.series,
      trend: item.trend,
      interpretation: item.interpretation,
    }
    const pointMap = new Map<string, TimeSeriesDataset['points'][number]>()
    item.series.forEach((observation) => {
      pointMap.set(observation.date, {
        ...(pointMap.get(observation.date) ?? { date: observation.date }),
        [response.variable.id]: observation.value,
      })
    })
    item.trend.trend_line?.forEach((line) => {
      pointMap.set(line.date, {
        ...(pointMap.get(line.date) ?? { date: line.date }),
        [`trend_${response.variable.id}`]: line.value,
      })
    })
    item.trend.trend_band?.forEach((band) => {
      pointMap.set(band.date, {
        ...(pointMap.get(band.date) ?? { date: band.date }),
        [`band_${response.variable.id}`]: [band.lower, band.upper],
      })
    })
    return {
      region: item.region,
      points: [...pointMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
      sourceId,
      isDemonstration: provider === 'demo',
      missingValueCount: item.series.filter((entry) => entry.value === null).length,
      results: [result],
      sourceUrl: response.source_url,
    } satisfies TimeSeriesDataset
  }) as [TimeSeriesDataset, TimeSeriesDataset]

  return { datasets, interpretation: response.spatial_interpretation }
}

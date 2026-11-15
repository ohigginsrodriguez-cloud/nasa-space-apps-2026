import type { BackendResult, BackendVariable, DataConfiguration, GeographicBounds, GeographicPoint, RegionId, TimeSeriesDataset } from '../types'
import { validateConfiguration, validateGeographicSelection } from '../utils/configuration'
import { formatApiError } from '../utils/apiErrors'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface BackendAnalysis {
  provider: string
  source_url: string | null
  region: { id: string; name: string; type: string; south: number; west: number; north: number; east: number }
  period: { start: string; end: string; frequency: string }
  results: BackendResult[]
}

function regionBody(regionId: RegionId, bounds: GeographicBounds | null, point: GeographicPoint | null) {
  if (point) return { type: 'point', latitude: point.latitude, longitude: point.longitude }
  if (bounds) return { type: 'bbox', ...bounds }
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
      region: regionBody(configuration.regionId, bounds, point),
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
    points: [...pointMap.values()] as TimeSeriesDataset['points'],
    sourceId: configuration.sourceId,
    isDemonstration: provider === 'demo',
    missingValueCount: response.results.reduce((total, result) => total + result.series.filter((item) => item.value === null).length, 0),
    results: response.results,
    sourceUrl: response.source_url,
  }
}

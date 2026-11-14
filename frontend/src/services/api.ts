import type { BackendResult, BackendVariable, DataConfiguration, GeographicBounds, GeographicPoint, RegionId, TimeSeriesDataset } from '../types'
import { validateGeographicSelection } from '../utils/configuration'

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
    throw new Error(body?.detail?.message ?? body?.detail ?? `API error ${response.status}`)
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
  // The backend is the sole source of scientific calculations; the frontend
  // only adapts the response into chart-friendly points.
  const provider = configuration.sourceId === 'nasa-power' ? 'nasa-power' : 'demo'
  const geographicError = validateGeographicSelection(provider, bounds)
  if (geographicError) throw new Error(geographicError)
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

  const pointMap = new Map<string, Record<string, string | number | null>>()
  response.results.forEach((result) => result.series.forEach((observation) => {
    const current = pointMap.get(observation.date) ?? { date: observation.date }
    current[result.variable.id] = observation.value
    pointMap.set(observation.date, current)
  }))

  return {
    points: [...pointMap.values()] as TimeSeriesDataset['points'],
    sourceId: configuration.sourceId,
    isDemonstration: provider === 'demo',
    missingValueCount: response.results.reduce((total, result) => total + result.series.filter((item) => item.value === null).length, 0),
    results: response.results,
    sourceUrl: response.source_url,
  }
}

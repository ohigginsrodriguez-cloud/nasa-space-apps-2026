import type { BackendResult, TimeSeriesPoint } from '../types'

/** Annual totals are plotted as monthly equivalents, never against a different scale. */
export function variableChartPoints(points: TimeSeriesPoint[], result: BackendResult): TimeSeriesPoint[] {
  const id = result.variable.id
  const divisor = result.variable.aggregation === 'sum' ? 12 : 1
  return [...points].sort((a, b) => a.date.localeCompare(b.date)).map((point) => {
    const trend = point[`trend_${id}`]
    const band = point[`band_${id}`]
    return {
      ...point,
      [`trend_${id}`]: typeof trend === 'number' ? trend / divisor : null,
      [`band_${id}`]: Array.isArray(band) ? [band[0] / divisor, band[1] / divisor] as [number, number] : null,
    }
  })
}

export function zoomPoints(points: TimeSeriesPoint[], start: string, end: string): TimeSeriesPoint[] {
  return points.filter((point) => (!start || point.date.slice(0, 7) >= start)
    && (!end || point.date.slice(0, 7) <= end))
}

/** Returns a centered temporal window. Level 0 is the complete series. */
export function centeredZoomPoints(points: TimeSeriesPoint[], level: number): TimeSeriesPoint[] {
  if (level <= 0 || points.length < 2) return points
  const ordered = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const windowSize = Math.max(12, Math.ceil(ordered.length / (1.5 ** level)))
  if (windowSize >= ordered.length) return ordered
  const start = Math.max(0, Math.floor((ordered.length - windowSize) / 2))
  return ordered.slice(start, start + windowSize)
}

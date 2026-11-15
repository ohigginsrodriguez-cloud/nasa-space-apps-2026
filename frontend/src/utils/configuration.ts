import type { DataConfiguration, GeographicBounds, GeographicPoint, TimeRange } from '../types'

export function validateTimeRange(range: TimeRange): string | null {
  if (!range.startDate || !range.endDate) return 'Indica una fecha inicial y una fecha final.'
  const isValidDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }
  if (!isValidDate(range.startDate) || !isValidDate(range.endDate)) return 'Introduce fechas válidas.'
  const latestCompleteMonth = new Date()
  latestCompleteMonth.setUTCDate(1)
  latestCompleteMonth.setUTCMonth(latestCompleteMonth.getUTCMonth() - 1)
  const latestCompleteMonthEnd = new Date(Date.UTC(
    latestCompleteMonth.getUTCFullYear(),
    latestCompleteMonth.getUTCMonth() + 1,
    0,
  )).toISOString().slice(0, 10)
  if (range.endDate > latestCompleteMonthEnd) {
    return `La fecha final no puede superar el último mes completo (${latestCompleteMonthEnd}).`
  }
  if (range.startDate > latestCompleteMonthEnd || range.startDate > range.endDate) {
    return 'El periodo seleccionado no contiene meses completos válidos.'
  }
  if (range.startDate > range.endDate) return 'La fecha final debe ser igual o posterior a la inicial.'
  return null
}

/**
 * Validates the geographic selection for a given data source.
 *
 * Returns a Spanish user-facing error string when the selection is invalid,
 * or null when it is acceptable.
 *
 * Rules for nasa-power:
 *  - Rectangles must span 2°–10° on each axis for NASA POWER.
 *  - Coordinates must be finite and within geographic limits.
 *  - No selection (null, null) is valid — the backend will use the region's
 *    default coordinates.
 */
export function validateGeographicSelection(
  sourceId: string,
  bounds: GeographicBounds | null,
  point: GeographicPoint | null,
): string | null {
  if (point !== null) {
    return Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
      && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180
      ? null : 'Punto inválido: latitud entre −90 y 90 y longitud entre −180 y 180.'
  }
  if (bounds === null) return null
  if (!Object.values(bounds).every(Number.isFinite)
    || Math.abs(bounds.south) > 90 || Math.abs(bounds.north) > 90
    || Math.abs(bounds.west) > 180 || Math.abs(bounds.east) > 180) {
    return 'Coordenadas inválidas: latitudes entre −90 y 90 y longitudes entre −180 y 180.'
  }
  if (bounds.south >= bounds.north || bounds.west >= bounds.east) {
    return 'Sur debe ser menor que norte y oeste menor que este; no cruces el antimeridiano.'
  }

  if (sourceId === 'nasa-power') {
    const latSpan = bounds.north - bounds.south
    const lonSpan = bounds.east - bounds.west
    if (latSpan < 2 || lonSpan < 2) {
      return (
        'El área seleccionada es demasiado pequeña para NASA POWER. ' +
        'Necesita al menos 2° de alto y 2° de ancho. ' +
        'Amplía el rectángulo o cambia a modo "Seleccionar punto".'
      )
    }
    if (latSpan > 10 || lonSpan > 10) {
      return 'El área es demasiado grande para NASA POWER. Reduce el rectángulo: cada lado debe medir entre 2° y 10°.'
    }
  }

  return null
}

export function validateConfiguration(configuration: DataConfiguration): string | null {
  const timeError = validateTimeRange(configuration.timeRange)
  if (timeError) return timeError
  if (!configuration.variableIds.length) return 'Selecciona al menos una variable para continuar.'
  return null
}

export function sameConfiguration(left: DataConfiguration, right: DataConfiguration | null): boolean {
  return right !== null && left.sourceId === right.sourceId
    && left.regionId === right.regionId
    && left.timeRange.startDate === right.timeRange.startDate
    && left.timeRange.endDate === right.timeRange.endDate
    && left.timeRange.interval === right.timeRange.interval
    && left.variableIds.length === right.variableIds.length
    && left.variableIds.every((id) => right.variableIds.includes(id))
}

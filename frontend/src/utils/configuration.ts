import type { DataConfiguration, GeographicBounds, TimeRange } from '../types'

export function validateTimeRange(range: TimeRange): string | null {
  if (!range.startDate || !range.endDate) return 'Indica una fecha inicial y una fecha final.'
  const isValidDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }
  if (!isValidDate(range.startDate) || !isValidDate(range.endDate)) return 'Introduce fechas válidas.'
  if (range.startDate > range.endDate) return 'La fecha final debe ser igual o posterior a la inicial.'
  return null
}

export function validateConfiguration(configuration: DataConfiguration): string | null {
  const timeError = validateTimeRange(configuration.timeRange)
  if (timeError) return timeError
  if (!configuration.variableIds.length) return 'Selecciona al menos una variable para continuar.'
  return null
}

export function validateGeographicSelection(sourceId: string, bounds: GeographicBounds | null): string | null {
  if (sourceId !== 'nasa-power' || !bounds) return null
  const latitudeSpan = bounds.north - bounds.south
  const longitudeSpan = bounds.east - bounds.west
  if (latitudeSpan < 2 || longitudeSpan < 2) {
    return 'NASA POWER necesita un rectángulo de al menos 2° de alto y 2° de ancho. Selecciona un punto o amplía el área.'
  }
  if (latitudeSpan > 10 || longitudeSpan > 10) {
    return 'NASA POWER permite rectángulos de hasta 10° de alto y 10° de ancho. Divide el área o selecciona un punto.'
  }
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

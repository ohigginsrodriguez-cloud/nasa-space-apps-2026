import { dataSources } from '../data/mockData'
import type { DataConfiguration, TimeRange } from '../types'

export function validateTimeRange(range: TimeRange): string | null {
  if (!range.startDate || !range.endDate) return 'Indica una fecha inicial y una fecha final.'
  const isValidDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }
  if (!isValidDate(range.startDate) || !isValidDate(range.endDate)) return 'Introduce fechas válidas.'
  if (range.startDate < '2001-01-01' || range.endDate > '2025-12-01') return 'La demo solo tiene datos entre enero de 2001 y diciembre de 2025.'
  if (range.startDate > range.endDate) return 'La fecha final debe ser igual o posterior a la inicial.'
  return null
}

export function validateConfiguration(configuration: DataConfiguration): string | null {
  const timeError = validateTimeRange(configuration.timeRange)
  if (timeError) return timeError
  if (!configuration.variableIds.length) return 'Selecciona al menos una variable para continuar.'
  if (!dataSources.some((source) => source.id === configuration.sourceId && source.available)) return 'Selecciona el dataset de demostración para continuar.'
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

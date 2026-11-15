import type { DataConfiguration, GeographicBounds, GeographicPoint, TimeRange } from '../types'

export function validateTimeRange(range: TimeRange): string | null {
  if (!range.startDate || !range.endDate) return 'Enter a start date and an end date.'
  const isValidDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }
  if (!isValidDate(range.startDate) || !isValidDate(range.endDate)) return 'Enter valid dates.'
  const latestCompleteMonthEnd = getLatestCompleteMonthEnd()
  if (range.endDate > latestCompleteMonthEnd) {
    return `The end date cannot exceed the last complete month (${latestCompleteMonthEnd}).`
  }
  if (range.startDate > latestCompleteMonthEnd || range.startDate > range.endDate) {
    return 'The selected period does not contain valid complete months.'
  }
  return null
}

export function getLatestCompleteMonthEnd(now = new Date()): string {
  const latestCompleteMonth = new Date(now)
  latestCompleteMonth.setUTCDate(1)
  latestCompleteMonth.setUTCMonth(latestCompleteMonth.getUTCMonth() - 1)
  return new Date(Date.UTC(
    latestCompleteMonth.getUTCFullYear(),
    latestCompleteMonth.getUTCMonth() + 1,
    0,
  )).toISOString().slice(0, 10)
}

/**
 * Validates the geographic selection for a given data source.
 *
 * Returns an English user-facing error string when the selection is invalid,
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
      ? null : 'Invalid point: latitude must be between −90 and 90 and longitude between −180 and 180.'
  }
  if (bounds === null) return null
  if (!Object.values(bounds).every(Number.isFinite)
    || Math.abs(bounds.south) > 90 || Math.abs(bounds.north) > 90
    || Math.abs(bounds.west) > 180 || Math.abs(bounds.east) > 180) {
    return 'Invalid coordinates: latitudes must be between −90 and 90 and longitudes between −180 and 180.'
  }
  if (bounds.south >= bounds.north || bounds.west >= bounds.east) {
    return 'South must be less than north and west less than east; rectangles cannot cross the antimeridian.'
  }

  if (sourceId === 'nasa-power') {
    const latSpan = bounds.north - bounds.south
    const lonSpan = bounds.east - bounds.west
    if (latSpan < 2 || lonSpan < 2) {
      return (
        'The selected area is too small for NASA POWER. ' +
        'It must be at least 2° high and 2° wide. ' +
        'Choose a larger rectangle size.'
      )
    }
    if (latSpan > 10 || lonSpan > 10) {
      return 'The area is too large for NASA POWER. Reduce the rectangle: each side must measure between 2° and 10°.'
    }
  }

  return null
}

export function validateConfiguration(configuration: DataConfiguration): string | null {
  const timeError = validateTimeRange(configuration.timeRange)
  if (timeError) return timeError
  if (!configuration.variableIds.length) return 'Select at least one variable to continue.'
  if (configuration.variableIds.length > 7) return 'Select no more than seven variables.'
  if (configuration.sourceId === 'nasa-power' && configuration.timeRange.startDate < '1981-01-01') {
    return 'NASA POWER monthly data begins in January 1981. Choose a later start date.'
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

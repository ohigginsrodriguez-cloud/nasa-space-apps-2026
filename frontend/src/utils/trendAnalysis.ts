import type { TimeSeriesPoint, VariableId } from '../types'

export interface TrendAnalysis {
  observationYears: number
  slopePerYear: number
  changePerDecade: number
  confidenceInterval: [number, number]
  pValue: number
  significant: boolean
  intercept: number
  baseYear: number
  rSquared: number
  tStatistic: number
  degreesOfFreedom: number
}

function logGamma(value: number): number {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7]
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value)
  const adjusted = value - 1
  let series = 0.9999999999998099
  coefficients.forEach((coefficient, index) => { series += coefficient / (adjusted + index + 1) })
  const base = adjusted + coefficients.length - 0.5
  return 0.5 * Math.log(2 * Math.PI) + (adjusted + 0.5) * Math.log(base) - base + Math.log(series)
}

function betaFraction(a: number, b: number, x: number): number {
  const maxIterations = 200
  const epsilon = 3e-14
  const floor = 1e-300
  const sum = a + b
  const aPlus = a + 1
  const aMinus = a - 1
  let c = 1
  let d = 1 - sum * x / aPlus
  if (Math.abs(d) < floor) d = floor
  d = 1 / d
  let result = d

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const even = iteration * (b - iteration) * x / ((aMinus + 2 * iteration) * (a + 2 * iteration))
    d = 1 + even * d
    if (Math.abs(d) < floor) d = floor
    c = 1 + even / c
    if (Math.abs(c) < floor) c = floor
    d = 1 / d
    result *= d * c

    const odd = -(a + iteration) * (sum + iteration) * x / ((a + 2 * iteration) * (aPlus + 2 * iteration))
    d = 1 + odd * d
    if (Math.abs(d) < floor) d = floor
    c = 1 + odd / c
    if (Math.abs(c) < floor) c = floor
    d = 1 / d
    const delta = d * c
    result *= delta
    if (Math.abs(delta - 1) < epsilon) break
  }
  return result
}

function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const factor = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x))
  if (x < (a + 1) / (a + b + 2)) return factor * betaFraction(a, b, x) / a
  return 1 - factor * betaFraction(b, a, 1 - x) / b
}

function twoSidedStudentP(tStatistic: number, degreesOfFreedom: number): number {
  const x = degreesOfFreedom / (degreesOfFreedom + tStatistic * tStatistic)
  return regularizedBeta(x, degreesOfFreedom / 2, 0.5)
}

function criticalT(degreesOfFreedom: number, alpha: number): number {
  let lower = 0
  let upper = 50
  for (let iteration = 0; iteration < 80; iteration += 1) {
    const middle = (lower + upper) / 2
    if (twoSidedStudentP(middle, degreesOfFreedom) > alpha) lower = middle
    else upper = middle
  }
  return (lower + upper) / 2
}

export function analyzeTrend(points: TimeSeriesPoint[], variableId: VariableId, alpha = 0.05): TrendAnalysis | null {
  const annualTotals = new Map<number, { sum: number; count: number }>()
  points.forEach((point) => {
    const year = Number(point.date.slice(0, 4))
    const current = annualTotals.get(year) ?? { sum: 0, count: 0 }
    current.sum += point[variableId]
    current.count += 1
    annualTotals.set(year, current)
  })

  const annual = [...annualTotals.entries()]
    .filter(([, values]) => values.count === 12)
    .map(([year, values]) => ({ year, value: values.sum / values.count }))
    .sort((left, right) => left.year - right.year)
  if (annual.length < 3) return null

  const baseYear = annual[0].year
  const meanYear = annual.reduce((sum, item) => sum + item.year - baseYear, 0) / annual.length
  const meanValue = annual.reduce((sum, item) => sum + item.value, 0) / annual.length
  const sumSquares = annual.reduce((sum, item) => sum + (item.year - baseYear - meanYear) ** 2, 0)
  const slope = annual.reduce((sum, item) => sum + (item.year - baseYear - meanYear) * (item.value - meanValue), 0) / sumSquares
  const intercept = meanValue - slope * meanYear
  const residualSumSquares = annual.reduce((sum, item) => sum + (item.value - (intercept + slope * (item.year - baseYear))) ** 2, 0)
  const standardError = Math.sqrt((residualSumSquares / (annual.length - 2)) / sumSquares)
  const degreesOfFreedom = annual.length - 2
  const tStatistic = standardError === 0 ? (slope === 0 ? 0 : Math.sign(slope) * Number.POSITIVE_INFINITY) : slope / standardError
  const pValue = twoSidedStudentP(tStatistic, degreesOfFreedom)
  const margin = criticalT(degreesOfFreedom, alpha) * standardError
  const totalSumSquares = annual.reduce((sum, item) => sum + (item.value - meanValue) ** 2, 0)

  return {
    observationYears: annual.length,
    slopePerYear: slope,
    changePerDecade: slope * 10,
    confidenceInterval: [(slope - margin) * 10, (slope + margin) * 10],
    pValue,
    significant: pValue < alpha,
    intercept,
    baseYear,
    rSquared: totalSumSquares === 0 ? 1 : 1 - residualSumSquares / totalSumSquares,
    tStatistic,
    degreesOfFreedom,
  }
}

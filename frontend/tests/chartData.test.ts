import assert from 'node:assert/strict'
import { test } from 'node:test'
import { variableChartPoints, zoomPoints } from '../src/utils/chartData.ts'
import type { BackendResult } from '../src/types/index.ts'

test('precipitación: observado mensual intacto; tendencia y banda en la misma escala', () => {
  const result = { variable: { id: 'precipitation', aggregation: 'sum' } } as BackendResult
  const points = [{ date: '2020-02-01', precipitation: 50, trend_precipitation: 1200, band_precipitation: [960, 1440] as [number, number] }]
  const output = variableChartPoints(points, result)
  assert.equal(output[0].precipitation, 50)
  assert.equal(output[0].trend_precipitation, 100)
  assert.deepEqual(output[0].band_precipitation, [80, 120])
  assert.equal(points[0].trend_precipitation, 1200, 'no altera resultados ni exportación')
})

test('zoom inclusivo por mes y sin alterar la serie original', () => {
  const points = ['2020-01-01', '2020-02-01', '2020-03-01'].map((date) => ({ date }))
  assert.deepEqual(zoomPoints(points, '2020-02', '2020-02'), [points[1]])
  assert.deepEqual(zoomPoints(points, '', ''), points)
  assert.deepEqual(zoomPoints(points, '2021-01', ''), [])
})

test('variables de media conservan escala, ordenan fechas y preservan faltantes', () => {
  const result = { variable: { id: 'temperature', aggregation: 'mean' } } as BackendResult
  const output = variableChartPoints([
    { date: '2020-02-01', temperature: null },
    { date: '2020-01-01', temperature: 20, trend_temperature: 21 },
  ], result)
  assert.equal(output[0].trend_temperature, 21)
  assert.equal(output[1].temperature, null)
  assert.equal(output[1].trend_temperature, null)
})

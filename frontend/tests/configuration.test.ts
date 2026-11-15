import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getLatestCompleteMonthEnd, validateGeographicSelection, validateTimeRange } from '../src/utils/configuration.ts'

const bounds = (height: number, width: number) => ({ south: 0, north: height, west: 0, east: width })

test('el rango temporal se limita al último mes completo', () => {
  assert.equal(getLatestCompleteMonthEnd(new Date('2026-11-14T12:00:00Z')), '2026-10-31')
  assert.equal(validateTimeRange({
    startDate: '2020-01-01',
    endDate: '2026-10-31',
    interval: 'monthly',
  }), null)
  assert.match(validateTimeRange({
    startDate: '2020-01-01',
    endDate: '2026-11-01',
    interval: 'monthly',
  }) ?? '', /last complete month/)
})

test('NASA POWER admite los límites inclusivos de 2° y 10°', () => {
  for (const size of [2, 5, 10]) {
    assert.equal(validateGeographicSelection('nasa-power', bounds(size, size), null), null)
  }
})

test('bloquea cada eje demasiado pequeño o demasiado grande', () => {
  for (const [height, width] of [[1.99, 5], [5, 1.99], [10.01, 5], [5, 10.01], [180, 360]]) {
    assert.ok(validateGeographicSelection('nasa-power', bounds(height, width), null))
  }
})

test('valida coordenadas, orden y valores no finitos también en demo', () => {
  for (const source of ['nasa-power', 'local-demo']) {
    for (const area of [bounds(0, 5), bounds(-5, 5), bounds(91, 5), bounds(5, 181), bounds(NaN, 5), bounds(5, Infinity)]) {
      assert.ok(validateGeographicSelection(source, area, null))
    }
    assert.ok(validateGeographicSelection(source, null, { latitude: 91, longitude: 0 }))
  }
})

test('puntos y regiones predefinidas válidos; demo no tiene límite POWER', () => {
  assert.equal(validateGeographicSelection('nasa-power', null, null), null)
  assert.equal(validateGeographicSelection('nasa-power', null, { latitude: 30, longitude: -110 }), null)
  assert.equal(validateGeographicSelection('local-demo', bounds(30, 30), null), null)
})

test('validation errors exposed to English UI are in English', () => {
  assert.match(validateGeographicSelection('nasa-power', bounds(1, 5), null)!, /at least 2° high/)
  assert.match(validateGeographicSelection('nasa-power', bounds(-1, 5), null)!, /South must be less/)
})

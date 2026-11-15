import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatApiError } from '../src/utils/apiErrors.ts'
import { validateConfiguration } from '../src/utils/configuration.ts'
import { defaultConfiguration, regions, variables, demoExamples } from '../src/data/mockData.ts'

test('muestra el detalle de FastAPI en vez de [object Object]', () => {
  assert.match(formatApiError({ detail: [{ loc: ['body', 'variable_ids'], type: 'too_long' }] }, 422), /seven/)
  assert.equal(formatApiError({ detail: [{ loc: ['body', 'start_date'], msg: 'Invalid date' }] }, 422), 'start_date: Invalid date')
  assert.equal(formatApiError({ detail: { message: 'Variable no disponible' } }, 422), 'Variable no disponible')
  assert.equal(formatApiError({ detail: 'Área demasiado grande' }, 422), 'Área demasiado grande')
  assert.match(formatApiError(null, 502), /502/)
})

test('acepta siete variables y rechaza fechas fuera del rango POWER', () => {
  const config = { ...defaultConfiguration, variableIds: variables.map((variable) => variable.id) }
  assert.equal(validateConfiguration(config), null)
  assert.match(validateConfiguration({ ...config, timeRange: { ...config.timeRange, startDate: '1980-01-01' } })!, /1981/)
  assert.ok(validateConfiguration({ ...config, timeRange: { ...config.timeRange, endDate: '1990-01-01' } }))
})

test('regiones y ejemplos apuntan únicamente al catálogo mexicano', () => {
  assert.deepEqual(regions.map((region) => region.id), [
    'sonoran-desert', 'lacandon-jungle', 'tabasco-wetlands', 'valley-of-mexico',
  ])
  for (const example of demoExamples) {
    assert.ok(regions.some((region) => region.id === example.regionId))
    assert.equal(validateConfiguration({ ...defaultConfiguration, ...example }), null)
    assert.equal(example.timeRange.startDate, '1991-01-01')
    assert.equal(example.timeRange.endDate, '2023-12-31')
  }
})

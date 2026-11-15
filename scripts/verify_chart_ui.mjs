// Requires Playwright + Chromium; servers must be running on 5173 / 8000.
// PLAYWRIGHT_MODULE can point to an external installation's index.mjs.
import assert from 'node:assert/strict'
import { isAbsolute, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const configuredModule = process.env.PLAYWRIGHT_MODULE
const playwrightModule = configuredModule
  ? pathToFileURL(isAbsolute(configuredModule) ? configuredModule : resolve(process.cwd(), configuredModule)).href
  : 'playwright'
const { chromium } = await import(playwrightModule)
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://localhost:5173')
  await page.locator('#variable-picker').waitFor()
  for (const variableId of ['temperature', 'precipitation', 'soil_moisture', 'relative_humidity', 'solar_radiation', 'surface_pressure', 'wind_speed']) {
    await page.locator('#variable-picker').selectOption(variableId)
  }
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.locator('input[type=date]').nth(0).fill('1991-01-01')
  await page.locator('input[type=date]').nth(1).fill('2023-12-31')
  const response = page.waitForResponse((res) => res.url().endsWith('/api/v1/analysis'), { timeout: 180000 })
  await page.getByRole('button', { name: 'Generate series and analyze' }).click()
  assert.equal((await response).status(), 200)
  await page.getByText('Choose visible series', { exact: true }).click()
  await page.getByRole('button', { name: 'Hide Air temperature', exact: true }).waitFor()
  const panels = page.locator('article[aria-label^="Panel for"]')
  assert.equal(await panels.count(), 7)
  assert.equal(await panels.locator('.recharts-surface').count(), 7)
  await page.getByRole('button', { name: 'Hide Air temperature', exact: true }).click()
  assert.equal(await panels.count(), 6)
  await page.getByRole('button', { name: 'Show Air temperature', exact: true }).click()
  assert.equal(await panels.count(), 7)
  const zoomIn = page.getByRole('button', { name: 'Zoom in' })
  assert.equal(await zoomIn.count(), 7)
  await zoomIn.first().click()
  assert.equal(await page.getByText('1.5×', { exact: true }).count(), 7)
  const chartBox = await panels.first().locator('.recharts-surface').boundingBox()
  assert.ok(chartBox)
  await page.mouse.move(chartBox.x + chartBox.width * 0.6, chartBox.y + chartBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(chartBox.x + chartBox.width * 0.35, chartBox.y + chartBox.height / 2, { steps: 8 })
  await page.mouse.up()
  await page.getByRole('button', { name: 'Reset', exact: true }).first().click()
  assert.equal(await page.getByText('1×', { exact: true }).count(), 7)
  await page.getByLabel('Chart view').selectOption('combined')
  await page.getByRole('article', { name: 'Combined variable chart' }).waitFor()
  await page.getByText('Explore relationships between selected variables', { exact: true }).click()
  await page.getByText(/variables were analyzed together:/).waitFor()
  assert.doesNotMatch(await page.locator('body').innerText(), /Temperatura del aire|Área personalizada|Humedad del suelo|Autocorrelación|Se analizaron|Coincidencia de tendencias|Observado:|Unidad:/)
  await page.getByLabel('Chart view').selectOption('separate')
  while (await page.getByRole('button', { name: /^Hide / }).count()) {
    await page.getByRole('button', { name: /^Hide / }).first().click()
  }
  assert.equal(await panels.count(), 0)
  await page.getByText('All variables are hidden.', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Show all', exact: true }).click()
  assert.equal(await panels.count(), 7)
  await page.setViewportSize({ width: 390, height: 844 })
  await panels.first().scrollIntoViewIfNeeded()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await page.getByText('Go further: does the trend differ between regions?', { exact: true }).click()
  const comparison = page.waitForResponse((res) => res.url().endsWith('/api/v1/analysis/compare'), { timeout: 180000 })
  await page.getByRole('button', { name: 'Run comparison', exact: true }).click()
  const comparisonResponse = await comparison
  assert.equal(comparisonResponse.status(), 200)
  assert.doesNotMatch(JSON.stringify(await comparisonResponse.json()), /Temperatura del aire|Se requieren|Tendencias opuestas|presenta direcciones/)
  await page.getByRole('button', { name: 'Run comparison', exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  assert.deepEqual(errors, [])
  console.log('PASS: siete paneles, ocultar/mostrar, zoom/restablecer, estado vacío, móvil y sin errores JS; API real HTTP 200.')
} finally {
  await browser.close()
}

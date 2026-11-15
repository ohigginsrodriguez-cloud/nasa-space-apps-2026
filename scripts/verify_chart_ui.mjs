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
  await page.getByRole('button', { name: 'Choose a NASA POWER variable' }).click()
  const variables = page.getByRole('listbox', { name: 'NASA POWER variables' }).getByRole('button').filter({ hasText: /temperature|Precipitation|moisture|humidity|radiation|pressure|Wind speed/i })
  assert.equal(await variables.count(), 7)
  for (const variable of await variables.all()) await variable.click()
  await page.getByText('Which Earth system variable should we investigate?', { exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.locator('#region-title').waitFor()
  const map = page.locator('#region .leaflet-container')
  await map.waitFor()
  const mapZoomIn = map.getByRole('button', { name: 'Zoom in' })
  await mapZoomIn.click()
  await mapZoomIn.click()
  // Let Leaflet finish its zoom animation before measuring the projected bounds.
  await page.waitForTimeout(700)
  const rectangle = page.locator('#region .leaflet-interactive').first()
  const zoomedWidth = (await rectangle.boundingBox())?.width
  assert.ok(zoomedWidth && zoomedWidth > 20, 'the rectangle should be visible at the selected zoom')
  const rectangleBox = await rectangle.boundingBox()
  assert.ok(rectangleBox)
  const centerX = rectangleBox.x + rectangleBox.width / 2
  const centerY = rectangleBox.y + rectangleBox.height / 2
  await page.mouse.move(centerX - 15, centerY - 15)
  const afterHover = await rectangle.boundingBox()
  assert.ok(afterHover)
  assert.ok(Math.abs(afterHover.x - rectangleBox.x) < 2, 'hovering over the area must not reset or move it')
  await page.mouse.click(centerX, centerY)
  const afterClick = await rectangle.boundingBox()
  assert.ok(afterClick)
  assert.ok(Math.abs(afterClick.x - rectangleBox.x) < 2, 'a click without dragging must not reset or move the selected area')
  await page.mouse.move(rectangleBox.x + rectangleBox.width * 0.2, centerY)
  await page.mouse.down()
  // Cross the center handle while holding the mouse: the rectangle must keep moving.
  await page.mouse.move(rectangleBox.x + rectangleBox.width * 0.8, centerY + 25, { steps: 8 })
  await page.mouse.up()
  const movedWidth = (await rectangle.boundingBox())?.width
  const movedRectangleBox = await rectangle.boundingBox()
  assert.ok(movedWidth)
  assert.ok(movedRectangleBox)
  assert.ok(Math.abs(movedWidth - zoomedWidth) < 2, `moving area should preserve zoom (before ${zoomedWidth}px, after ${movedWidth}px)`)
  assert.ok(Math.abs(movedRectangleBox.x - rectangleBox.x) > 10, 'dragging the rectangle surface should change the selected region')
  assert.match(await page.locator('#region [role=status]').innerText(), /Area moved/)
  const handle = page.locator('#region .rectangle-drag-handle')
  const handleBox = await handle.boundingBox()
  assert.ok(handleBox)
  const centerBeforeResize = await handle.evaluate((element) => {
    const style = element.getAttribute('style') ?? ''
    return style.match(/left: ([\d.]+)px; top: ([\d.]+)px/)?.slice(1, 3).map(Number)
  })
  assert.ok(centerBeforeResize)
  const widthBeforeResize = (await rectangle.boundingBox())?.width
  assert.ok(widthBeforeResize)
  await page.getByRole('button', { name: '4° × 4°', exact: true }).click()
  await page.getByText('4.00° wide × 4.00° high', { exact: true }).waitFor()
  const centerAfterResize = await handle.evaluate((element) => {
    const style = element.getAttribute('style') ?? ''
    return style.match(/left: ([\d.]+)px; top: ([\d.]+)px/)?.slice(1, 3).map(Number)
  })
  assert.ok(centerAfterResize)
  assert.ok(Math.abs(centerAfterResize[0] - centerBeforeResize[0]) < 1, 'resizing must keep the moved rectangle center')
  assert.ok(Math.abs(centerAfterResize[1] - centerBeforeResize[1]) < 1, 'resizing must keep the moved rectangle center')
  const widthAfterResize = (await rectangle.boundingBox())?.width
  assert.ok(widthAfterResize && widthAfterResize < widthBeforeResize, 'the selected rectangle size must change')
  assert.match(await page.locator('#region [role=status]').innerText(), /4° × 4° area applied/)

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 30, handleBox.y + handleBox.height / 2, { steps: 4 })
  await page.mouse.up()
  assert.match(await page.locator('#region [role=status]').innerText(), /Area moved/)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.locator('input[type=date]').nth(0).waitFor()
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
  console.log('PASS: el rectángulo y su control azul se mueven; el zoom persiste; siete paneles, controles, móvil, sin errores JS y API real HTTP 200.')
} finally {
  await browser.close()
}

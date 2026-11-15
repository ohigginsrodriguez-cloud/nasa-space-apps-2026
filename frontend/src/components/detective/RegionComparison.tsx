import { useState } from 'react'
import { GitCompare, LoaderCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { variables } from '../../data/mockData'
import { runRegionComparison } from '../../services/api'
import type { GeographicBounds, SpatialInterpretation, TimeSeriesDataset, VariableId } from '../../types'
import { getLatestCompleteMonthEnd, validateConfiguration, validateGeographicSelection } from '../../utils/configuration'
import { centeredZoomPoints, variableChartPoints } from '../../utils/chartData'
import { ChartZoomControls } from '../charts/ChartZoomControls'
import { MapSelector } from '../geography/MapSelector'

const INITIAL_CENTER_A: [number, number] = [23.5, -102]
const INITIAL_CENTER_B: [number, number] = [18, -92]

const shortDate = new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const formatDate = (date: string) => shortDate.format(new Date(`${date}T00:00:00Z`))
const formatValue = (value: number | null | undefined, digits = 2) => (value === null || value === undefined ? '—' : new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(value))
const formatBounds = (bounds: GeographicBounds) =>
  `Lat ${bounds.south.toFixed(2)}° to ${bounds.north.toFixed(2)}°, lon ${bounds.west.toFixed(2)}° to ${bounds.east.toFixed(2)}°`

export function RegionComparison() {
  const [variableId, setVariableId] = useState<VariableId>('precipitation')
  const [boundsA, setBoundsA] = useState<GeographicBounds | null>(null)
  const [boundsB, setBoundsB] = useState<GeographicBounds | null>(null)
  const [nameA, setNameA] = useState('')
  const [nameB, setNameB] = useState('')
  const [mapErrorA, setMapErrorA] = useState<string | null>(null)
  const [mapErrorB, setMapErrorB] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('1995-01-01')
  const [endDate, setEndDate] = useState('2023-12-01')
  const maxDate = getLatestCompleteMonthEnd()
  const [sourceId, setSourceId] = useState('nasa-power')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [datasetA, setDatasetA] = useState<TimeSeriesDataset | null>(null)
  const [datasetB, setDatasetB] = useState<TimeSeriesDataset | null>(null)
  const [spatialInterpretation, setSpatialInterpretation] = useState<SpatialInterpretation | null>(null)
  const [zoomLevel, setZoomLevel] = useState(0)

  const selectedVar = variables.find((v) => v.id === variableId) ?? variables[0]
  const regionA = { name: datasetA?.region?.name ?? 'Area A' }
  const regionB = { name: datasetB?.region?.name ?? 'Area B' }
  const configurationKey = JSON.stringify([variableId, boundsA, boundsB, nameA, nameB, startDate, endDate, sourceId])
  const [resultKey, setResultKey] = useState<string | null>(null)
  const hasCurrentResults = resultKey === configurationKey
  const validationError = !boundsA || !boundsB ? 'Select two areas to compare.'
    : mapErrorA ?? mapErrorB
    ?? validateGeographicSelection(sourceId, boundsA, null)
    ?? validateGeographicSelection(sourceId, boundsB, null)
    ?? (['south', 'north', 'west', 'east'].every((key) => boundsA[key as keyof GeographicBounds] === boundsB[key as keyof GeographicBounds])
      ? 'Choose two different areas to compare.' : null)
    ?? validateConfiguration({
      variableIds: [variableId], regionId: 'sonoran-desert', sourceId,
      timeRange: { startDate, endDate, interval: 'monthly' },
    })

  async function handleCompare() {
    if (validationError || !boundsA || !boundsB) return
    setLoading(true)
    setError(null)
    try {
      const comparison = await runRegionComparison(
        variableId,
        [boundsA, boundsB],
        startDate,
        endDate,
        sourceId,
        [nameA, nameB],
      )
      setDatasetA(comparison.datasets[0])
      setDatasetB(comparison.datasets[1])
      setSpatialInterpretation(comparison.interpretation)
      setZoomLevel(0)
      setResultKey(configurationKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const resultA = hasCurrentResults ? datasetA?.results.find((r) => r.variable.id === variableId) : undefined
  const resultB = hasCurrentResults ? datasetB?.results.find((r) => r.variable.id === variableId) : undefined

  const slopeA = resultA?.trend.change_per_decade
  const slopeB = resultB?.trend.change_per_decade
  return (
    <div className="surface-panel space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/20">
            <GitCompare size={20} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              Bi-regional comparison mode
              <span className="rounded-full border border-accent/20 bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                NASA challenge: contrasting responses
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-muted">Define two study areas on the maps and compare the same variable over the same period.</p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading || validationError !== null}
          onClick={() => void handleCompare()}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow-md disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={14} className="animate-spin" /> : <GitCompare size={14} />}
          <span>{loading ? 'Querying data…' : 'Run comparison'}</span>
        </button>
      </div>

      {/* Selectores de comparación */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
        <div>
          <label className="block font-medium text-muted mb-1">Variable</label>
          <select
            value={variableId}
            onChange={(e) => setVariableId(e.target.value as VariableId)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-medium text-ink transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
          >
            {variables.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.unit})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-muted mb-1">Period (start / end)</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              max={maxDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="YYYY-MM-DD"
             className="w-1/2 rounded-lg border border-line bg-surface px-1.5 py-1.5 font-mono text-[11px] text-ink transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <span className="text-muted">-</span>
            <input
              type="date"
              value={endDate}
              max={maxDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="YYYY-MM-DD"
               className="w-1/2 rounded-lg border border-line bg-surface px-1.5 py-1.5 font-mono text-[11px] text-ink transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-muted mb-1">Data source</label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink font-medium focus:border-accent"
          >
            <option value="nasa-power">NASA POWER (Real)</option>
            <option value="local-demo">Synthetic demo</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MapSelector id="comparison-area-a" title="Define area A" center={INITIAL_CENTER_A}
          value={boundsA} onChange={setBoundsA} onValidationChange={setMapErrorA} areaName={nameA} onAreaNameChange={setNameA} />
        <MapSelector id="comparison-area-b" title="Define area B" center={INITIAL_CENTER_B}
          value={boundsB} onChange={setBoundsB} onValidationChange={setMapErrorB} areaName={nameB} onAreaNameChange={setNameB} />
      </div>

      {validationError && <p role="alert" className="text-xs text-red-800">{validationError}</p>}
      {sourceId === 'local-demo' && <p role="status" className="text-sm text-muted">DEMO / SYNTHETIC: these observations are not NASA measurements.</p>}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </p>
      )}

      {/* Banner de Tendencias Opuestas Detectadas */}
      {hasCurrentResults && spatialInterpretation && (
        <div className="rounded-xl border border-signal/30 bg-signal-soft p-4 text-ink shadow-sm">
          <div className="flex items-start gap-2.5">
             <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-signal text-white font-bold text-xs">
              ⚡
            </span>
            <div>
               <h3 className="text-sm font-bold text-ink">{spatialInterpretation.title}</h3>
               <p className="mt-1 text-xs leading-relaxed text-ink">
                {spatialInterpretation.summary}
              </p>
              {spatialInterpretation.regions?.map((item, index) => (
                 <p key={`${item.id}-${index}`} className="mt-1 text-[11px] text-ink">
                   <strong>{item.name}:</strong> {item.direction} · {formatValue(item.change_per_decade)} {selectedVar.unit}/decade ·{' '}
                   {item.significant === true ? 'significant' : item.significant === false ? 'not significant' : 'not evaluable'}
                </p>
              ))}
              {spatialInterpretation.causality_warning && (
                 <p className="mt-2 text-[11px] italic text-muted">{spatialInterpretation.causality_warning}</p>
              )}
            </div>
          </div>
        </div>
      )}

       {variableId === 'precipitation' && <p className="text-sm text-muted">Observed: monthly total. Trend and band: monthly equivalent of the annual fit (÷12). Cards report the change in the annual total.</p>}
      {/* Gráficas comparativas lado a lado */}
      {hasCurrentResults && datasetA && datasetB && (
        <div className="grid gap-5 lg:grid-cols-2 pt-2">
          {/* Tarjeta Región A */}
          <div className="rounded-xl border border-line bg-canvas/55 p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                <h3 className="text-xs font-bold text-ink">{regionA.name} · {selectedVar.name}</h3>
              <span className="flex items-center gap-1 text-xs font-semibold">
                {slopeA !== undefined && slopeA !== null && slopeA > 0 ? (
                   <TrendingUp size={14} className="text-signal" />
                ) : (
                   <TrendingDown size={14} className="text-accent" />
                )}
                {formatValue(slopeA)} {selectedVar.unit}/decade
              </span>
            </div>
              <div className="mb-2 flex flex-wrap items-center gap-3 rounded-md bg-canvas/60 px-2.5 py-2 text-[11px]" aria-label={`Legend for ${regionA.name}`}>
              <strong>Unit: {selectedVar.unit}</strong>
              <span className="text-muted">Solid line: observed · dashed: trend · shaded: 95% CI</span>
              {datasetA.region && <span className="w-full text-muted">{formatBounds(datasetA.region)}</span>}
            </div>
            <div className="flex h-56 w-full items-stretch gap-2">
            <div className="min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart syncId="region-comparison" data={resultA ? variableChartPoints(centeredZoomPoints(datasetA.points, zoomLevel), resultA) : []} margin={{ top: 8, right: 14, bottom: 4, left: 14 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 5" />
                  <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} domain={['auto', 'auto']} label={{ value: selectedVar.unit, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: 'var(--color-muted)' } }} />
                  <Tooltip labelFormatter={(l) => formatDate(String(l))} />
                   <Area dataKey={`band_${variableId}`} stroke="none" fill="var(--color-chart-precipitation)" fillOpacity={0.12} isAnimationActive={false} />
                   <Line dataKey={variableId} stroke="var(--color-chart-precipitation)" strokeWidth={1.3} dot={false} isAnimationActive={false} name={`Observed (${selectedVar.unit})`} />
                   <Line dataKey={`trend_${variableId}`} stroke="var(--color-chart-precipitation)" strokeWidth={2.2} strokeDasharray="5 3" dot={false} isAnimationActive={false} name={`Trend (${selectedVar.unit})`} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <ChartZoomControls level={zoomLevel} onChange={setZoomLevel} label="Comparison zoom controls" />
            </div>
            <div className="mt-2 text-[11px] text-muted flex justify-between border-t border-line/60 pt-2">
              <span>OLS p = {formatValue(resultA?.trend.p_value, 4)} · MK p = {formatValue(resultA?.trend.mann_kendall?.p_value, 4)}</span>
               <span>{resultA?.interpretation?.significant === null ? 'Not evaluable' : resultA?.interpretation?.significant ? '✅ Significant (α=0.05)' : 'Not significant (α=0.05)'}</span>
            </div>
          </div>

          {/* Tarjeta Región B */}
          <div className="rounded-xl border border-line bg-canvas/55 p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                <h3 className="text-xs font-bold text-ink">{regionB.name} · {selectedVar.name}</h3>
              <span className="flex items-center gap-1 text-xs font-semibold">
                {slopeB !== undefined && slopeB !== null && slopeB > 0 ? (
                   <TrendingUp size={14} className="text-signal" />
                ) : (
                   <TrendingDown size={14} className="text-accent" />
                )}
                {formatValue(slopeB)} {selectedVar.unit}/decade
              </span>
            </div>
             <div className="mb-2 flex flex-wrap items-center gap-3 rounded-md bg-canvas/60 px-2.5 py-2 text-[11px]" aria-label={`Legend for ${regionB.name}`}>
              <strong>Unit: {selectedVar.unit}</strong>
              <span className="text-muted">Solid line: observed · dashed: trend · shaded: 95% CI</span>
              {datasetB.region && <span className="w-full text-muted">{formatBounds(datasetB.region)}</span>}
            </div>
            <div className="flex h-56 w-full items-stretch gap-2">
            <div className="min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart syncId="region-comparison" data={resultB ? variableChartPoints(centeredZoomPoints(datasetB.points, zoomLevel), resultB) : []} margin={{ top: 8, right: 14, bottom: 4, left: 14 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 5" />
                  <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-muted)' }} domain={['auto', 'auto']} label={{ value: selectedVar.unit, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: 'var(--color-muted)' } }} />
                  <Tooltip labelFormatter={(l) => formatDate(String(l))} />
                   <Area dataKey={`band_${variableId}`} stroke="none" fill="var(--color-signal)" fillOpacity={0.12} isAnimationActive={false} />
                   <Line dataKey={variableId} stroke="var(--color-signal)" strokeWidth={1.3} dot={false} isAnimationActive={false} name={`Observed (${selectedVar.unit})`} />
                   <Line dataKey={`trend_${variableId}`} stroke="var(--color-signal)" strokeWidth={2.2} strokeDasharray="5 3" dot={false} isAnimationActive={false} name={`Trend (${selectedVar.unit})`} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <ChartZoomControls level={zoomLevel} onChange={setZoomLevel} label="Comparison zoom controls" />
            </div>
            <div className="mt-2 text-[11px] text-muted flex justify-between border-t border-line/60 pt-2">
              <span>OLS p = {formatValue(resultB?.trend.p_value, 4)} · MK p = {formatValue(resultB?.trend.mann_kendall?.p_value, 4)}</span>
               <span>{resultB?.interpretation?.significant === null ? 'Not evaluable' : resultB?.interpretation?.significant ? '✅ Significant (α=0.05)' : 'Not significant (α=0.05)'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

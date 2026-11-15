import { useState } from 'react'
import { GitCompare, LoaderCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { regions, variables } from '../../data/mockData'
import { runRegionComparison } from '../../services/api'
import type { RegionId, SpatialInterpretation, TimeSeriesDataset, VariableId } from '../../types'
import { getLatestCompleteMonthEnd, validateConfiguration } from '../../utils/configuration'
import { centeredZoomPoints, variableChartPoints } from '../../utils/chartData'
import { ChartZoomControls } from '../charts/ChartZoomControls'

const shortDate = new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const formatDate = (date: string) => shortDate.format(new Date(`${date}T00:00:00Z`))
const formatValue = (value: number | null | undefined, digits = 2) => (value === null || value === undefined ? '—' : new Intl.NumberFormat('es', { maximumFractionDigits: digits }).format(value))

export function RegionComparison() {
  const [variableId, setVariableId] = useState<VariableId>('precipitation')
  const [regionAId, setRegionAId] = useState<RegionId>('sonoran-desert')
  const [regionBId, setRegionBId] = useState<RegionId>('lacandon-jungle')
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
  const regionA = regions.find((r) => r.id === regionAId) ?? regions[0]
  const regionB = regions.find((r) => r.id === regionBId) ?? regions[1]
  const configurationKey = JSON.stringify([variableId, regionAId, regionBId, startDate, endDate, sourceId])
  const [resultKey, setResultKey] = useState<string | null>(null)
  const hasCurrentResults = resultKey === configurationKey
  const validationError = regionAId === regionBId
    ? 'Selecciona dos regiones diferentes para comparar.'
    : validateConfiguration({
      variableIds: [variableId], regionId: regionAId, sourceId,
      timeRange: { startDate, endDate, interval: 'monthly' },
    })

  async function handleCompare() {
    if (validationError) return
    setLoading(true)
    setError(null)
    try {
      const comparison = await runRegionComparison(
        variableId,
        [regionAId, regionBId],
        startDate,
        endDate,
        sourceId,
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
              Modo Comparación Bi-Regional
              <span className="rounded-full border border-accent/20 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                Reto NASA: Respuestas Contrastantes
              </span>
            </h2>
            <p className="text-xs text-muted">Contrasta una misma variable en dos regiones de México bajo el mismo periodo temporal. Lacandona y Centla usan puntos representativos; Sonora y Valle de México, rectángulos aproximados.</p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading || validationError !== null}
          onClick={() => void handleCompare()}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow-md disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={14} className="animate-spin" /> : <GitCompare size={14} />}
          <span>{loading ? 'Consultando datos…' : 'Ejecutar Comparación'}</span>
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
          <label className="block font-medium text-muted mb-1">Región A</label>
          <select
            value={regionAId}
            onChange={(e) => setRegionAId(e.target.value as RegionId)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink font-medium focus:border-accent"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-muted mb-1">Región B</label>
          <select
            value={regionBId}
            onChange={(e) => setRegionBId(e.target.value as RegionId)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink font-medium focus:border-accent"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-muted mb-1">Periodo (Inicio / Fin)</label>
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
          <label className="block font-medium text-muted mb-1">Fuente de datos</label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink font-medium focus:border-accent"
          >
            <option value="nasa-power">NASA POWER (Real)</option>
            <option value="local-demo">Demo Sintético</option>
          </select>
        </div>
      </div>

      {validationError && <p role="alert" className="text-xs text-red-800">{validationError}</p>}
      {sourceId === 'local-demo' && <p role="status" className="text-xs text-muted">DEMO / SINTÉTICO: estas observaciones no son mediciones de NASA.</p>}
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
              {spatialInterpretation.regions?.map((item) => (
                 <p key={item.id} className="mt-1 text-[11px] text-ink">
                  <strong>{item.name}:</strong> {item.direction} · {formatValue(item.change_per_decade)} {selectedVar.unit}/década ·{' '}
                  {item.significant === true ? 'significativa' : item.significant === false ? 'no significativa' : 'no evaluable'}
                </p>
              ))}
              {spatialInterpretation.causality_warning && (
                 <p className="mt-2 text-[11px] italic text-muted">{spatialInterpretation.causality_warning}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {variableId === 'precipitation' && <p className="text-xs text-muted">Observado: total mensual. Tendencia y banda: equivalente mensual del ajuste anual (÷12). Las tarjetas reportan el cambio del total anual.</p>}
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
                {formatValue(slopeA)} {selectedVar.unit}/década
              </span>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-3 rounded-md bg-canvas/60 px-2.5 py-2 text-[11px]" aria-label={`Leyenda de ${regionA.name}`}>
              <strong>Unidad: {selectedVar.unit}</strong>
              <span className="text-muted">Línea sólida: observado · discontinua: tendencia · sombreado: IC 95%</span>
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
                   <Line dataKey={variableId} stroke="var(--color-chart-precipitation)" strokeWidth={1.3} dot={false} isAnimationActive={false} name={`Observado (${selectedVar.unit})`} />
                   <Line dataKey={`trend_${variableId}`} stroke="var(--color-chart-precipitation)" strokeWidth={2.2} strokeDasharray="5 3" dot={false} isAnimationActive={false} name={`Tendencia (${selectedVar.unit})`} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <ChartZoomControls level={zoomLevel} onChange={setZoomLevel} label="Controles de zoom de comparación" />
            </div>
            <div className="mt-2 text-[11px] text-muted flex justify-between border-t border-line/60 pt-2">
              <span>OLS p = {formatValue(resultA?.trend.p_value, 4)} · MK p = {formatValue(resultA?.trend.mann_kendall?.p_value, 4)}</span>
              <span>{resultA?.interpretation?.significant === null ? 'No evaluable' : resultA?.interpretation?.significant ? '✅ Significativo (α=0.05)' : 'No significativo (α=0.05)'}</span>
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
                {formatValue(slopeB)} {selectedVar.unit}/década
              </span>
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-3 rounded-md bg-canvas/60 px-2.5 py-2 text-[11px]" aria-label={`Leyenda de ${regionB.name}`}>
              <strong>Unidad: {selectedVar.unit}</strong>
              <span className="text-muted">Línea sólida: observado · discontinua: tendencia · sombreado: IC 95%</span>
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
                   <Line dataKey={variableId} stroke="var(--color-signal)" strokeWidth={1.3} dot={false} isAnimationActive={false} name={`Observado (${selectedVar.unit})`} />
                   <Line dataKey={`trend_${variableId}`} stroke="var(--color-signal)" strokeWidth={2.2} strokeDasharray="5 3" dot={false} isAnimationActive={false} name={`Tendencia (${selectedVar.unit})`} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <ChartZoomControls level={zoomLevel} onChange={setZoomLevel} label="Controles de zoom de comparación" />
            </div>
            <div className="mt-2 text-[11px] text-muted flex justify-between border-t border-line/60 pt-2">
              <span>OLS p = {formatValue(resultB?.trend.p_value, 4)} · MK p = {formatValue(resultB?.trend.mann_kendall?.p_value, 4)}</span>
              <span>{resultB?.interpretation?.significant === null ? 'No evaluable' : resultB?.interpretation?.significant ? '✅ Significativo (α=0.05)' : 'No significativo (α=0.05)'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Download, HelpCircle, Info, Link2, Minus, SlidersHorizontal, XCircle } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps, type TooltipValueType } from 'recharts'
import { regions, variables } from '../../data/mockData'
import type { BackendResult, DataConfiguration, TimeSeriesDataset, TimeSeriesPoint } from '../../types'
import { SectionTitle } from '../common/SectionTitle'
import { ChartZoomControls } from './ChartZoomControls'
import { variableChartPoints, zoomWindowSize, zoomedPoints } from '../../utils/chartData'

interface TimeSeriesChartProps {
  configuration: DataConfiguration | null
  dataset: TimeSeriesDataset | null
  pendingChanges: boolean
}

const shortDate = new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const fullDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const formatDate = (date: string, full = false) => (full ? fullDate : shortDate).format(new Date(`${date}T00:00:00Z`))
const formatValue = (value: number | null | undefined, digits = 2) => (value === null || value === undefined ? '—' : new Intl.NumberFormat('es', { maximumFractionDigits: digits }).format(value))

const colors: Record<string, string> = {
  temperature: 'var(--color-chart-temperature, #FC3D21)',
  precipitation: 'var(--color-chart-precipitation, #0B3D91)',
  soil_moisture: '#1B5E7A',
  relative_humidity: '#5B6770',
  solar_radiation: '#F5A623',
  surface_pressure: '#111111',
  wind_speed: '#7A9E9F',
}

function getVariableColor(id: string): string {
  return colors[id] || '#5B6770'
}

function ChartTooltip({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload?.length || typeof label !== 'string') return null

  return (
    <div className="max-w-72 rounded-lg border border-line bg-surface p-3 text-xs shadow-md">
      <p className="mb-2 font-semibold text-ink border-b border-line pb-1">{formatDate(label, true)}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const key = String(entry.dataKey || '')
          if (key.startsWith('band_lower_') || key.startsWith('band_upper_')) return null
          const isBand = key.startsWith('band_')
          const valDisplay = isBand && Array.isArray(entry.value)
            ? `[${formatValue(entry.value[0])}, ${formatValue(entry.value[1])}]`
            : typeof entry.value === 'number'
            ? formatValue(entry.value)
            : '—'

          return (
            <div key={key} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-muted">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.color || 'var(--color-accent)' }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-medium text-ink">
                {valDisplay} {!isBand && entry.unit ? entry.unit : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartLegend({ variable }: { variable: { name: string; unit: string; id: string } }) {
  const color = getVariableColor(variable.id)
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-canvas/60 px-2.5 py-2 text-[11px]" aria-label={`Leyenda de ${variable.name}`}>
      <span className="font-semibold text-ink">{variable.name}</span>
      <span className="text-muted">Unidad: <strong className="text-ink">{variable.unit}</strong></span>
      <span className="flex items-center gap-1.5 text-muted"><span className="h-0.5 w-5" style={{ backgroundColor: color }} /> Observado</span>
      <span className="flex items-center gap-1.5 text-muted"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: color }} /> Tendencia</span>
      <span className="flex items-center gap-1.5 text-muted"><span className="size-3 rounded-sm opacity-30" style={{ backgroundColor: color }} /> IC 95%</span>
    </div>
  )
}

function TermHelp({ term, explanation }: { term: string; explanation: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ml-1 inline-flex items-center text-muted hover:text-accent focus:outline-none"
        title={`¿Qué significa ${term}?`}
        aria-label={`¿Qué significa ${term}?`}
      >
        <HelpCircle size={13} aria-hidden="true" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-30 mb-1 w-64 -translate-x-1/2 rounded-md border border-line bg-surface p-2.5 text-[11px] font-normal leading-relaxed text-ink shadow-lg">
          <strong className="block font-semibold text-accent mb-0.5">{term}</strong>
          {explanation}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-1 block text-[10px] text-muted underline hover:text-ink"
          >
            Cerrar
          </button>
        </span>
      )}
    </span>
  )
}

function TrendSummary({ result, regionName }: { result: BackendResult | undefined; regionName: string }) {
  if (!result) return null
  const { variable, trend } = result
  const isConstant = trend.status === 'constant_series'
  const isSig = result.interpretation?.significant === true || (!result.interpretation && trend.significant === true)
  const slopeDecade = trend.change_per_decade
  const isUp = slopeDecade !== null && slopeDecade > 0
  const isDown = slopeDecade !== null && slopeDecade < 0

  let naturalLanguage = ''
  if (isConstant) {
    naturalLanguage = `Los agregados anuales de ${variable.name} son constantes en ${regionName}. No hay tendencia anual que evaluar; los valores mensuales pueden variar.`
  } else if (
    result.interpretation?.status === 'conflicting_evidence'
    || result.interpretation?.status === 'insufficient_data'
  ) {
    naturalLanguage = result.interpretation.summary
  } else if (slopeDecade !== null) {
    const dirVerb = isUp ? 'aumentó' : isDown ? 'disminuyó' : 'se mantuvo sin cambio lineal'
    const absChange = Math.abs(slopeDecade)
    const ciText = trend.confidence_interval_per_decade
      ? ` (IC 95%: [${formatValue(trend.confidence_interval_per_decade[0])}, ${formatValue(trend.confidence_interval_per_decade[1])}] ${variable.unit}/década)`
      : ''
    const mkP = trend.mann_kendall?.p_value ?? trend.p_value

    if (isSig) {
      naturalLanguage = `${variable.name} en ${regionName} ${dirVerb} ${formatValue(absChange)} ${variable.unit} por década${ciText}. Significativa según OLS (p=${formatValue(trend.p_value, 4)}). Mann-Kendall p=${formatValue(mkP, 4)}: ${mkP !== null && mkP < 0.05 ? 'significativa' : 'sin evidencia suficiente de significancia'}.`
    } else {
      naturalLanguage = `Hay una tendencia de ${formatValue(absChange)} ${variable.unit}/década, pero aún no es estadísticamente significativa (p=${formatValue(trend.p_value, 3)} ≥ 0,05). Un periodo más largo podría cambiar esto.`
    }
  } else if (result.interpretation) {
    naturalLanguage = result.interpretation.summary
  } else {
    naturalLanguage = trend.message
  }

  const mk = trend.mann_kendall
  const sen = trend.sen
  const ols = trend.ols

  return (
       <article className="rounded-xl border border-line bg-canvas/55 p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ backgroundColor: getVariableColor(variable.id) }} />
          <h3 className="text-base font-semibold text-ink">{variable.name}</h3>
          <span className="text-xs text-muted font-normal">({variable.unit})</span>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isSig
               ? 'border border-signal/25 bg-signal-soft text-ink'
              : 'border border-line bg-surface text-muted'
          }`}
        >
           {isSig ? <CheckCircle2 size={13} className="text-success" /> : <XCircle size={13} className="text-muted" />}
          {isConstant
            ? 'Serie constante'
            : isSig
            ? 'Significativa · OLS (α = 0,05)'
            : result.interpretation?.status === 'insufficient_data'
            || result.interpretation?.status === 'conflicting_evidence'
            || trend.status === 'insufficient_data' || trend.status === 'calculation_error'
            ? 'No evaluable'
            : 'No significativa · OLS (α = 0,05)'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <div className="flex items-center gap-1.5">
          {isUp ? (
             <ArrowUpRight size={26} className="text-signal" aria-label="Aumento" />
          ) : isDown ? (
             <ArrowDownRight size={26} className="text-accent" aria-label="Disminución" />
          ) : (
            <ArrowRight size={24} className="text-muted" aria-label="Sin cambio" />
          )}
          <span className="text-2xl font-bold tabular-nums text-ink">
            {slopeDecade !== null ? (slopeDecade > 0 ? `+${formatValue(slopeDecade)}` : formatValue(slopeDecade)) : '—'}
          </span>
          <span className="text-xs font-medium text-muted">{variable.unit} / década</span>
        </div>
        {trend.slope_per_year !== null && (
          <span className="text-xs text-muted">
            ({trend.slope_per_year > 0 ? `+${formatValue(trend.slope_per_year, 3)}` : formatValue(trend.slope_per_year, 3)} {variable.unit}/año)
          </span>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed font-medium text-ink bg-surface border border-line rounded-lg p-3">
        {naturalLanguage}
      </p>

      {/* Grid de métodos estadísticos rigurosos */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-[11px]">
        {/* OLS Linear Regression */}
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <p className="font-semibold text-ink flex items-center">
            Regresión OLS
            <TermHelp term="Regresión OLS" explanation="Ajuste de mínimos cuadrados ordinarios para estimar la tasa de cambio lineal a lo largo del tiempo." />
          </p>
          <p className="mt-1 text-muted">Pendiente: <span className="font-mono text-ink">{formatValue(ols?.slope_per_decade)}</span> {variable.unit}/década</p>
          <p className="text-muted">p-value: <span className="font-mono text-ink">{ols?.p_value !== undefined && ols?.p_value !== null ? formatValue(ols.p_value, 4) : '—'}</span></p>
          <p className="text-muted">R²: <span className="font-mono text-ink">{ols?.r_squared !== undefined ? formatValue(ols.r_squared, 3) : '—'}</span></p>
        </div>

        {/* Mann-Kendall */}
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <p className="font-semibold text-ink flex items-center">
            Test Mann-Kendall
            <TermHelp term="Mann-Kendall" explanation="Prueba estadística no paramétrica recomendada por NASA para detectar tendencias monótonas sin asumir normalidad." />
          </p>
          <p className="mt-1 text-muted">Estadístico Z: <span className="font-mono text-ink">{mk?.z !== undefined && mk?.z !== null ? formatValue(mk.z, 2) : '—'}</span></p>
          <p className="text-muted">p-value: <span className="font-mono text-ink">{mk?.p_value !== undefined && mk?.p_value !== null ? formatValue(mk.p_value, 4) : '—'}</span></p>
          <p className="text-muted">Tau de Kendall: <span className="font-mono text-ink">{mk?.tau !== undefined ? formatValue(mk.tau, 3) : '—'}</span></p>
        </div>

        {/* Sen's Slope */}
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <p className="font-semibold text-ink flex items-center">
            Pendiente de Sen
            <TermHelp term="Pendiente de Sen" explanation="Estimador de la mediana de todas las pendientes por pares; altamente robusto frente a valores atípicos y extremos." />
          </p>
          <p className="mt-1 text-muted">Mediana: <span className="font-mono text-ink">{sen?.slope_per_decade !== undefined && sen?.slope_per_decade !== null ? formatValue(sen.slope_per_decade) : '—'}</span> {variable.unit}/década</p>
          <p className="text-muted">IC 95%: <span className="font-mono text-ink">{sen?.ci95_per_decade ? `[${formatValue(sen.ci95_per_decade[0])}, ${formatValue(sen.ci95_per_decade[1])}]` : '—'}</span></p>
        </div>

        {/* Observaciones y Muestra */}
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <p className="font-semibold text-ink flex items-center">
            Incertidumbre (IC 95%)
            <TermHelp term="Intervalo de Confianza" explanation="Si repitiéramos el muestreo y este procedimiento muchas veces, aproximadamente el 95% de los intervalos contendría la tasa verdadera, bajo los supuestos del método." />
          </p>
          <p className="mt-1 text-muted">Rango: <span className="font-mono text-ink">{trend.confidence_interval_per_decade ? `[${formatValue(trend.confidence_interval_per_decade[0])}, ${formatValue(trend.confidence_interval_per_decade[1])}]` : '—'}</span></p>
          <p className="text-muted">Años analizados: <span className="font-mono text-ink">{trend.n_observations}</span></p>
        </div>
      </div>

      {trend.warnings && trend.warnings.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          {trend.warnings.map((w, idx) => (
            <p key={idx} className="flex items-start gap-1.5">
              <span className="shrink-0">⚠️</span>
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}
    </article>
  )
}

export function TimeSeriesChart({ configuration, dataset, pendingChanges }: TimeSeriesChartProps) {
  const [showTrendLines, setShowTrendLines] = useState(true)
  const [showConfidenceBands, setShowConfidenceBands] = useState(true)
  const [hiddenVariables, setHiddenVariables] = useState<string[]>([])
  const [zoomLevel, setZoomLevel] = useState(0)
  const [panOffset, setPanOffset] = useState(0)
  const panRef = useRef<{ pointerId: number; startX: number; startOffset: number; currentOffset: number } | null>(null)
  const panFrameRef = useRef<number | null>(null)
  const [layout, setLayout] = useState<'separate' | 'combined'>('separate')
  const [expanded, setExpanded] = useState(false)
  const [showZoomHelp, setShowZoomHelp] = useState(false)
  useEffect(() => {
    setLayout(configuration?.chartLayout ?? 'separate')
  }, [configuration])
  useEffect(() => {
    setHiddenVariables([])
    setZoomLevel(0)
    setPanOffset(0)
  }, [dataset])

  const selectedVariables = variables.filter((variable) => configuration?.variableIds.includes(variable.id))
  const region = regions.find((item) => item.id === configuration?.regionId)
  const points = dataset?.points ?? []
  const results = dataset?.results ?? []
  const selectedGroupVariables = dataset?.multivariateInterpretation?.selected_variables
    ?? results.map((result) => ({
      id: result.variable.id,
      name: result.variable.name,
      unit: result.variable.unit,
      direction: result.trend.direction,
      significant: result.interpretation?.significant ?? result.trend.significant,
    }))
  const visibleVariables = selectedVariables.filter((variable) => !hiddenVariables.includes(variable.id))
  const regionName = dataset?.region?.name ?? region?.name ?? 'la región'
  const chartPoints: TimeSeriesPoint[] = zoomedPoints(points, zoomLevel, panOffset)
  const combinedPoints = visibleVariables.reduce(
    (data, variable) => {
      const result = results.find((item) => item.variable.id === variable.id)
      return result ? variableChartPoints(data, result) : data
    }, chartPoints,
  )
  const maxPanOffset = Math.max(0, points.length - zoomWindowSize(points, zoomLevel))
  function changeZoom(level: number) {
    setZoomLevel(Math.max(0, Math.min(4, level)))
    setPanOffset(0)
  }
  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (zoomLevel <= 0 || maxPanOffset <= 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    panRef.current = { pointerId: event.pointerId, startX: event.clientX, startOffset: panOffset, currentOffset: panOffset }
  }
  function movePan(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    if (!pan || pan.pointerId !== event.pointerId || maxPanOffset <= 0) return
    event.preventDefault()
    const width = Math.max(1, event.currentTarget.clientWidth)
    const windowSize = Math.max(1, zoomWindowSize(points, zoomLevel))
    const sensitivity = 1.5
    const delta = (pan.startX - event.clientX) / width * windowSize * sensitivity
    pan.currentOffset = Math.max(
      -Math.floor(maxPanOffset / 2),
      Math.min(Math.ceil(maxPanOffset / 2), pan.startOffset + delta),
    )
    if (panFrameRef.current === null) {
      panFrameRef.current = requestAnimationFrame(() => {
        panFrameRef.current = null
        if (panRef.current) setPanOffset(panRef.current.currentOffset)
      })
    }
  }
  function stopPan(event: PointerEvent<HTMLDivElement>) {
    if (panRef.current?.pointerId === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (panFrameRef.current !== null) {
      cancelAnimationFrame(panFrameRef.current)
      panFrameRef.current = null
    }
    if (panRef.current?.pointerId === event.pointerId) {
      setPanOffset(panRef.current.currentOffset)
    }
    panRef.current = null
  }

  function downloadExport(format: 'json' | 'csv') {
    if (!dataset || !configuration) return

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataset, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `analisis_tendencia_${configuration.regionId}_${configuration.timeRange.startDate}_${configuration.timeRange.endDate}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } else {
      // CSV format
      const headers = ['fecha']
      selectedVariables.forEach((v) => {
        headers.push(`${v.id}_observado_${v.unit}`)
        headers.push(`${v.id}_tendencia_${v.unit}`)
        headers.push(`${v.id}_ic_inferior_${v.unit}`)
        headers.push(`${v.id}_ic_superior_${v.unit}`)
      })

      const rows = points.map((pt) => {
        const row = [pt.date]
        selectedVariables.forEach((v) => {
          row.push(String(pt[v.id] ?? ''))
          row.push(String(pt[`trend_${v.id}`] ?? ''))
          row.push(String(pt[`band_lower_${v.id}`] ?? ''))
          row.push(String(pt[`band_upper_${v.id}`] ?? ''))
        })
        return row.join(',')
      })

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', csvContent)
      downloadAnchor.setAttribute('download', `serie_temporal_${configuration.regionId}_${configuration.timeRange.startDate}_${configuration.timeRange.endDate}.csv`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    }
  }

  return (
     <section id="analysis" aria-labelledby="chart-title" className="surface-panel min-w-0 scroll-mt-6 p-5 sm:p-6">
      <SectionTitle
        id="chart-title"
        title="Serie temporal y análisis de tendencias"
        description={configuration ? `${regionName} · ${configuration.timeRange.startDate} a ${configuration.timeRange.endDate}` : 'Elige una región, variables y periodo para iniciar.'}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            {pendingChanges ? 'Cambios sin analizar' : dataset?.isDemonstration ? 'DEMO / SINTÉTICO' : 'NASA POWER'}
          </span>
          {points.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => downloadExport('csv')}
                 className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                title="Descargar datos en CSV"
              >
                <Download size={13} aria-hidden="true" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => downloadExport('json')}
                 className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                title="Descargar resultados en JSON"
              >
                <Download size={13} aria-hidden="true" />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </SectionTitle>

      {configuration && selectedVariables.length > 0 && points.length > 0 ? (
        <>
          {/* Controles de visualización y leyenda */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {selectedVariables.map((variable) => {
                const color = getVariableColor(variable.id)
                return (
                  <button type="button" key={variable.id}
                    aria-pressed={!hiddenVariables.includes(variable.id)}
                    aria-label={`${hiddenVariables.includes(variable.id) ? 'Mostrar' : 'Ocultar'} ${variable.name}`}
                    onClick={() => setHiddenVariables((current) => current.includes(variable.id) ? current.filter((id) => id !== variable.id) : [...current, variable.id])}
                     className="flex items-center gap-2 rounded-lg border border-line p-2 text-xs transition-colors hover:border-accent/40 hover:bg-accent-soft/35">
                    <span className="flex items-center gap-1 font-medium" style={{ color }}>
                      <Minus size={18} strokeWidth={3} aria-hidden="true" />
                      <span>{variable.name}</span>
                    </span>
                    <span className="text-[11px] text-muted">
                      {hiddenVariables.includes(variable.id) ? 'Oculta · mostrar' : 'Visible · ocultar'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1 text-[11px] font-medium text-ink">
                <SlidersHorizontal size={13} aria-hidden="true" />
                Capas:
              </span>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showTrendLines}
                  onChange={(e) => setShowTrendLines(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                <span>Recta de tendencia</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showConfidenceBands}
                  onChange={(e) => setShowConfidenceBands(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                <span>Banda IC 95%</span>
              </label>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line p-3 text-xs">
             <div className="flex w-full items-center gap-2 rounded-md border border-accent/15 bg-accent-soft px-3 py-2 text-accent">
              <strong>Zoom de la gráfica</strong>
              <span className="text-muted">Usa − y + al lado de cada gráfica y arrastra con el mouse para recorrer los datos.</span>
              <button type="button" className="ml-auto inline-flex items-center gap-1 rounded border border-accent/30 px-2 py-1 font-medium hover:bg-surface" aria-expanded={showZoomHelp} onClick={() => setShowZoomHelp(!showZoomHelp)}>
                <HelpCircle size={14} aria-hidden="true" /> ¿Cómo se usa?
              </button>
            </div>
            {showZoomHelp && <p role="note" className="w-full rounded-md border border-accent/20 bg-surface p-2 text-muted">Pulsa <strong>+</strong> para acercar y <strong>−</strong> para alejar. Cuando el zoom sea mayor que 1×, mantén presionado el botón izquierdo y arrastra horizontalmente sobre la gráfica. “Restablecer” vuelve a centrar la vista completa.</p>}
             <button type="button" className="rounded-lg border border-line px-3 py-2 font-semibold transition-colors hover:border-accent hover:text-accent" onClick={() => setHiddenVariables([])}>Mostrar todas</button>
            {selectedVariables.length >= 2 && <label>Vista
               <select aria-label="Vista de gráficas" className="ml-2 rounded-lg border border-line bg-surface p-2 font-semibold transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15" value={layout} onChange={(event) => setLayout(event.target.value as 'separate' | 'combined')}>
                <option value="separate">Separadas (recomendado)</option>
                <option value="combined">Juntas en una gráfica</option>
              </select>
            </label>}
             <button type="button" aria-pressed={expanded} className="rounded-lg border border-line px-3 py-2 font-semibold transition-colors hover:border-accent hover:text-accent" onClick={() => setExpanded(!expanded)}>{expanded ? 'Altura normal' : 'Ampliar altura para detalle'}</button>
            <p className="w-full text-muted">El zoom centra la ventana temporal y no cambia las pruebas estadísticas ni las descargas.</p>
          </div>
          {!visibleVariables.length && <p role="status">Todas las variables están ocultas. Activa una variable o pulsa “Mostrar todas”.</p>}
          {!chartPoints.length && <p role="status">No hay observaciones dentro del zoom seleccionado.</p>}
          {/* Separate panels avoid overlapping variables and incompatible units. */}
          {layout === 'combined' && selectedVariables.length >= 2 && visibleVariables.length > 0 && (
             <article aria-label="Gráfica conjunta de variables" className="mb-5 rounded-xl border border-line bg-canvas/35 p-3 shadow-sm">
              <h3 className="font-semibold">Variables juntas · escalas independientes</h3>
              <p className="text-xs text-muted">Consulta valores y unidades al pasar el puntero. Lluvia: tendencia y banda en equivalente mensual (÷12). Las escalas se ajustan al periodo visible.</p>
              <div className="my-2 flex flex-wrap gap-3 rounded-md bg-canvas/60 px-2.5 py-2 text-[11px]" aria-label="Leyenda de variables juntas">
                {visibleVariables.map((variable) => <span key={variable.id} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: getVariableColor(variable.id) }} /><strong>{variable.name}</strong> · {variable.unit}</span>)}
                <span className="text-muted">Línea sólida: observado · discontinua: tendencia · sombreado: IC 95%</span>
              </div>
              <div className="flex w-full items-stretch gap-2 overflow-x-auto">
                <div className={`min-w-0 flex-1 select-none ${zoomLevel > 0 ? 'cursor-grab active:cursor-grabbing' : ''}`} style={{ height: expanded ? 700 : 420, touchAction: zoomLevel > 0 ? 'none' : 'auto' }} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={stopPan} onPointerCancel={stopPan}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={combinedPoints} margin={{ top: 25, right: 24, bottom: 10, left: 24 }} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 5" />
                      <XAxis dataKey="date" tickFormatter={(value: string) => formatDate(value)} minTickGap={35} />
                      {visibleVariables.map((variable, index) => <YAxis key={variable.id} yAxisId={variable.id} orientation={index % 2 ? 'right' : 'left'} width={65} stroke={getVariableColor(variable.id)} domain={['auto', 'auto']} label={{ value: variable.unit, position: 'top', fontSize: 10 }} />)}
                      <Tooltip content={ChartTooltip} isAnimationActive={false} />
                      {visibleVariables.map((variable) => <Area key={`band_${variable.id}`} hide={!showConfidenceBands} yAxisId={variable.id} dataKey={`band_${variable.id}`} name={`IC 95% ${variable.name}`} unit={variable.unit} fill={getVariableColor(variable.id)} fillOpacity={0.08} stroke="none" isAnimationActive={false} />)}
                      {visibleVariables.map((variable) => <Line key={variable.id} yAxisId={variable.id} dataKey={variable.id} name={variable.name} unit={variable.unit} stroke={getVariableColor(variable.id)} dot={false} isAnimationActive={false} />)}
                      {visibleVariables.map((variable) => <Line key={`trend_${variable.id}`} hide={!showTrendLines} yAxisId={variable.id} dataKey={`trend_${variable.id}`} name={`Tendencia: ${variable.name}`} unit={variable.unit} stroke={getVariableColor(variable.id)} strokeDasharray="6 4" dot={false} isAnimationActive={false} />)}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <ChartZoomControls level={zoomLevel} onChange={changeZoom} />
              </div>
              {visibleVariables.map((variable) => {
                const result = results.find((item) => item.variable.id === variable.id)
                return <p key={variable.id} role="status" className="mt-2 text-xs"><strong>{variable.name}:</strong> {result?.interpretation?.title ?? 'Significancia no evaluable'} · OLS p = {formatValue(result?.trend.p_value, 4)} · MK p = {formatValue(result?.trend.mann_kendall?.p_value, 4)} · IC 95% = {result?.trend.confidence_interval_per_decade?.map((value) => formatValue(value)).join(' a ') ?? 'no disponible'} {variable.unit}/década</p>
              })}
            </article>
          )}
          {(layout === 'separate' || selectedVariables.length < 2) && visibleVariables.map((variable) => {
            const result = results.find((item) => item.variable.id === variable.id)
            if (!result) return null
              return <article key={variable.id} aria-label={`Panel de ${variable.name}`} className="mb-5 rounded-xl border border-line bg-canvas/35 p-3 shadow-sm">
               <h3 className="font-semibold" style={{ color: getVariableColor(variable.id) }}>{variable.name} · {variable.unit}</h3>
               <p className="mb-2 text-xs text-muted">Línea continua: observado · discontinua: tendencia · sombreado: IC 95% de la media estimada.</p>
               <ChartLegend variable={variable} />
              {result.variable.aggregation === 'sum' && <p className="mb-2 text-xs text-muted">Observado: total mensual. Tendencia y banda: equivalente mensual del ajuste anual (÷12). Las tarjetas reportan el cambio del total anual.</p>}
           <div className="flex min-w-0 items-stretch gap-2">
           <div
             className={`h-72 min-w-0 flex-1 select-none sm:h-96 ${zoomLevel > 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
             style={{ ...(expanded ? { height: 700 } : {}), touchAction: zoomLevel > 0 ? 'none' : 'auto' }}
             aria-label={`Gráfica de ${variable.name} en ${regionName}.`}
             onPointerDown={startPan}
             onPointerMove={movePan}
             onPointerUp={stopPan}
             onPointerCancel={stopPan}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 360 }}>
             <ComposedChart syncId="variable-panels" data={variableChartPoints(chartPoints, result)} margin={{ top: 12, right: 24, bottom: 8, left: 24 }} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 5" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => formatDate(value)}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={35}
                  tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                  dy={10}
                />
                {[variable].map((variable, index) => (
                  <YAxis
                    key={variable.id}
                    yAxisId={variable.id}
                    orientation={index === 0 ? 'left' : 'right'}
                    width={70}
                    axisLine={false}
                    tickLine={false}
                    tickCount={5}
                    tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                    domain={['auto', 'auto']}
                    label={{ value: `Valor (${variable.unit})`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--color-muted)', fontSize: 11 } }}
                  />
                ))}
              <Tooltip
                  content={ChartTooltip}
                  shared={false}
                  trigger="hover"
                  isAnimationActive={false}
                  cursor={{ stroke: 'var(--color-line)', strokeDasharray: '4 4' }}
                />

                {/* 1. Bandas de confianza (Area) */}
                {showConfidenceBands &&
                  [variable].map((variable) => {
                    const color = getVariableColor(variable.id)
                    return (
                      <Area
                        key={`band_${variable.id}`}
                        yAxisId={variable.id}
                        dataKey={`band_${variable.id}`}
                        name={`IC 95% ${variable.name}`}
                        stroke="none"
                        fill={color}
                        fillOpacity={0.12}
                        isAnimationActive={false}
                      />
                    )
                  })}

                {/* 2. Series mensuales observadas (Line sólida) */}
                {[variable].map((variable) => {
                  const color = getVariableColor(variable.id)
                  return (
                    <Line
                      key={variable.id}
                      yAxisId={variable.id}
                      dataKey={variable.id}
                      name={`Observado: ${variable.name}`}
                      unit={variable.unit}
                      type="linear"
                      stroke={color}
                      strokeWidth={1.4}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  )
                })}

                {/* 3. Rectas de tendencia estimadas (Line discontinua) */}
                {showTrendLines &&
                  [variable].map((variable) => {
                    const color = getVariableColor(variable.id)
                    return (
                      <Line
                        key={`trend_${variable.id}`}
                        yAxisId={variable.id}
                        dataKey={`trend_${variable.id}`}
                        name={`Tendencia: ${variable.name}`}
                        unit={variable.unit}
                        type="linear"
                        stroke={color}
                        strokeWidth={2.4}
                        strokeDasharray="6 4"
                        dot={false}
                        isAnimationActive={false}
                      />
                    )
                  })}
              </ComposedChart>
            </ResponsiveContainer>
           </div>
           <ChartZoomControls level={zoomLevel} onChange={changeZoom} />
           </div>
              <div
                role="status"
                aria-label={`Significancia estadística de ${variable.name}`}
                className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                  result.interpretation?.significant === true || (!result.interpretation && result.trend.significant === true)
                     ? 'border-signal/25 bg-signal-soft text-ink'
                    : result.interpretation?.significant === false || (!result.interpretation && result.trend.significant === false)
                      ? 'border-slate-200 bg-slate-50 text-slate-800'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <strong>
                  {result.interpretation?.significant === true || (!result.interpretation && result.trend.significant === true)
                    ? 'Tendencia significativa'
                    : result.interpretation?.significant === false || (!result.interpretation && result.trend.significant === false)
                      ? result.trend.status === 'constant_series' ? 'Serie constante; sin cambio lineal' : 'Tendencia no significativa'
                      : 'Significancia no evaluable'}
                </strong>
                {' · '}OLS p = {formatValue(result.trend.p_value, 4)}
                {' · '}Mann–Kendall p = {formatValue(result.trend.mann_kendall?.p_value, 4)}
                {' · '}IC 95% = {result.trend.confidence_interval_per_decade
                  ? `[${formatValue(result.trend.confidence_interval_per_decade[0])}, ${formatValue(result.trend.confidence_interval_per_decade[1])}] ${variable.unit}/década`
                  : 'no disponible'}
              </div>
            </article>
          })}

          <p className="mt-2 text-center text-xs text-muted flex items-center justify-center gap-1">
            <Info size={13} aria-hidden="true" />
            La línea continua representa las mediciones mensuales; la línea punteada muestra la tendencia lineal estimada y el sombreado el intervalo del 95%.
          </p>

          {/* Tarjetas de resultados estadísticos */}
          <section aria-labelledby="trend-summary-title" className="mt-6 border-t border-line pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="trend-summary-title" className="text-sm font-semibold text-ink">
                  ¿Cuánto cambia y es estadísticamente significativo?
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Evaluación multi-método con Regresión OLS, Test de Mann-Kendall y Pendiente de Sen (α = 0,05).
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              {visibleVariables.map((variable) => (
                <TrendSummary
                  key={variable.id}
                  result={results.find((item) => item.variable.id === variable.id)}
                  regionName={regionName}
                />
              ))}
            </div>
          </section>
          {results.length > 1 && dataset?.multivariateInterpretation ? (
             <section aria-labelledby="processes-title" className="mt-5 rounded-xl border border-accent/25 bg-accent-soft/65 p-4">
               <h2 id="processes-title" className="flex items-center gap-2 text-sm font-bold text-accent">
                <Link2 size={16} aria-hidden="true" />
                Interpretación conjunta de las variables
              </h2>
               <p className="mt-2 text-xs text-ink">{dataset.multivariateInterpretation.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedGroupVariables.map((variable) => (
                   <span key={variable.id} className="rounded-full border border-accent/20 bg-surface px-2.5 py-1 text-[11px] text-accent">
                    {variable.name} · {variable.unit}
                  </span>
                ))}
              </div>
              {dataset.multivariateInterpretation.processes.length > 0 && (
                <ul className="mt-3 space-y-3">
                  {dataset.multivariateInterpretation.processes.map((process) => (
                     <li key={process.id} className="rounded-lg border border-accent/20 bg-surface p-3">
                       <h3 className="text-xs font-semibold text-accent">{process.name}</h3>
                       <p className="mt-1 text-xs text-ink">{process.summary}</p>
                       <p className="mt-1 text-[11px] text-muted">{process.causality_warning}</p>
                    </li>
                  ))}
                </ul>
              )}
               <p className="mt-3 text-[11px] text-muted">{dataset.multivariateInterpretation.pattern_summary}</p>
               <p className="mt-2 text-[11px] text-muted">{dataset.multivariateInterpretation.causality_warning}</p>
            </section>
          ) : null}
        </>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line bg-canvas/50 px-5 text-center">
          <p className="text-sm font-medium text-ink">
            {configuration ? 'No hay registros en este periodo' : 'Tu análisis aparecerá aquí'}
          </p>
          <p className="max-w-md text-xs leading-relaxed text-muted">
            {configuration
              ? 'La cobertura y disponibilidad dependen del proveedor seleccionado. Revisa los valores faltantes antes de interpretar la tendencia.'
              : 'Selecciona variables, región y periodo; después genera la serie temporal y su análisis.'}
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted flex flex-wrap items-center justify-between gap-2">
        <p>
          {dataset?.isDemonstration
            ? 'Datos sintéticos de demostración (DEMO / SINTÉTICO); no son observaciones reales de satélites.'
            : 'Datos obtenidos vía API NASA POWER; el producto de origen depende de la variable y puede ser modelado o satelital.'}
          {dataset?.missingValueCount ? ` Valores faltantes: ${dataset.missingValueCount}.` : ''}
        </p>
        <span className="font-mono text-[11px] text-muted">NASA Space Apps Challenge 2026</span>
      </div>
    </section>
  )
}

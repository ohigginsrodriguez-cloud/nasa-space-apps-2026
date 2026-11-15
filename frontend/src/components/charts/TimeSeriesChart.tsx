import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Download, ExternalLink, HelpCircle, Info, Link2, Minus, SlidersHorizontal, XCircle } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps, type TooltipValueType } from 'recharts'
import { regions, variables } from '../../data/mockData'
import type { BackendResult, DataConfiguration, TimeSeriesDataset, TimeSeriesPoint } from '../../types'
import { SectionTitle } from '../common/SectionTitle'
import { useLanguage } from '../../context/LanguageContext'
import { ChartZoomControls } from './ChartZoomControls'
import { variableChartPoints, zoomWindowSize, zoomedPoints } from '../../utils/chartData'

interface TimeSeriesChartProps {
  configuration: DataConfiguration | null
  dataset: TimeSeriesDataset | null
  pendingChanges: boolean
}

const shortDate = new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const fullDate = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const formatDate = (date: string, full = false) => (full ? fullDate : shortDate).format(new Date(`${date}T00:00:00Z`))
const formatValue = (value: number | null | undefined, digits = 2) => (value === null || value === undefined ? '—' : new Intl.NumberFormat('en', Math.abs(value) > 0 && Math.abs(value) < 10 ** -digits ? { notation: 'scientific', maximumFractionDigits: 2 } : { maximumFractionDigits: digits }).format(value))

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
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-canvas/60 px-2.5 py-2 text-[11px]" aria-label={`Legend for ${variable.name}`}>
      <span className="font-semibold text-ink">{variable.name}</span>
      <span className="text-muted">Unit: <strong className="text-ink">{variable.unit}</strong></span>
      <span className="flex items-center gap-1.5 text-muted"><span className="h-0.5 w-5" style={{ backgroundColor: color }} /> Observed</span>
      <span className="flex items-center gap-1.5 text-muted"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: color }} /> Trend</span>
      <span className="flex items-center gap-1.5 text-muted"><span className="size-3 rounded-sm opacity-30" style={{ backgroundColor: color }} /> 95% CI</span>
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
        title={`What does ${term} mean?`}
        aria-label={`What does ${term} mean?`}
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
            Close
          </button>
        </span>
      )}
    </span>
  )
}

function TrendSummary({ result, regionName, language }: { result: BackendResult | undefined; regionName: string; language: 'en' | 'es' }) {
  if (!result) return null
  const { variable, trend } = result
  const isConstant = trend.status === 'constant_series'
  const isSig = result.interpretation?.significant === true || (!result.interpretation && trend.significant === true)
  const slopeDecade = trend.change_per_decade
  const isUp = slopeDecade !== null && slopeDecade > 0
  const isDown = slopeDecade !== null && slopeDecade < 0

  let naturalLanguage = ''
  if (isConstant) {
     naturalLanguage = language === 'en'
       ? `The annual aggregates of ${variable.name} are constant in ${regionName}. There is no annual trend to evaluate; monthly values may still vary.`
       : `Los agregados anuales de ${variable.name} son constantes en ${regionName}. No hay tendencia anual que evaluar; los valores mensuales pueden variar.`
  } else if (
    result.interpretation?.status === 'conflicting_evidence'
    || result.interpretation?.status === 'insufficient_data'
  ) {
    naturalLanguage = result.interpretation.summary
  } else if (slopeDecade !== null) {
     const dirVerb = language === 'en' ? (isUp ? 'increased' : isDown ? 'decreased' : 'showed no linear change') : (isUp ? 'aumentó' : isDown ? 'disminuyó' : 'se mantuvo sin cambio lineal')
    const absChange = Math.abs(slopeDecade)
    const ciText = trend.confidence_interval_per_decade
       ? ` (${language === 'en' ? '95% CI' : 'IC 95%'}: [${formatValue(trend.confidence_interval_per_decade[0])}, ${formatValue(trend.confidence_interval_per_decade[1])}] ${variable.unit}/${language === 'en' ? 'decade' : 'década'})`
      : ''
    const mkP = trend.mann_kendall?.p_value ?? trend.p_value

    if (isSig) {
       naturalLanguage = language === 'en'
         ? `${variable.name} in ${regionName} ${dirVerb} ${formatValue(absChange)} ${variable.unit} per decade${ciText}. Significant under OLS (p=${formatValue(trend.p_value, 4)}). Mann-Kendall p=${formatValue(mkP, 4)}: ${mkP !== null && mkP < 0.05 ? 'significant' : 'insufficient evidence of significance'}.`
         : `${variable.name} en ${regionName} ${dirVerb} ${formatValue(absChange)} ${variable.unit} por década${ciText}. Significativa según OLS (p=${formatValue(trend.p_value, 4)}). Mann-Kendall p=${formatValue(mkP, 4)}: ${mkP !== null && mkP < 0.05 ? 'significativa' : 'sin evidencia suficiente de significancia'}.`
    } else {
       naturalLanguage = language === 'en'
          ? `The estimated change is ${formatValue(slopeDecade)} ${variable.unit}/decade, but the evidence does not meet the OLS significance threshold (p=${formatValue(trend.p_value, 3)} ≥ 0.05). This does not prove there is no change.`
         : `Hay una tendencia de ${formatValue(absChange)} ${variable.unit}/década, pero aún no es estadísticamente significativa (p=${formatValue(trend.p_value, 3)} ≥ 0,05). Un periodo más largo podría cambiar esto.`
    }
  } else if (result.interpretation) {
    naturalLanguage = result.interpretation.summary
  } else {
    naturalLanguage = trend.message
  }

  const mk = trend.mann_kendall
  const seasonalMk = trend.seasonal_mann_kendall
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
             ? 'Constant series'
            : isSig
             ? 'Significant · OLS (α = 0.05)'
            : result.interpretation?.status === 'insufficient_data'
            || result.interpretation?.status === 'conflicting_evidence'
            || trend.status === 'insufficient_data' || trend.status === 'calculation_error'
             ? 'Not evaluable'
             : 'Not significant · OLS (α = 0.05)'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <div className="flex items-center gap-1.5">
          {isUp ? (
              <ArrowUpRight size={26} className="text-signal" aria-label="Increase" />
          ) : isDown ? (
              <ArrowDownRight size={26} className="text-accent" aria-label="Decrease" />
          ) : (
            <ArrowRight size={24} className="text-muted" aria-label="No change" />
          )}
          <span className="text-2xl font-bold tabular-nums text-ink">
            {slopeDecade !== null ? (slopeDecade > 0 ? `+${formatValue(slopeDecade)}` : formatValue(slopeDecade)) : '—'}
          </span>
           <span className="text-xs font-medium text-muted">{variable.unit} / decade</span>
        </div>
        {trend.slope_per_year !== null && (
          <span className="text-xs text-muted">
             ({trend.slope_per_year > 0 ? `+${formatValue(trend.slope_per_year, 3)}` : formatValue(trend.slope_per_year, 3)} {variable.unit}/year)
          </span>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed font-medium text-ink bg-surface border border-line rounded-lg p-3">
        {naturalLanguage}
      </p>

       <details className="mt-4 rounded-lg border border-line bg-surface">
         <summary className="cursor-pointer px-3 py-2.5 text-sm font-semibold text-accent">
           Show method details
         </summary>
       {/* Grid de métodos estadísticos rigurosos */}
       <div className="grid gap-3 border-t border-line p-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
        {/* OLS Linear Regression */}
         <div className="rounded-lg border border-line bg-surface p-2.5">
          <p className="font-semibold text-ink flex items-center">
             OLS regression
             <TermHelp term="OLS regression" explanation="Ordinary least-squares fit used to estimate the linear rate of change over time." />
          </p>
           <p className="mt-1 text-muted">Slope: <span className="font-mono text-ink">{formatValue(ols?.slope_per_decade)}</span> {variable.unit}/decade</p>
          <p className="text-muted">p-value: <span className="font-mono text-ink">{ols?.p_value !== undefined && ols?.p_value !== null ? formatValue(ols.p_value, 4) : '—'}</span></p>
          <p className="text-muted">R²: <span className="font-mono text-ink">{ols?.r_squared !== undefined ? formatValue(ols.r_squared, 3) : '—'}</span></p>
        </div>

        {/* Mann-Kendall */}
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <p className="font-semibold text-ink flex items-center">
            Test Mann-Kendall
             <TermHelp term="Mann-Kendall" explanation="A non-parametric test recommended by NASA for detecting monotonic trends without assuming normality." />
          </p>
           <p className="mt-1 text-muted">Z statistic: <span className="font-mono text-ink">{mk?.z !== undefined && mk?.z !== null ? formatValue(mk.z, 2) : '—'}</span></p>
          <p className="text-muted">p-value: <span className="font-mono text-ink">{mk?.p_value !== undefined && mk?.p_value !== null ? formatValue(mk.p_value, 4) : '—'}</span></p>
           <p className="text-muted">Kendall tau: <span className="font-mono text-ink">{mk?.tau !== undefined ? formatValue(mk.tau, 3) : '—'}</span></p>
        </div>

        {/* Sen's Slope */}
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <p className="font-semibold text-ink flex items-center">
             Theil–Sen slope
             <TermHelp term="Theil–Sen slope" explanation="Median estimator of all pairwise slopes; highly robust to outliers and extremes." />
          </p>
           <p className="mt-1 text-muted">Median: <span className="font-mono text-ink">{sen?.slope_per_decade !== undefined && sen?.slope_per_decade !== null ? formatValue(sen.slope_per_decade) : '—'}</span> {variable.unit}/decade</p>
           <p className="text-muted">95% CI: <span className="font-mono text-ink">{sen?.ci95_per_decade ? `[${formatValue(sen.ci95_per_decade[0])}, ${formatValue(sen.ci95_per_decade[1])}]` : '—'}</span></p>
        </div>

        {/* Observaciones y Muestra */}
        <div className="rounded-lg border border-line bg-surface p-2.5">
          <p className="font-semibold text-ink flex items-center">
             Uncertainty (95% CI)
             <TermHelp term="Confidence interval" explanation="If we repeated the sampling and procedure many times, approximately 95% of intervals would contain the true rate under the method assumptions." />
          </p>
           <p className="mt-1 text-muted">Range: <span className="font-mono text-ink">{trend.confidence_interval_per_decade ? `[${formatValue(trend.confidence_interval_per_decade[0])}, ${formatValue(trend.confidence_interval_per_decade[1])}]` : '—'}</span></p>
           <p className="text-muted">Years analyzed: <span className="font-mono text-ink">{trend.n_observations}</span></p>
         </div>
         <div className="rounded-lg border border-line bg-surface p-2.5">
           <p className="font-semibold text-ink">Seasonal Mann–Kendall</p>
           <p className="mt-1 text-muted">Z statistic: <span className="font-mono text-ink">{seasonalMk?.z !== undefined && seasonalMk?.z !== null ? formatValue(seasonalMk.z, 2) : '—'}</span></p>
           <p className="text-muted">p-value: <span className="font-mono text-ink">{seasonalMk?.p_value !== undefined && seasonalMk?.p_value !== null ? formatValue(seasonalMk.p_value, 4) : '—'}</span></p>
           <p className="text-muted">Seasons: <span className="font-mono text-ink">{seasonalMk?.seasons_evaluated ?? '—'}</span></p>
         </div>
       </div>
       </details>

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
  const { language } = useLanguage()
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
  const products = [...new Set(results.map((result) => result.variable.product).filter((product): product is string => Boolean(product)))]
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
         title={language === 'en' ? 'Time series and trend analysis' : 'Serie temporal y análisis de tendencias'}
         description={configuration ? `${regionName} · ${configuration.timeRange.startDate} ${language === 'en' ? 'to' : 'a'} ${configuration.timeRange.endDate}` : (language === 'en' ? 'Choose a region, variables, and period to begin.' : 'Elige una región, variables y periodo para iniciar.')}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
             {pendingChanges ? (language === 'en' ? 'Changes not analyzed' : 'Cambios sin analizar') : dataset?.isDemonstration ? (language === 'en' ? 'DEMO / SYNTHETIC' : 'DEMO / SINTÉTICO') : 'NASA POWER'}
          </span>
          {points.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => downloadExport('csv')}
                 className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                 title={language === 'en' ? 'Download data as CSV' : 'Descargar datos en CSV'}
              >
                <Download size={13} aria-hidden="true" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={() => downloadExport('json')}
                 className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                 title={language === 'en' ? 'Download results as JSON' : 'Descargar resultados en JSON'}
              >
                <Download size={13} aria-hidden="true" />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </SectionTitle>

      {configuration && dataset && selectedVariables.length > 0 && points.length > 0 ? (
        <>
          <details className="mb-5 rounded-xl border border-line bg-canvas/35 p-4">
            <summary className="cursor-pointer text-sm font-bold text-accent">
              {language === 'en' ? 'How this result was obtained' : 'Cómo se obtuvo este resultado'}
            </summary>
            <div className="mt-4 grid gap-3 border-t border-line pt-4 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-bold text-ink">{language === 'en' ? 'Source' : 'Fuente'}</dt>
                <dd className="mt-1 text-muted">{dataset.isDemonstration ? (language === 'en' ? 'Reproducible synthetic demo data' : 'Datos sintéticos reproducibles (demo)') : 'NASA POWER Monthly API'}</dd>
              </div>
              <div>
                <dt className="font-bold text-ink">{language === 'en' ? 'Region queried' : 'Región consultada'}</dt>
                <dd className="mt-1 text-muted">{regionName}</dd>
              </div>
              <div>
                <dt className="font-bold text-ink">{language === 'en' ? 'Period and frequency' : 'Periodo y frecuencia'}</dt>
                <dd className="mt-1 text-muted">{configuration.timeRange.startDate} {language === 'en' ? 'to' : 'a'} {configuration.timeRange.endDate} · {language === 'en' ? 'monthly' : 'mensual'}</dd>
              </div>
              <div>
                <dt className="font-bold text-ink">{language === 'en' ? 'Primary method' : 'Método principal'}</dt>
                <dd className="mt-1 text-muted">{language === 'en' ? 'Complete annual values · OLS + 95% confidence interval' : 'Valores anuales completos · OLS + intervalo de confianza del 95%'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-ink">{language === 'en' ? 'Products and models' : 'Productos y modelos'}</dt>
                <dd className="mt-1 text-muted">{products.length > 0 ? products.join(' · ') : (language === 'en' ? 'Metadata unavailable in this response.' : 'Metadatos no disponibles en esta respuesta.')}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-ink">{language === 'en' ? 'Data quality' : 'Calidad de datos'}</dt>
                <dd className="mt-1 text-muted">{dataset.missingValueCount > 0 ? `${dataset.missingValueCount} ${language === 'en' ? 'missing observations; review each variable’s warnings.' : 'observaciones faltantes; revisa las advertencias de cada variable.'}` : (language === 'en' ? 'No missing observations were detected in the queried series.' : 'No se detectaron observaciones faltantes en la serie consultada.')}</dd>
              </div>
            </div>
            {dataset.sourceUrl && (
              <a href={dataset.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center text-xs font-bold text-accent underline underline-offset-4">
                {language === 'en' ? 'Open source documentation' : 'Abrir documentación de la fuente'} <ExternalLink size={12} className="ml-1" aria-hidden="true" />
              </a>
            )}
          </details>

          {/* Controles de visualización y leyenda */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {selectedVariables.map((variable) => {
                const color = getVariableColor(variable.id)
                return (
                  <button type="button" key={variable.id}
                    aria-pressed={!hiddenVariables.includes(variable.id)}
                    aria-label={`${hiddenVariables.includes(variable.id) ? 'Show' : 'Hide'} ${variable.name}`}
                    onClick={() => setHiddenVariables((current) => current.includes(variable.id) ? current.filter((id) => id !== variable.id) : [...current, variable.id])}
                     className="flex items-center gap-2 rounded-lg border border-line p-2 text-xs transition-colors hover:border-accent/40 hover:bg-accent-soft/35">
                    <span className="flex items-center gap-1 font-medium" style={{ color }}>
                      <Minus size={18} strokeWidth={3} aria-hidden="true" />
                      <span>{variable.name}</span>
                    </span>
                   <span className="text-[11px] text-muted">
                       {hiddenVariables.includes(variable.id) ? (language === 'en' ? 'Hidden · show' : 'Oculta · mostrar') : (language === 'en' ? 'Visible · hide' : 'Visible · ocultar')}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1 text-[11px] font-medium text-ink">
                <SlidersHorizontal size={13} aria-hidden="true" />
                 {language === 'en' ? 'Layers:' : 'Capas:'}
              </span>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showTrendLines}
                  onChange={(e) => setShowTrendLines(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                 <span>{language === 'en' ? 'Trend line' : 'Recta de tendencia'}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={showConfidenceBands}
                  onChange={(e) => setShowConfidenceBands(e.target.checked)}
                  className="rounded border-line text-accent focus:ring-accent"
                />
                 <span>{language === 'en' ? '95% CI band' : 'Banda IC 95%'}</span>
              </label>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line p-3 text-xs">
             <div className="flex w-full items-center gap-2 rounded-md border border-accent/15 bg-accent-soft px-3 py-2 text-accent">
               <strong>{language === 'en' ? 'Chart zoom' : 'Zoom de la gráfica'}</strong>
               <span className="text-muted">{language === 'en' ? 'Use − and + beside each chart and drag to browse the data.' : 'Usa − y + al lado de cada gráfica y arrastra con el mouse para recorrer los datos.'}</span>
              <button type="button" className="ml-auto inline-flex items-center gap-1 rounded border border-accent/30 px-2 py-1 font-medium hover:bg-surface" aria-expanded={showZoomHelp} onClick={() => setShowZoomHelp(!showZoomHelp)}>
                 <HelpCircle size={14} aria-hidden="true" /> {language === 'en' ? 'How does it work?' : '¿Cómo se usa?'}
              </button>
            </div>
             {showZoomHelp && <p role="note" className="w-full rounded-md border border-accent/20 bg-surface p-2 text-muted">{language === 'en' ? <>Press <strong>+</strong> to zoom in and <strong>−</strong> to zoom out. Above 1×, hold the left mouse button and drag horizontally. “Reset” returns to the full view.</> : <>Pulsa <strong>+</strong> para acercar y <strong>−</strong> para alejar. Cuando el zoom sea mayor que 1×, mantén presionado el botón izquierdo y arrastra horizontalmente sobre la gráfica. “Restablecer” vuelve a centrar la vista completa.</>}</p>}
              <button type="button" className="rounded-lg border border-line px-3 py-2 font-semibold transition-colors hover:border-accent hover:text-accent" onClick={() => setHiddenVariables([])}>{language === 'en' ? 'Show all' : 'Mostrar todas'}</button>
            {selectedVariables.length >= 2 && <label>Vista
                <select aria-label="Chart view" className="ml-2 rounded-lg border border-line bg-surface p-2 font-semibold transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15" value={layout} onChange={(event) => setLayout(event.target.value as 'separate' | 'combined')}>
                 <option value="separate">Separate (recommended)</option>
                 <option value="combined">Combined in one chart</option>
              </select>
            </label>}
             <button type="button" aria-pressed={expanded} className="rounded-lg border border-line px-3 py-2 font-semibold transition-colors hover:border-accent hover:text-accent" onClick={() => setExpanded(!expanded)}>{expanded ? 'Altura normal' : 'Ampliar altura para detalle'}</button>
             <p className="w-full text-muted">Zoom centers the time window and does not change statistical tests or downloads.</p>
          </div>
           {!visibleVariables.length && <p role="status">All variables are hidden. Activate a variable or press “Show all”.</p>}
           {!chartPoints.length && <p role="status">There are no observations within the selected zoom window.</p>}
          {/* Separate panels avoid overlapping variables and incompatible units. */}
          {layout === 'combined' && selectedVariables.length >= 2 && visibleVariables.length > 0 && (
              <article aria-label="Combined variable chart" className="mb-5 rounded-xl border border-line bg-canvas/35 p-3 shadow-sm">
               <h3 className="font-semibold">Combined variables · independent scales</h3>
               <p className="text-sm text-muted">Hover to inspect values and units. Rainfall: trend and band shown as monthly equivalents (÷12). Scales adapt to the visible period.</p>
               <div className="my-2 flex flex-wrap gap-3 rounded-md bg-canvas/60 px-2.5 py-2 text-xs" aria-label="Combined variable legend">
                {visibleVariables.map((variable) => <span key={variable.id} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: getVariableColor(variable.id) }} /><strong>{variable.name}</strong> · {variable.unit}</span>)}
                 <span className="text-muted">Solid line: observed · dashed: trend · shaded: 95% CI</span>
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
                      {visibleVariables.map((variable) => <Line key={`trend_${variable.id}`} hide={!showTrendLines} yAxisId={variable.id} dataKey={`trend_${variable.id}`} name={`Trend: ${variable.name}`} unit={variable.unit} stroke={getVariableColor(variable.id)} strokeDasharray="6 4" dot={false} isAnimationActive={false} />)}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <ChartZoomControls level={zoomLevel} onChange={changeZoom} />
              </div>
              {visibleVariables.map((variable) => {
                const result = results.find((item) => item.variable.id === variable.id)
                 return <p key={variable.id} role="status" className="mt-2 text-sm"><strong>{variable.name}:</strong> {result?.interpretation?.title ?? 'Significance not evaluable'} · OLS p = {formatValue(result?.trend.p_value, 4)} · MK p = {formatValue(result?.trend.mann_kendall?.p_value, 4)} · 95% CI = {result?.trend.confidence_interval_per_decade?.map((value) => formatValue(value)).join(' to ') ?? 'not available'} {variable.unit}/decade</p>
              })}
            </article>
          )}
          {(layout === 'separate' || selectedVariables.length < 2) && visibleVariables.map((variable) => {
            const result = results.find((item) => item.variable.id === variable.id)
            if (!result) return null
              return <article key={variable.id} aria-label={`Panel for ${variable.name}`} className="mb-5 rounded-xl border border-line bg-canvas/35 p-3 shadow-sm">
               <h3 className="font-semibold" style={{ color: getVariableColor(variable.id) }}>{variable.name} · {variable.unit}</h3>
                <p className="mb-2 text-sm text-muted">Solid line: observed · dashed: trend · shaded: 95% CI of the estimated mean.</p>
               <ChartLegend variable={variable} />
              {result.variable.aggregation === 'sum' && <p className="mb-2 text-xs text-muted">Observed: monthly total. Trend and band: monthly equivalent of the annual fit (÷12). Summary cards report the change in annual totals.</p>}
           <div className="flex min-w-0 items-stretch gap-2">
           <div
             className={`h-72 min-w-0 flex-1 select-none sm:h-96 ${zoomLevel > 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
             style={{ ...(expanded ? { height: 700 } : {}), touchAction: zoomLevel > 0 ? 'none' : 'auto' }}
             aria-label={`Chart of ${variable.name} in ${regionName}.`}
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
                      name={`Observed: ${variable.name}`}
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
                        name={`Trend: ${variable.name}`}
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
                aria-label={`Statistical significance of ${variable.name}`}
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
                     ? 'Significant trend'
                    : result.interpretation?.significant === false || (!result.interpretation && result.trend.significant === false)
                       ? result.trend.status === 'constant_series' ? 'Constant series; no linear change' : 'Not significant trend'
                       : 'Significance not evaluable'}
                </strong>
                {' · '}OLS p = {formatValue(result.trend.p_value, 4)}
                {' · '}Mann–Kendall p = {formatValue(result.trend.mann_kendall?.p_value, 4)}
                {' · '}IC 95% = {result.trend.confidence_interval_per_decade
                   ? `[${formatValue(result.trend.confidence_interval_per_decade[0])}, ${formatValue(result.trend.confidence_interval_per_decade[1])}] ${variable.unit}/decade`
                   : 'not available'}
              </div>
            </article>
          })}

          <p className="mt-2 text-center text-xs text-muted flex items-center justify-center gap-1">
            <Info size={13} aria-hidden="true" />
             Solid lines represent monthly observations; dashed lines show the estimated linear trend; shading shows the 95% interval.
          </p>

          {/* Tarjetas de resultados estadísticos */}
          <section aria-labelledby="trend-summary-title" className="mt-6 border-t border-line pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="trend-summary-title" className="text-sm font-semibold text-ink">
                  How much does it change, and is the evidence statistically significant?
                </h2>
                <p className="mt-1 text-xs text-muted">
                   Multi-method evaluation using OLS regression, the Mann-Kendall test, and Theil-Sen slope (α = 0.05).
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              {visibleVariables.map((variable) => (
                <TrendSummary
                  key={variable.id}
                  result={results.find((item) => item.variable.id === variable.id)}
                  regionName={regionName}
                  language={language}
                />
              ))}
            </div>
          </section>
          {results.length > 1 && dataset?.multivariateInterpretation ? (
             <section aria-labelledby="processes-title" className="mt-5 rounded-xl border border-accent/25 bg-accent-soft/65 p-4">
               <h2 id="processes-title" className="flex items-center gap-2 text-sm font-bold text-accent">
                <Link2 size={16} aria-hidden="true" />
                 Joint interpretation of the variables
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
             {configuration ? 'No records are available for this period' : 'Your analysis will appear here'}
          </p>
          <p className="max-w-md text-xs leading-relaxed text-muted">
            {configuration
               ? 'Coverage and availability depend on the selected provider. Review missing values before interpreting the trend.'
               : 'Select variables, a region, and a period, then generate the time series and analysis.'}
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted flex flex-wrap items-center justify-between gap-2">
        <p>
          {dataset?.isDemonstration
             ? 'Synthetic demonstration data (DEMO / SYNTHETIC); these are not real satellite observations.'
             : 'Data retrieved through the NASA POWER API; the source product depends on the variable and may be modeled or satellite-derived.'}
           {dataset?.missingValueCount ? ` Missing values: ${dataset.missingValueCount}.` : ''}
        </p>
        <span className="font-mono text-[11px] text-muted">NASA Space Apps Challenge 2026</span>
      </div>
    </section>
  )
}

import { Minus } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps, type TooltipValueType } from 'recharts'
import { dataSources, regions, variables } from '../../data/mockData'
import type { DataConfiguration, TimeSeriesDataset, TimeSeriesPoint, VariableId } from '../../types'
import { analyzeTrend, type TrendAnalysis } from '../../utils/trendAnalysis'
import { SectionTitle } from '../common/SectionTitle'

interface TimeSeriesChartProps {
  configuration: DataConfiguration | null
  dataset: TimeSeriesDataset | null
  pendingChanges: boolean
}

interface ChartPoint extends TimeSeriesPoint {
  trend_temperature?: number
  trend_precipitation?: number
}

const shortDate = new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const fullDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const formatDate = (date: string, full = false) => (full ? fullDate : shortDate).format(new Date(`${date}T00:00:00Z`))
const formatValue = (value: number, digits = 2) => new Intl.NumberFormat('es', { maximumFractionDigits: digits }).format(value)

function ChartTooltip({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload?.length || typeof label !== 'string') return null
  const observations = payload.filter((entry) => !String(entry.dataKey).startsWith('trend_'))
  if (!observations.length) return null

  return <div className="max-w-64 rounded-lg border border-line bg-surface p-3 text-xs shadow-sm">
    <p className="mb-2 font-medium">{formatDate(label, true)}</p>
    {observations.map((entry) => <p key={String(entry.dataKey)} className="mt-1 text-muted">{entry.name}: <span className="font-semibold text-ink">{entry.value} {entry.unit}</span></p>)}
  </div>
}

function TrendSummary({ variableId, analysis }: { variableId: VariableId; analysis: TrendAnalysis | null }) {
  const variable = variables.find((item) => item.id === variableId)
  if (!variable) return null
  if (!analysis) return <article className="rounded-lg border border-line bg-canvas/60 p-4"><h3 className="text-sm font-semibold">{variable.name}</h3><p className="mt-1 text-xs leading-relaxed text-muted">No hay suficientes años completos para estimar la tendencia. Selecciona al menos tres años.</p></article>

  const direction = analysis.changePerDecade > 0 ? 'aumento' : analysis.changePerDecade < 0 ? 'disminución' : 'sin cambio lineal'

  return <article className="rounded-lg border border-line bg-canvas/60 p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h3 className="text-sm font-semibold">{variable.name}</h3>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${analysis.significant ? 'bg-accent-soft text-accent' : 'border border-line bg-surface text-muted'}`}>{analysis.significant ? 'Significativa · α = 0,05' : 'Evidencia insuficiente'}</span>
    </div>
    <p className="mt-3 text-xl font-semibold tabular-nums">{formatValue(analysis.changePerDecade)} <span className="text-sm font-normal text-muted">{variable.unit} / década</span></p>
    <p className="mt-2 text-xs text-muted">Pendiente anual: {formatValue(analysis.slopePerYear)} {variable.unit}/año</p>
    <p className="mt-3 text-xs leading-relaxed text-muted">Cambio estimado: {direction}. IC 95%: [{formatValue(analysis.confidenceInterval[0])}, {formatValue(analysis.confidenceInterval[1])}] {variable.unit}/década.</p>
    <p className="mt-2 text-xs leading-relaxed text-muted">Prueba t bilateral: p = {analysis.pValue < 0.001 ? '< 0,001' : formatValue(analysis.pValue, 3)}. {analysis.significant ? 'La tendencia es significativa.' : 'No hay evidencia suficiente para afirmar una tendencia.'}</p>
  </article>
}

export function TimeSeriesChart({ configuration, dataset, pendingChanges }: TimeSeriesChartProps) {
  const selectedVariables = variables.filter((variable) => configuration?.variableIds.includes(variable.id))
  const region = regions.find((item) => item.id === configuration?.regionId)
  const source = dataSources.find((item) => item.id === configuration?.sourceId)
  const points = dataset?.points ?? []
  const analyses = new Map<VariableId, TrendAnalysis | null>()
  selectedVariables.forEach((variable) => analyses.set(variable.id, analyzeTrend(points, variable.id)))
  const chartPoints: ChartPoint[] = points.map((point) => {
    const output: ChartPoint = { ...point }
    selectedVariables.forEach((variable) => {
      const analysis = analyses.get(variable.id)
      if (analysis) output[`trend_${variable.id}`] = Number((analysis.intercept + analysis.slopePerYear * (Number(point.date.slice(0, 4)) - analysis.baseYear)).toFixed(2))
    })
    return output
  })

  return (
    <section id="analysis" aria-labelledby="chart-title" className="min-w-0 scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <SectionTitle id="chart-title" title="Serie temporal y tendencia" description={region && configuration ? `${region.name} · ${configuration.timeRange.startDate} a ${configuration.timeRange.endDate} · ${source?.name ?? 'fuente no identificada'}` : 'Elige una región, variables y periodo para iniciar.'}>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">{pendingChanges ? 'Cambios sin analizar' : configuration ? 'Datos sintéticos' : 'Sin configuración'}</span>
      </SectionTitle>

      {configuration && selectedVariables.length > 0 && points.length > 0 ? <>
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {selectedVariables.map((variable) => <span key={variable.id} className="flex items-center gap-2 text-xs text-muted"><Minus size={20} strokeWidth={3} className={variable.id === 'temperature' ? 'text-chart-temperature' : 'text-chart-precipitation'} aria-hidden="true" />{variable.name} ({variable.unit})</span>)}
        </div>
        <div className="h-72 min-w-0 w-full sm:h-80" role="img" aria-label={`Gráfica de serie temporal mensual sintética de ${region?.name ?? 'la región seleccionada'}; la línea discontinua muestra la tendencia lineal estimada.`}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 320 }}>
            <LineChart data={chartPoints} margin={{ top: 12, right: 4, bottom: 8, left: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 5" />
              <XAxis dataKey="date" tickFormatter={(value: string) => formatDate(value)} axisLine={false} tickLine={false} minTickGap={30} tick={{ fill: 'var(--color-muted)', fontSize: 11 }} dy={10} />
              {selectedVariables.map((variable, index) => <YAxis key={variable.id} yAxisId={variable.id} orientation={index === 0 ? 'left' : 'right'} width={42} axisLine={false} tickLine={false} tickCount={5} tick={{ fill: 'var(--color-muted)', fontSize: 11 }} domain={['auto', 'auto']} />)}
              <Tooltip content={ChartTooltip} cursor={{ stroke: 'var(--color-line)', strokeDasharray: '4 4' }} />
              {selectedVariables.map((variable) => <Line key={variable.id} yAxisId={variable.id} dataKey={variable.id} name={variable.name} unit={variable.unit} type="linear" stroke={variable.id === 'temperature' ? 'var(--color-chart-temperature)' : 'var(--color-chart-precipitation)'} strokeWidth={1.7} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />)}
              {selectedVariables.map((variable) => <Line key={`trend-${variable.id}`} yAxisId={variable.id} dataKey={`trend_${variable.id}`} name={`Tendencia · ${variable.name}`} type="linear" stroke={variable.id === 'temperature' ? 'var(--color-chart-temperature)' : 'var(--color-chart-precipitation)'} strokeWidth={2.2} strokeDasharray="6 5" dot={false} activeDot={false} isAnimationActive={false} legendType="none" />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-xs text-muted">Línea continua: datos mensuales · línea discontinua: tendencia lineal</p>

        <section aria-labelledby="trend-summary-title" className="mt-6 border-t border-line pt-5">
          <h2 id="trend-summary-title" className="text-sm font-semibold">¿Cuánto cambia y es significativo?</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">Se considera significativa si p &lt; 0,05. El intervalo de confianza muestra la incertidumbre de la tasa estimada.</p>
          <div className="mt-4 grid gap-3">{selectedVariables.map((variable) => <TrendSummary key={variable.id} variableId={variable.id} analysis={analyses.get(variable.id) ?? null} />)}</div>
          <p className="mt-3 text-xs leading-relaxed text-muted">Método: regresión lineal y prueba t bilateral sobre promedios anuales completos. Mann–Kendall no está implementado; no se corrige autocorrelación y no se infiere causalidad.</p>
        </section>
      </> : <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line bg-canvas/50 px-5 text-center">
        <p className="text-sm font-medium">{configuration ? 'No hay registros en este periodo' : 'Tu análisis aparecerá aquí'}</p>
        <p className="max-w-md text-xs leading-relaxed text-muted">{configuration ? 'La demo tiene datos mensuales desde enero de 2001 hasta diciembre de 2025. Elige un periodo dentro de esas fechas.' : 'Selecciona variables, región y periodo; después genera la serie temporal y su análisis.'}</p>
      </div>}

      <div className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        <p>Datos sintéticos de demostración; no son observaciones ni productos NASA. {configuration && 'La serie usa promedios anuales completos; interpreta los resultados con cautela.'}</p>
      </div>
    </section>
  )
}

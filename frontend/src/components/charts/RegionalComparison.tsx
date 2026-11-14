import { useState } from 'react'
import { MapPinned } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { createDemoTimeSeries, regions, variables } from '../../data/mockData'
import type { DataConfiguration, RegionId, VariableId } from '../../types'
import { analyzeTrend } from '../../utils/trendAnalysis'

interface RegionalComparisonProps {
  configuration: DataConfiguration
}

const colors = ['#2563eb', '#0f766e', '#c2410c', '#7c3aed']
const monthYear = new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const formatNumber = (value: number) => new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(value)

export function RegionalComparison({ configuration }: RegionalComparisonProps) {
  const [selectedRegions, setSelectedRegions] = useState<RegionId[]>(['sonoran-desert', 'amazon-basin'])
  const [variableId, setVariableId] = useState<VariableId>(configuration.variableIds[0] ?? 'temperature')
  const activeVariableId = configuration.variableIds.includes(variableId) ? variableId : configuration.variableIds[0] ?? 'temperature'
  const variable = variables.find((item) => item.id === activeVariableId) ?? variables[0]
  const activeRegions = regions.filter((region) => selectedRegions.includes(region.id))
  const regionSeries = activeRegions.map((region) => ({
    region,
    points: createDemoTimeSeries(region.id).filter((point) => point.date >= configuration.timeRange.startDate && point.date <= configuration.timeRange.endDate),
  }))
  const trendResults = regionSeries.map(({ region, points }, index) => ({
    region,
    result: analyzeTrend(points, activeVariableId),
    color: colors[index % colors.length],
  }))
  const slopes = trendResults.flatMap(({ result }) => result ? [result.changePerDecade] : [])
  const oppositeDirections = slopes.some((slope) => slope > 0) && slopes.some((slope) => slope < 0)
  const chartData = regionSeries[0]?.points.map((point, index) => {
    const row: Record<string, string | number> = { date: point.date }
    regionSeries.forEach(({ region, points }) => { row[region.id] = points[index]?.[activeVariableId] ?? Number.NaN })
    return row
  }) ?? []

  function toggleRegion(regionId: RegionId) {
    setSelectedRegions((current) => current.includes(regionId) ? current.filter((id) => id !== regionId) : [...current, regionId])
  }

  return (
    <section id="comparison" aria-labelledby="comparison-title" className="scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent"><MapPinned size={18} aria-hidden="true" /></span>
          <div><h2 id="comparison-title" className="text-sm font-semibold">Comparación regional</h2><p className="mt-1 text-xs leading-relaxed text-muted">Compara la misma variable en regiones distintas; tendencias sintéticas solo para explorar la interfaz.</p></div>
        </div>
        <label className="text-xs font-medium">Variable
          <select value={activeVariableId} onChange={(event) => {
            const selected = configuration.variableIds.find((id) => id === event.target.value)
            if (selected) setVariableId(selected)
          }} className="ml-2 min-h-9 rounded-lg border border-line bg-surface px-2 text-xs">
            {configuration.variableIds.map((id) => {
              const option = variables.find((item) => item.id === id)
              return option ? <option key={id} value={id}>{option.name}</option> : null
            })}
          </select>
        </label>
      </div>

      <fieldset className="mb-4 flex flex-wrap gap-2">
        <legend className="mb-2 text-xs font-medium">Regiones (selecciona dos o más)</legend>
        {regions.map((region) => <label key={region.id} className={`flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs ${selectedRegions.includes(region.id) ? 'border-accent/50 bg-accent-soft/50' : 'border-line'}`}>
          <input type="checkbox" checked={selectedRegions.includes(region.id)} onChange={() => toggleRegion(region.id)} className="size-3.5 accent-accent" />
          {region.name}
        </label>)}
      </fieldset>

      {activeRegions.length >= 2 && chartData.length > 0 ? <>
        <div className="h-72 min-w-0 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 600, height: 288 }}>
            <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 8, left: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 5" />
              <XAxis dataKey="date" tickFormatter={(value: string) => monthYear.format(new Date(`${value}T00:00:00Z`))} axisLine={false} tickLine={false} minTickGap={30} tick={{ fill: 'var(--color-muted)', fontSize: 11 }} />
              <YAxis unit={variable.unit} domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 11 }} />
              <Tooltip labelFormatter={(value) => monthYear.format(new Date(`${String(value)}T00:00:00Z`))} />
              {activeRegions.map((region, index) => <Line key={region.id} dataKey={region.id} name={region.name} type="linear" stroke={colors[index % colors.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {trendResults.map(({ region, result, color }) => {
            return <article key={region.id} className="rounded-lg border border-line p-4">
              <h3 className="text-sm font-semibold" style={{ color }}>{region.name}</h3>
              {result ? <p className="mt-2 text-xs leading-relaxed text-muted">{result.changePerDecade > 0 ? 'Tendencia ascendente' : result.changePerDecade < 0 ? 'Tendencia descendente' : 'Sin cambio lineal claro'} · {formatNumber(result.changePerDecade)} {variable.unit}/década · p={formatNumber(result.pValue)} ({result.significant ? 'significativa' : 'evidencia insuficiente'} con α=0,05 en el demo).</p> : <p className="mt-2 text-xs text-muted">Se necesitan al menos tres años completos.</p>}
            </article>
          })}
        </div>
        {oppositeDirections && <p className="mt-3 rounded-lg border border-accent/20 bg-accent-soft/40 p-3 text-xs leading-relaxed text-muted">Estas series sintéticas muestran direcciones opuestas en las regiones seleccionadas. Es una ilustración del contraste regional, no un hallazgo científico.</p>}
        <p className="mt-3 text-xs leading-relaxed text-muted">Las series y pruebas son sintéticas e independientes del rectángulo dibujado en el mapa. No describen tendencias científicas reales ni representan el comportamiento global.</p>
      </> : <p className="rounded-lg border border-dashed border-line p-5 text-center text-sm text-muted">Selecciona al menos dos regiones y una variable disponible para compararlas.</p>}
    </section>
  )
}

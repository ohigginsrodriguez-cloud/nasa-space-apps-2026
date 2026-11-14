import { Link } from 'react-router-dom'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { PageIntro } from '../components/common/PageIntro'
import { useResearch } from '../context/ResearchContext'

export function TrendsPage() {
  const { visualization, dataset, isPending, dataLoadState, dataLoadError } = useResearch()
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="ANÁLISIS ESTADÍSTICO" title="Detective de tendencias" description="Evalúa la dirección, magnitud e incertidumbre de la tendencia. La inferencia se calcula sobre promedios anuales completos." />
      {dataLoadState === 'loading' && <p role="status" aria-live="polite" className="rounded-lg border border-accent/20 bg-accent-soft/40 p-3 text-xs text-accent">Cargando la serie temporal…</p>}
      {dataLoadState === 'error' && dataLoadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{dataLoadError}</p>}
      {visualization && dataset
        ? <TimeSeriesChart configuration={visualization} dataset={dataset} pendingChanges={isPending} />
        : dataLoadState !== 'loading' && <section className="rounded-xl border border-dashed border-line bg-surface p-6 text-center"><p className="text-sm font-medium">Primero configura tu investigación</p><p className="mt-2 text-xs text-muted">Elige variables, región, fuente y periodo para calcular la tendencia.</p><Link to="/dashboard" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-accent px-3 text-xs font-medium text-accent">Configurar investigación</Link></section>}
    </div>
  )
}

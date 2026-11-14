import { Link } from 'react-router-dom'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { PageIntro } from '../components/common/PageIntro'
import { useResearch } from '../context/ResearchContext'

export function TrendsPage() {
  const { visualization, isPending } = useResearch()
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="ANÁLISIS ESTADÍSTICO" title="Detective de tendencias" description="Evalúa la dirección, magnitud e incertidumbre de la tendencia. La inferencia se calcula sobre promedios anuales completos." />
      {visualization
        ? <TimeSeriesChart configuration={visualization} pendingChanges={isPending} />
        : <section className="rounded-xl border border-dashed border-line bg-surface p-6 text-center"><p className="text-sm font-medium">Primero configura tu investigación</p><p className="mt-2 text-xs text-muted">Elige variables, región, fuente y periodo para calcular la tendencia.</p><Link to="/dashboard" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-accent px-3 text-xs font-medium text-accent">Configurar investigación</Link></section>}
    </div>
  )
}

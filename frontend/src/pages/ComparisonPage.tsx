import { Link } from 'react-router-dom'
import { RegionalComparison } from '../components/charts/RegionalComparison'
import { PageIntro } from '../components/common/PageIntro'
import { useResearch } from '../context/ResearchContext'

export function ComparisonPage() {
  const { visualization } = useResearch()
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="ANÁLISIS ESPACIAL" title="Comparación regional" description="Compara una misma variable entre regiones para explorar tendencias sintéticas con direcciones potencialmente distintas." />
      {visualization
        ? <RegionalComparison configuration={visualization} />
        : <section className="rounded-xl border border-dashed border-line bg-surface p-6 text-center"><p className="text-sm font-medium">No hay una investigación activa</p><p className="mt-2 text-xs text-muted">Genera una serie de demostración antes de comparar regiones.</p><Link to="/dashboard" className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-accent px-3 text-xs font-medium text-accent">Configurar investigación</Link></section>}
    </div>
  )
}

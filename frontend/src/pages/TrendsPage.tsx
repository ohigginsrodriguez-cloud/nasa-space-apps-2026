import { useState } from 'react'
import { BookOpen, GitCompare, LineChart as ChartIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { GlossaryModal } from '../components/common/GlossaryModal'
import { PageIntro } from '../components/common/PageIntro'
import { RegionComparison } from '../components/detective/RegionComparison'
import { useResearch } from '../context/ResearchContext'

export function TrendsPage() {
  const { visualization, dataset, isPending, dataLoadState, dataLoadError } = useResearch()
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('single')
  const [showGlossary, setShowGlossary] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageIntro
          eyebrow="ANÁLISIS ESTADÍSTICO"
          title="Detective de Tendencias Ambientales"
          description="Inferencia multi-método (Regresión OLS, Mann-Kendall, Sen) con detección de tendencias opuestas y bandas de confianza al 95%."
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGlossary(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent shadow-2xs"
          >
            <BookOpen size={14} className="text-accent" />
            <span>Glosario Científico</span>
          </button>
          <div className="flex rounded-lg border border-line bg-surface p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                activeTab === 'single'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <ChartIcon size={14} />
              <span>Análisis Principal</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compare')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                activeTab === 'compare'
                  ? 'bg-purple-600 text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <GitCompare size={14} />
              <span>Comparar 2 Regiones</span>
            </button>
          </div>
        </div>
      </div>

      <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />

      {activeTab === 'compare' ? (
        <RegionComparison />
      ) : (
        <>
          {dataLoadState === 'loading' && (
            <p role="status" aria-live="polite" className="rounded-lg border border-accent/20 bg-accent-soft/40 p-3 text-xs text-accent">
              Cargando la serie temporal y calculando inferencia estadística…
            </p>
          )}

          {dataLoadState === 'error' && dataLoadError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {dataLoadError}
            </p>
          )}

          {visualization && dataset ? (
            <TimeSeriesChart configuration={visualization} dataset={dataset} pendingChanges={isPending} />
          ) : (
            dataLoadState !== 'loading' && (
              <section className="rounded-xl border border-dashed border-line bg-surface p-6 text-center">
                <p className="text-sm font-medium text-ink">Primero configura tu investigación</p>
                <p className="mt-2 text-xs text-muted">
                  Elige variables, región y periodo en el panel de investigación para calcular las tendencias.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-xs font-semibold text-white hover:bg-accent-hover"
                >
                  Configurar investigación
                </Link>
              </section>
            )
          )}
        </>
      )}
    </div>
  )
}

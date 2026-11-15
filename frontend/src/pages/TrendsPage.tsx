import { useState } from 'react'
import { BookOpen, GitCompare, LineChart as ChartIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { GlossaryModal } from '../components/common/GlossaryModal'
import { PageIntro } from '../components/common/PageIntro'
import { ProjectGuideModal } from '../components/common/ProjectGuideModal'
import { RegionComparison } from '../components/detective/RegionComparison'
import { InvestigationFindings } from '../components/detective/InvestigationFindings'
import { useResearch } from '../context/ResearchContext'
import { useLanguage } from '../context/LanguageContext'

export function TrendsPage() {
  const { visualization, dataset, isPending, dataLoadState, dataLoadError } = useResearch()
  const [activeTab, setActiveTab] = useState<'single' | 'compare'>('single')
  const [showGlossary, setShowGlossary] = useState(false)
  const [showProjectGuide, setShowProjectGuide] = useState(false)
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageIntro
          eyebrow={t('statisticalAnalysis')}
          title={t('trendDetective')}
          description={t('trendDescription')}
        />
        <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowProjectGuide(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-all hover:border-accent hover:text-accent hover:shadow-md"
          >
            <BookOpen size={14} className="text-accent" />
            <span>{t('howItWorks')}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGlossary(true)}
             className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-all hover:border-accent hover:text-accent hover:shadow-md"
          >
            <BookOpen size={14} className="text-accent" />
            <span>{t('glossary')}</span>
          </button>
            <div className="flex min-w-0 max-w-full flex-wrap rounded-lg border border-line bg-surface p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
                className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-center text-xs font-semibold transition-colors sm:flex-none sm:px-3 ${
                activeTab === 'single'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <ChartIcon size={14} />
              <span>{t('primaryAnalysis')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compare')}
                className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-center text-xs font-semibold transition-colors sm:flex-none sm:px-3 ${
                activeTab === 'compare'
                   ? 'bg-accent text-white'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <GitCompare size={14} />
              <span>{t('compareRegions')}</span>
            </button>
          </div>
        </div>
      </div>

      <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
      <ProjectGuideModal isOpen={showProjectGuide} onClose={() => setShowProjectGuide(false)} />

      {activeTab === 'compare' ? (
        <RegionComparison />
      ) : (
        <>
          {dataLoadState === 'loading' && (
            <p role="status" aria-live="polite" className="rounded-lg border border-accent/20 bg-accent-soft/65 p-3 text-xs font-medium text-accent shadow-sm">
              {t('loadingSeries')}
            </p>
          )}

          {dataLoadState === 'error' && dataLoadError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-sm">
              {dataLoadError}
            </p>
          )}

          {visualization && dataset ? (
            <>
              <InvestigationFindings configuration={visualization} dataset={dataset} pending={isPending} />
              <TimeSeriesChart configuration={visualization} dataset={dataset} pendingChanges={isPending} />
            </>
          ) : (
            dataLoadState !== 'loading' && (
              <section className="surface-panel border-dashed p-6 text-center">
                <p className="text-sm font-medium text-ink">{t('configureFirst')}</p>
                <p className="mt-2 text-xs text-muted">
                  {t('configureDescription')}
                </p>
                <Link
                  to="/dashboard"
                  className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-xs font-semibold text-white hover:bg-accent-hover"
                >
                  {t('configureInvestigation')}
                </Link>
              </section>
            )
          )}
        </>
      )}
    </div>
  )
}

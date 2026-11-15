import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart'
import { GlossaryModal } from '../components/common/GlossaryModal'
import { PageIntro } from '../components/common/PageIntro'
import { RegionComparison } from '../components/detective/RegionComparison'
import { InvestigationFindings } from '../components/detective/InvestigationFindings'
import { useResearch } from '../context/ResearchContext'
import { useLanguage } from '../context/LanguageContext'

export function TrendsPage() {
  const { visualization, dataset, isPending, dataLoadState, dataLoadError } = useResearch()
  const [showGlossary, setShowGlossary] = useState(false)
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageIntro eyebrow={t('statisticalAnalysis')} title={t('trendDetective')} description={t('trendDescription')} />
        <button type="button" onClick={() => setShowGlossary(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:text-accent">
          <BookOpen size={14} aria-hidden="true" /> {t('glossary')}
        </button>
      </div>
      <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
      {dataLoadState === 'loading' && <p role="status" className="text-sm text-muted">{t('loadingSeries')}</p>}
      {dataLoadState === 'error' && dataLoadError && <p role="alert" className="text-sm text-red-800">{dataLoadError}</p>}
      {visualization && dataset ? (
        <>
          <InvestigationFindings configuration={visualization} dataset={dataset} pending={isPending} />
          <TimeSeriesChart configuration={visualization} dataset={dataset} pendingChanges={isPending} />
        </>
      ) : dataLoadState !== 'loading' && (
        <section className="surface-panel border-dashed p-6 text-center">
          <h2 className="font-semibold">{t('configureFirst')}</h2>
          <p className="mt-2 text-sm text-muted">{t('configureDescription')}</p>
          <Link to="/dashboard" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white">{t('configureInvestigation')}</Link>
        </section>
      )}
      <details className="surface-panel p-5">
        <summary className="cursor-pointer text-base font-bold text-accent">Go further: does the trend differ between regions?</summary>
        <p className="my-4 text-sm leading-relaxed text-muted">
          Optional investigation: compare the same variable over the same period in two regions.
          The challenge highlights that trends can differ by location. Opposite trends do not prove a shared cause,
          and this comparison does not test whether the difference between slopes is statistically significant.
        </p>
        <RegionComparison />
      </details>
    </div>
  )
}

import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, LoaderCircle, Play, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { ProjectGuideModal } from '../components/common/ProjectGuideModal'
import { MapSelector } from '../components/geography/MapSelector'
import { RegionSelector } from '../components/regions/RegionSelector'
import { TimeRangeSelector } from '../components/temporal/TimeRangeSelector'
import { VariableSelector } from '../components/variables/VariableSelector'
import { useResearch } from '../context/ResearchContext'
import { demoExamples, regions, variables } from '../data/mockData'
import { validateGeographicSelection } from '../utils/configuration'
import { useLanguage } from '../context/LanguageContext'

export function Dashboard() {
  const [step, setStep] = useState(0)
  const [showProjectGuide, setShowProjectGuide] = useState(false)
  const [mapDraftError, setMapDraftError] = useState<string | null>(null)

  const {
    draft,
    visualization,
    updateDraft,
    toggleVariable,
    setGeographicBounds,
    geographicBounds,
    areaName,
    setAreaName,
    selectedPoint,
    setSelectedPoint,
    loadExample,
    applyConfiguration,
    notice,
    timeError,
    isPending,
    dataLoadState,
    dataLoadError,
  } = useResearch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const steps = [t('variable'), t('location'), t('period')]

  const region = regions.find((item) => item.id === draft.regionId) ?? regions[0]
  const selectedVariableNames = draft.variableIds
    .map((id) => variables.find((variable) => variable.id === id)?.name)
    .filter(Boolean)

  async function generate() {
    if (geoError) return
    if (await applyConfiguration()) navigate('/trends')
  }

  const isLoading = dataLoadState === 'loading'
  const geoError = mapDraftError ?? validateGeographicSelection(draft.sourceId, geographicBounds, selectedPoint)
  const canContinue = step === 0 ? draft.variableIds.length > 0 : step === 1 ? geoError === null : true

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">ASK A QUESTION. FOLLOW THE EVIDENCE.</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowProjectGuide(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition-all hover:border-accent hover:text-accent hover:shadow-md"
          >
            <BookOpen size={14} className="text-accent" />
            <span>{t('howItWorks')}</span>
          </button>
        </div>
      </div>

      <ProjectGuideModal isOpen={showProjectGuide} onClose={() => setShowProjectGuide(false)} />

       <section className="relative overflow-hidden bg-[#080d18] p-6 text-white sm:p-12">
        <div className="absolute inset-x-0 top-0 h-1 bg-signal" aria-hidden="true" />
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-widest text-white/70">EXPLORE OUR CHANGING PLANET</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
              Is your region changing?
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              Investigate decades of temperature, rainfall, and soil moisture with NASA Earth data. Discover how fast they are changing—and whether the evidence supports a trend.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { document.getElementById('investigation-setup')?.scrollIntoView(); document.getElementById('investigation-setup')?.focus({ preventScroll: true }) }}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-[#c62d1f] px-5 py-3 text-base font-bold text-white transition-colors hover:bg-red-800"
          >
            Start an investigation <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-8 grid gap-5 border-t border-white/25 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-sm font-bold">01 / Ask</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">Choose a question, region, and period.</p>
          </div>
          <div>
            <p className="text-sm font-bold">02 / Investigate</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">Explore a time series from NASA POWER.</p>
          </div>
          <div>
            <p className="text-sm font-bold">03 / Understand</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">Read the rate of change, evidence, and limits.</p>
          </div>
        </div>
      </section>

      <div inert={isLoading} aria-busy={isLoading}>
        <section className="py-4" aria-labelledby="question-title">
          <h2 id="question-title" className="flex min-h-9 items-center gap-2 text-xl font-bold">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            Start with a question
          </h2>
          <p className="mt-2 text-sm text-muted">Choose a real NASA POWER case study, then review its region and dates—or build your own investigation below.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {demoExamples.map((example) => (
              <button key={example.id} type="button" onClick={() => { loadExample(example.id); setMapDraftError(null); setStep(2); document.getElementById('investigation-setup')?.focus() }}
                className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-line p-3 text-left transition-all hover:border-accent hover:bg-accent-soft/50 hover:shadow-sm">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{example.title}</span>
                  <span className="mt-1 block text-xs text-muted">{example.description}</span>
                </span>
                <Play size={15} className="shrink-0 text-accent" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
        {/* Pasos numerados */}
        <nav id="investigation-setup" tabIndex={-1} aria-label="Investigation setup" className="mt-4 scroll-mt-6">
          <ol className="grid grid-cols-3 gap-2">
            {steps.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  disabled={index > step || isLoading}
                  aria-current={index === step ? 'step' : undefined}
                  onClick={() => setStep(index)}
                     className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-xs transition-all ${
                    index === step
                      ? 'border-accent bg-accent-soft text-accent font-semibold'
                      : index < step
                      ? 'border-line bg-surface text-ink'
                      : 'cursor-not-allowed border-line/60 bg-canvas text-muted'
                  }`}
                >
                  <span className="font-mono">{index + 1}</span>
                  <span>{label}</span>
                  {index < step && <CheckCircle2 size={14} className="ml-auto text-emerald-600" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-4">
          {step === 0 && <>
            <VariableSelector selectedIds={draft.variableIds} onToggle={toggleVariable} />
            {draft.variableIds.length >= 2 && <details className="mt-4"><summary className="cursor-pointer text-sm text-muted">Advanced chart options</summary><label className="mt-4 block text-sm">
               {t('chartPresentation')}
               <select className="ml-2 rounded-lg border border-line bg-surface p-2 text-xs font-semibold transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15" value={draft.chartLayout ?? 'separate'} onChange={(event) => updateDraft({ ...draft, chartLayout: event.target.value as 'separate' | 'combined' })}>
                 <option value="separate">{t('separateRecommended')}</option>
                 <option value="combined">{t('combined')}</option>
              </select>
               <p className="mt-2 text-xs text-muted">{t('separateHelp')}</p>
            </label></details>}
          </>}
          {step === 1 && (
            <div className="space-y-4">
               <RegionSelector
                 value={draft.regionId}
                 onChange={(regionId) => {
                   setMapDraftError(null)
                   setGeographicBounds(null)
                   setAreaName('')
                   setSelectedPoint(null)
                   updateDraft({ ...draft, regionId })
                 }}
                 onUseSuggestion={(variableIds) => updateDraft({ ...draft, variableIds })}
               />
               <MapSelector
                 key={draft.regionId}
                 center={region.center}
                 value={geographicBounds}
                 onChange={setGeographicBounds}
                 onValidationChange={setMapDraftError}
                 areaName={areaName}
                 onAreaNameChange={setAreaName}
               />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <TimeRangeSelector
                value={draft.timeRange}
                onChange={(timeRange) => updateDraft({ ...draft, timeRange })}
                error={timeError}
              />
               <section aria-labelledby="review-title" className="surface-panel p-4 sm:p-5">
                <h2 id="review-title" className="text-sm font-semibold text-ink">
                   {t('configurationSummary')}
                </h2>
                <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                     <dt className="text-muted">{t('selectedVariables')}</dt>
                     <dd className="mt-1 font-medium text-ink">{selectedVariableNames.join(', ') || t('noSelection')}</dd>
                  </div>
                  <div>
                     <dt className="text-muted">{t('studyRegion')}</dt>
                    <dd className="mt-1 font-medium text-ink">{geographicBounds ? `${areaName.trim() || 'Selected area'} · Latitude ${geographicBounds.south.toFixed(2)}° to ${geographicBounds.north.toFixed(2)}°, longitude ${geographicBounds.west.toFixed(2)}° to ${geographicBounds.east.toFixed(2)}°` : region.name}</dd>
                  </div>
                  <div>
                     <dt className="text-muted">{t('dataProvider')}</dt>
                    <dd className="mt-1 font-medium">
                      <select
                        value={draft.sourceId}
                        onChange={(event) => updateDraft({ ...draft, sourceId: event.target.value })}
                         className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-ink transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
                      >
                         <option value="nasa-power">{t('realData')}</option>
                         <option value="local-demo">{t('reproducibleDemo')}</option>
                      </select>
                    </dd>
                  </div>
                  <div>
                     <dt className="text-muted">{t('observationPeriod')}</dt>
                    <dd className="mt-1 font-medium text-ink">
                       {draft.timeRange.startDate || '—'} to {draft.timeRange.endDate || '—'} ({t('monthlyFrequency')})
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          )}
        </div>
      </div>

      {notice && (
        <p
          role={notice.error ? 'alert' : 'status'}
             className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
             notice.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-line bg-surface text-muted shadow-sm'
          }`}
        >
          <CircleHelp size={15} className="shrink-0" aria-hidden="true" />
          {notice.text}
        </p>
      )}

      {geoError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-sm">{geoError}</p>}

      {isLoading && (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-soft/65 p-3 text-xs font-medium text-accent shadow-sm"
        >
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
           Retrieving the NASA POWER time series and calculating OLS, Mann-Kendall, and confidence intervals…
        </p>
      )}

      {dataLoadState === 'error' && dataLoadError && (
         <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-sm">
          {dataLoadError}
        </p>
      )}

      {visualization && isPending && (
        <p role="status" className="text-xs text-muted">
           {t('pendingChanges')}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <Button
          variant="quiet"
          disabled={step === 0 || isLoading}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          <ArrowLeft size={15} aria-hidden="true" />
           {t('previous')}
        </Button>

        {step < steps.length - 1 ? (
          <Button
            variant="primary"
            disabled={!canContinue || isLoading}
            onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
          >
             {t('next')}
            <ArrowRight size={15} aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="primary" disabled={isLoading || geoError !== null} onClick={() => { void generate() }}>
            {isLoading ? (
              <>
                <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                 {t('analyzing')}
              </>
            ) : (
              <>
                 {t('generateAnalysis')}
                <ArrowRight size={15} aria-hidden="true" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, Compass, FlaskConical, LoaderCircle, Play, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { GlossaryModal } from '../components/common/GlossaryModal'
import { PageIntro } from '../components/common/PageIntro'
import { DetectiveWizard } from '../components/detective/DetectiveWizard'
import { MapSelector } from '../components/geography/MapSelector'
import { RegionSelector } from '../components/regions/RegionSelector'
import { TimeRangeSelector } from '../components/temporal/TimeRangeSelector'
import { VariableSelector } from '../components/variables/VariableSelector'
import { useResearch } from '../context/ResearchContext'
import { demoExamples, regions, variables } from '../data/mockData'
import type { DataConfiguration } from '../types'
import { validateGeographicSelection } from '../utils/configuration'

const steps = ['Variable', 'Ubicación', 'Periodo']

export function Dashboard() {
  const [step, setStep] = useState(0)
  const [showWizard, setShowWizard] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const [mapDraftError, setMapDraftError] = useState<string | null>(null)

  const {
    draft,
    visualization,
    updateDraft,
    toggleVariable,
    setGeographicBounds,
    geographicBounds,
    selectedPoint,
    setSelectedPoint,
    applyConfiguration,
    loadExample,
    notice,
    timeError,
    isPending,
    dataLoadState,
    dataLoadError,
  } = useResearch()
  const navigate = useNavigate()

  const region = regions.find((item) => item.id === draft.regionId) ?? regions[0]
  const selectedVariableNames = draft.variableIds
    .map((id) => variables.find((variable) => variable.id === id)?.name)
    .filter(Boolean)
  const isDemo = draft.sourceId === 'local-demo'

  async function generate() {
    if (geoError) return
    if (await applyConfiguration()) navigate('/trends')
  }

  function handleWizardComplete(config: Partial<DataConfiguration>) {
    setGeographicBounds(null)
    setSelectedPoint(null)
    setMapDraftError(null)
    updateDraft({
      ...draft,
      ...config,
    })
    setShowWizard(false)
    setStep(2) // Ir directamente al resumen / periodo
  }

  const isLoading = dataLoadState === 'loading'
  const geoError = mapDraftError ?? validateGeographicSelection(draft.sourceId, geographicBounds, selectedPoint)
  const canContinue = step === 0 ? draft.variableIds.length > 0 : step === 1 ? geoError === null : true

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageIntro
          eyebrow="INVESTIGACIÓN GUIADA"
          title="Detective del Sistema Tierra"
          description="Formula una hipótesis ambiental, elige variables, región y periodo, y comprueba si la tendencia es estadísticamente significativa."
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGlossary(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent shadow-2xs"
          >
            <BookOpen size={14} className="text-accent" />
            <span>Glosario del Detective</span>
          </button>
          <button
            type="button"
            onClick={() => setShowWizard(!showWizard)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
              showWizard
                ? 'border-accent bg-accent text-white'
                : 'border-accent/30 bg-accent-soft text-accent hover:bg-accent hover:text-white'
            }`}
          >
            <Compass size={14} />
            <span>{showWizard ? 'Cerrar Asistente' : 'Asistente Guiado (3 pasos)'}</span>
          </button>
        </div>
      </div>

      <GlossaryModal isOpen={showGlossary} onClose={() => setShowGlossary(false)} />

      {/* Banner de Asistente Guiado */}
      {showWizard && (
        <div className="animate-in fade-in duration-200">
          <DetectiveWizard onComplete={handleWizardComplete} />
        </div>
      )}

      {/* Notificación de proveedor */}
      <div className="flex items-start gap-3 rounded-lg border border-accent/15 bg-accent-soft/60 px-4 py-3.5">
        <FlaskConical size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted">
          <strong className="font-semibold text-ink">
            {isDemo ? 'Modo Sintético Demostrativo (DEMO).' : 'Fuente activa: NASA POWER (MERRA-2).'}
          </strong>{' '}
          {isDemo
            ? 'Las observaciones se generan con algoritmos matemáticos deterministas reproducibles (offline).'
            : 'Las observaciones mensuales se consultan en tiempo real vía API de NASA POWER y se evalúan mediante OLS, Mann-Kendall y Sen.'}
        </p>
      </div>

      <div inert={isLoading} aria-busy={isLoading}>
        {/* Ejemplos Demostrativos */}
        <details className="rounded-xl border border-line bg-surface p-4">
          <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <Sparkles size={16} className="text-accent" aria-hidden="true" />
            Ver ejemplos demostrativos de 1 clic (periodos largos ≥ 20 años)
          </summary>
          <p className="mt-2 text-xs text-muted">
            Carga un caso de estudio real con periodo largo para observar tendencias con alta potencia estadística:
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {demoExamples.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => {
                  loadExample(example.id)
                  setMapDraftError(null)
                  setStep(0)
                }}
                className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-line p-3 text-left hover:border-accent hover:bg-accent-soft/30 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-ink">{example.title}</span>
                  <span className="mt-1 block text-[11px] text-muted">{example.description}</span>
                </span>
                <Play size={15} className="shrink-0 text-accent" aria-hidden="true" />
              </button>
            ))}
          </div>
        </details>

        {/* Pasos numerados */}
        <nav aria-label="Pasos de la investigación" className="mt-4">
          <ol className="grid grid-cols-3 gap-2">
            {steps.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  disabled={index > step || isLoading}
                  aria-current={index === step ? 'step' : undefined}
                  onClick={() => setStep(index)}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-xs ${
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
          {step === 0 && <VariableSelector selectedIds={draft.variableIds} onToggle={toggleVariable} />}
          {step === 1 && (
            <div className="space-y-4">
              <RegionSelector
                value={draft.regionId}
                onChange={(regionId) => updateDraft({ ...draft, regionId })}
                onUseSuggestion={(variableIds) => updateDraft({ ...draft, variableIds })}
              />
              <MapSelector
                center={region.center}
                value={geographicBounds}
                point={selectedPoint}
                onChange={setGeographicBounds}
                onPointChange={setSelectedPoint}
                onValidationChange={setMapDraftError}
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
              <section aria-labelledby="review-title" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
                <h2 id="review-title" className="text-sm font-semibold text-ink">
                  Resumen de la configuración
                </h2>
                <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Variable(s) seleccionadas</dt>
                    <dd className="mt-1 font-medium text-ink">{selectedVariableNames.join(', ') || 'Sin selección'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Región de estudio</dt>
                    <dd className="mt-1 font-medium text-ink">{region.name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Proveedor de datos</dt>
                    <dd className="mt-1 font-medium">
                      <select
                        value={draft.sourceId}
                        onChange={(event) => updateDraft({ ...draft, sourceId: event.target.value })}
                        className="rounded border border-line bg-surface px-2.5 py-1 text-ink text-xs"
                      >
                        <option value="nasa-power">NASA POWER (MERRA-2 Real)</option>
                        <option value="local-demo">Datos Sintéticos (Demo reproducible)</option>
                      </select>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Periodo de observación</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {draft.timeRange.startDate || '—'} a {draft.timeRange.endDate || '—'} (Frecuencia mensual)
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
            notice.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-line bg-surface text-muted'
          }`}
        >
          <CircleHelp size={15} className="shrink-0" aria-hidden="true" />
          {notice.text}
        </p>
      )}

      {geoError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{geoError}</p>}

      {isLoading && (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-soft/40 p-3 text-xs text-accent"
        >
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          Consultando serie temporal en NASA POWER y calculando OLS, Mann-Kendall e intervalos de confianza…
        </p>
      )}

      {dataLoadState === 'error' && dataLoadError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {dataLoadError}
        </p>
      )}

      {visualization && isPending && (
        <p role="status" className="text-xs text-muted">
          Hay cambios en la configuración pendientes de analizar. Genera de nuevo el análisis para actualizar.
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-3 pt-2">
        <Button
          variant="quiet"
          disabled={step === 0 || isLoading}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Anterior
        </Button>

        {step < steps.length - 1 ? (
          <Button
            variant="primary"
            disabled={!canContinue || isLoading}
            onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
          >
            Siguiente
            <ArrowRight size={15} aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="primary" disabled={isLoading || geoError !== null} onClick={() => { void generate() }}>
            {isLoading ? (
              <>
                <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                Analizando tendencia…
              </>
            ) : (
              <>
                Generar serie y analizar
                <ArrowRight size={15} aria-hidden="true" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

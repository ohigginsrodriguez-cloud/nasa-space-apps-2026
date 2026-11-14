import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, FlaskConical, LoaderCircle, Play, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MapSelector } from '../components/geography/MapSelector'
import { Button } from '../components/common/Button'
import { PageIntro } from '../components/common/PageIntro'
import { RegionSelector } from '../components/regions/RegionSelector'
import { TimeRangeSelector } from '../components/temporal/TimeRangeSelector'
import { VariableSelector } from '../components/variables/VariableSelector'
import { useResearch } from '../context/ResearchContext'
import { demoExamples, regions, variables } from '../data/mockData'
import { validateGeographicSelection } from '../utils/configuration'

// El usuario sigue exactamente el flujo del challenge. El proveedor es una
// opción técnica interna y se muestra en los resultados, no como requisito.
const steps = ['Variable', 'Ubicación', 'Periodo']

export function Dashboard() {
  const [step, setStep] = useState(0)
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
  const selectedVariableNames = draft.variableIds.map((id) => variables.find((variable) => variable.id === id)?.name).filter(Boolean)
  const isDemo = draft.sourceId === 'local-demo'
  const geographicError = validateGeographicSelection(draft.sourceId, geographicBounds)

  async function generate() {
    if (await applyConfiguration()) navigate('/trends')
  }

  const isLoading = dataLoadState === 'loading'
  const canContinue = step === 0
    ? draft.variableIds.length > 0
    : step === 1
      ? !geographicError
      : true

  return (
    <div className="space-y-5">
      <PageIntro eyebrow="INVESTIGACIÓN GUIADA" title="Investiga un cambio ambiental" description="Elige qué investigar, dónde y durante cuánto tiempo. Después revisa la serie y la significancia de la tendencia." />

      <div className="flex items-start gap-3 rounded-lg border border-accent/15 bg-accent-soft/60 px-4 py-3.5">
        <FlaskConical size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
         <p className="text-xs leading-relaxed text-muted"><strong className="font-semibold text-ink">{isDemo ? 'Demo educativa.' : 'Fuente seleccionada: NASA POWER.'}</strong> {isDemo ? 'Las series y los resultados son sintéticos; no son observaciones NASA/NOAA.' : 'Los datos se consultan desde NASA POWER y el análisis estadístico se calcula en el backend.'}</p>
      </div>

      <div inert={isLoading} aria-busy={isLoading}>
        <details className="rounded-xl border border-line bg-surface p-4">
          <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden"><Sparkles size={16} className="text-accent" aria-hidden="true" />Ver ejemplos demostrativos</summary>
          <p className="mt-2 text-xs text-muted">Carga un ejemplo para revisar sus opciones y después generar el análisis.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {demoExamples.map((example) => <button key={example.id} type="button" onClick={() => { loadExample(example.id); setStep(0) }} className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-line p-3 text-left hover:border-accent hover:bg-accent-soft/30 focus-visible:outline-2 focus-visible:outline-accent">
              <span className="min-w-0"><span className="block text-xs font-medium">{example.title}</span><span className="mt-1 block text-[11px] text-muted">{example.description} · Simulado</span></span>
              <Play size={15} className="shrink-0 text-accent" aria-hidden="true" />
            </button>)}
          </div>
        </details>

        <nav aria-label="Pasos de la investigación">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {steps.map((label, index) => <li key={label}>
              <button type="button" disabled={index > step || isLoading} aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)} className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-xs ${index === step ? 'border-accent bg-accent-soft text-accent' : index < step ? 'border-line bg-surface text-ink' : 'cursor-not-allowed border-line/60 bg-canvas text-muted'}`}>
                <span className="font-mono">{index + 1}</span><span>{label}</span>{index < step && <CheckCircle2 size={14} className="ml-auto" aria-hidden="true" />}
              </button>
            </li>)}
          </ol>
        </nav>

        {step === 0 && <VariableSelector selectedIds={draft.variableIds} onToggle={toggleVariable} />}
        {step === 1 && <>
          <RegionSelector value={draft.regionId} onChange={(regionId) => updateDraft({ ...draft, regionId })} onUseSuggestion={(variableIds) => updateDraft({ ...draft, variableIds })} />
          <MapSelector center={region.center} value={geographicBounds} point={selectedPoint} onChange={setGeographicBounds} onPointChange={setSelectedPoint} />
          {geographicError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{geographicError}</p>}
        </>}
        {step === 2 && <>
          <TimeRangeSelector value={draft.timeRange} onChange={(timeRange) => updateDraft({ ...draft, timeRange })} error={timeError} />
          <section aria-labelledby="review-title" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <h2 id="review-title" className="text-sm font-semibold">Resumen de la investigación</h2>
            <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div><dt className="text-muted">Variable(s)</dt><dd className="mt-1 font-medium">{selectedVariableNames.join(', ') || 'Sin selección'}</dd></div>
            <div><dt className="text-muted">Región</dt><dd className="mt-1 font-medium">{region.name}</dd></div>
              <div><dt className="text-muted">Proveedor</dt><dd className="mt-1 font-medium">
                <select value={draft.sourceId} onChange={(event) => updateDraft({ ...draft, sourceId: event.target.value })} className="ml-2 rounded border border-line bg-surface px-2 py-1">
                  <option value="nasa-power">NASA POWER (real)</option>
                  <option value="local-demo">Datos sintéticos (demo)</option>
                </select>
              </dd></div>
              <div><dt className="text-muted">Periodo mensual</dt><dd className="mt-1 font-medium">{draft.timeRange.startDate || '—'} a {draft.timeRange.endDate || '—'}</dd></div>
            </dl>
          </section>
          {geographicError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{geographicError}</p>}
        </>}
      </div>

      {notice && <p role={notice.error ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${notice.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-line bg-surface text-muted'}`}><CircleHelp size={15} className="shrink-0" aria-hidden="true" />{notice.text}</p>}
      {isLoading && <p role="status" aria-live="polite" className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-soft/40 p-3 text-xs text-accent"><LoaderCircle size={16} className="animate-spin" aria-hidden="true" />Cargando la serie temporal y preparando el análisis…</p>}
      {dataLoadState === 'error' && dataLoadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{dataLoadError}</p>}
      {visualization && isPending && <p role="status" className="text-xs text-muted">Hay cambios sin analizar. Genera de nuevo el análisis al terminar de configurar.</p>}

      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="quiet" disabled={step === 0 || isLoading} onClick={() => setStep((current) => Math.max(0, current - 1))}><ArrowLeft size={15} aria-hidden="true" />Anterior</Button>
        {step < steps.length - 1
          ? <Button variant="primary" disabled={!canContinue || isLoading} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Siguiente<ArrowRight size={15} aria-hidden="true" /></Button>
          : <Button variant="primary" disabled={isLoading || Boolean(geographicError)} onClick={() => { void generate() }}>{isLoading ? <><LoaderCircle size={15} className="animate-spin" aria-hidden="true" />Cargando serie…</> : <>Generar serie y analizar<ArrowRight size={15} aria-hidden="true" /></>}</Button>}
      </div>
    </div>
  )
}

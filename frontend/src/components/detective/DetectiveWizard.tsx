import { useState } from 'react'
import { ArrowRight, Compass, Flame, Leaf, Sparkles, Sun, Umbrella, Wind } from 'lucide-react'
import type { DataConfiguration, RegionId, VariableId } from '../../types'
import { regions } from '../../data/mockData'

interface DetectiveWizardProps {
  onComplete: (config: Partial<DataConfiguration>) => void
}

const phenomena = [
  {
    id: 'warming',
    title: 'Calentamiento y Extremos Térmicos',
    icon: Flame,
    desc: 'Investiga el alza de temperaturas y cambios en la presión atmosférica.',
    suggestedVars: ['temperature', 'surface_pressure'] as VariableId[],
  },
  {
    id: 'drought',
    title: 'Lluvias, Sequías y Agua',
    icon: Umbrella,
    desc: 'Analiza si las lluvias acumuladas o la humedad del suelo se reducen.',
    suggestedVars: ['precipitation', 'soil_moisture'] as VariableId[],
  },
  {
    id: 'solar',
    title: 'Radiación Solar y Energía',
    icon: Sun,
    desc: 'Estudia cómo cambia la energía solar incidente en superficie.',
    suggestedVars: ['solar_radiation', 'temperature'] as VariableId[],
  },
  {
    id: 'vegetation',
    title: 'Humedad de Suelo y Vegetación',
    icon: Leaf,
    desc: 'Monitorea la disponibilidad de agua en la zona de raíces.',
    suggestedVars: ['soil_moisture', 'relative_humidity'] as VariableId[],
  },
  {
    id: 'urban',
    title: 'Viento y Clima Urbano',
    icon: Wind,
    desc: 'Evalúa la dinámica de viento y humedad relativa en metrópolis.',
    suggestedVars: ['wind_speed', 'relative_humidity'] as VariableId[],
  },
]

const locations = regions.map((region) => ({
  id: region.id, name: region.name, type: region.description, desc: region.prompt,
}))

const timeSpans = [
  {
    id: '30yr',
    label: '30 años (1995–2024)',
    desc: 'Periodo largo para estudiar cambios; la significancia depende de los datos.',
    start: '1995-01-01',
    end: '2024-12-01',
  },
  {
    id: '20yr',
    label: '20 años (2005–2024)',
    desc: 'Periodo recomendado para identificar señales decadalmente robustas.',
    start: '2005-01-01',
    end: '2024-12-01',
  },
  {
    id: '15yr',
    label: '15 años (2010–2024)',
    desc: 'Análisis de la última década y media reciente.',
    start: '2010-01-01',
    end: '2024-12-01',
  },
]

export function DetectiveWizard({ onComplete }: DetectiveWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedPhenomenon, setSelectedPhenomenon] = useState(phenomena[0].id)
  const [selectedLocation, setSelectedLocation] = useState<RegionId>('sonoran-desert')
  const [selectedSpan, setSelectedSpan] = useState(timeSpans[0].id)

  function finish() {
    const phen = phenomena.find((p) => p.id === selectedPhenomenon) ?? phenomena[0]
    const span = timeSpans.find((s) => s.id === selectedSpan) ?? timeSpans[0]

    onComplete({
      variableIds: phen.suggestedVars,
      regionId: selectedLocation,
      timeRange: {
        startDate: span.start,
        endDate: span.end,
        interval: 'monthly',
      },
    })
  }

  return (
    <div className="rounded-2xl border border-accent/25 bg-surface p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-line pb-3.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-white">
          <Compass size={20} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
            Asistente del Detective Ambiental
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-accent">Modo Guiado</span>
          </h2>
          <p className="text-xs text-muted">Responde 3 preguntas guiadas para configurar una investigación científica lista.</p>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="mt-4 flex items-center gap-2 text-xs">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
              step === num
                ? 'bg-accent text-white'
                : step > num
                ? 'bg-accent-soft text-accent'
                : 'bg-canvas text-muted border border-line'
            }`}
          >
            <span>{num}.</span>
            <span>
              {num === 1 ? 'Fenómeno' : num === 2 ? 'Ecosistema' : 'Periodo temporal'}
            </span>
          </div>
        ))}
      </div>

      {/* Pregunta 1: Fenómeno */}
      {step === 1 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold text-ink">
            1. ¿Qué tipo de proceso ambiental o cambio te interesa detectar?
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {phenomena.map((item) => {
              const Icon = item.icon
              const isSelected = selectedPhenomenon === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPhenomenon(item.id)}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent-soft/40 shadow-xs'
                      : 'border-line bg-surface hover:border-accent/40'
                  }`}
                >
                  <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-accent text-white' : 'bg-canvas text-muted'}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-ink">{item.title}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{item.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Pregunta 2: Lugar */}
      {step === 2 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold text-ink">
            2. ¿En qué región o ecosistema deseas investigar la tendencia?
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {locations.map((loc) => {
              const isSelected = selectedLocation === loc.id
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`flex flex-col rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent-soft/40 shadow-xs'
                      : 'border-line bg-surface hover:border-accent/40'
                  }`}
                >
                  <span className="text-xs font-bold text-ink">{loc.name}</span>
                  <span className="mt-0.5 text-[11px] font-medium text-accent">{loc.type}</span>
                  <span className="mt-1 text-[11px] text-muted">{loc.desc}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Pregunta 3: Periodo */}
      {step === 3 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold text-ink">
            3. ¿Cuántos años de observaciones deseas abarcar?
          </p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {timeSpans.map((span) => {
              const isSelected = selectedSpan === span.id
              return (
                <button
                  key={span.id}
                  type="button"
                  onClick={() => setSelectedSpan(span.id)}
                  className={`flex flex-col rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-accent bg-accent-soft/40 shadow-xs'
                      : 'border-line bg-surface hover:border-accent/40'
                  }`}
                >
                  <span className="text-xs font-bold text-ink">{span.label}</span>
                  <span className="mt-1 text-[11px] text-muted leading-relaxed">{span.desc}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Botones de navegación del asistente */}
      <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-medium text-muted hover:text-ink"
          >
            Anterior
          </button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
          >
            <span>Continuar</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover shadow-sm"
          >
            <Sparkles size={14} />
            <span>Configurar investigación sugerida</span>
          </button>
        )}
      </div>
    </div>
  )
}

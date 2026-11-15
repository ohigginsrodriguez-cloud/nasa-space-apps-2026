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
    title: 'Warming and thermal extremes',
    icon: Flame,
    desc: 'Investigate rising temperatures and changes in atmospheric pressure.',
    suggestedVars: ['temperature', 'surface_pressure'] as VariableId[],
  },
  {
    id: 'drought',
    title: 'Rainfall, drought, and water',
    icon: Umbrella,
    desc: 'Analyze whether accumulated rainfall or soil moisture is declining.',
    suggestedVars: ['precipitation', 'soil_moisture'] as VariableId[],
  },
  {
    id: 'solar',
    title: 'Solar radiation and energy',
    icon: Sun,
    desc: 'Study how incident solar energy at the surface changes.',
    suggestedVars: ['solar_radiation', 'temperature'] as VariableId[],
  },
  {
    id: 'vegetation',
    title: 'Soil moisture and vegetation',
    icon: Leaf,
    desc: 'Monitor water availability in the root zone.',
    suggestedVars: ['soil_moisture', 'relative_humidity'] as VariableId[],
  },
  {
    id: 'urban',
    title: 'Wind and urban climate',
    icon: Wind,
    desc: 'Evaluate wind and relative humidity dynamics in cities.',
    suggestedVars: ['wind_speed', 'relative_humidity'] as VariableId[],
  },
]

const locations = regions.map((region) => ({
  id: region.id, name: region.name, type: region.description, desc: region.prompt,
}))

const timeSpans = [
  {
    id: '30yr',
    label: '30 years (1995–2024)',
    desc: 'A long period for studying change; significance depends on the data.',
    start: '1995-01-01',
    end: '2024-12-01',
  },
  {
    id: '20yr',
    label: '20 years (2005–2024)',
    desc: 'Recommended period for identifying robust decadal signals.',
    start: '2005-01-01',
    end: '2024-12-01',
  },
  {
    id: '15yr',
    label: '15 years (2010–2024)',
    desc: 'Analysis of the most recent decade and a half.',
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
    <div className="surface-panel border-accent/25 p-5 sm:p-6">
      <div className="flex items-center gap-2.5 border-b border-line pb-3.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-white">
          <Compass size={20} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
            Environmental detective wizard
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">Guided mode</span>
          </h2>
          <p className="text-sm text-muted">Answer three guided questions to set up a ready-to-run investigation.</p>
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
               {num === 1 ? 'Phenomenon' : num === 2 ? 'Ecosystem' : 'Time period'}
            </span>
          </div>
        ))}
      </div>

      {/* Pregunta 1: Fenómeno */}
      {step === 1 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold text-ink">
             1. What environmental process or change would you like to detect?
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
                   className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-accent bg-accent-soft/40 shadow-xs'
                       : 'border-line bg-surface hover:border-accent/40 hover:shadow-sm'
                  }`}
                >
                  <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-accent text-white' : 'bg-canvas text-muted'}`}>
                    <Icon size={18} />
                  </span>
                  <div>
                     <span className="block text-sm font-bold text-ink">{item.title}</span>
                     <span className="mt-1 block text-sm leading-relaxed text-muted">{item.desc}</span>
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
             2. Which region or ecosystem would you like to investigate?
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {locations.map((loc) => {
              const isSelected = selectedLocation === loc.id
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setSelectedLocation(loc.id)}
                   className={`flex flex-col rounded-xl border p-3.5 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-accent bg-accent-soft/40 shadow-xs'
                       : 'border-line bg-surface hover:border-accent/40 hover:shadow-sm'
                  }`}
                >
                   <span className="text-sm font-bold text-ink">{loc.name}</span>
                   <span className="mt-1 text-xs font-medium text-accent">{loc.type}</span>
                   <span className="mt-1 text-sm leading-relaxed text-muted">{loc.desc}</span>
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
             3. How many years of observations should we examine?
          </p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {timeSpans.map((span) => {
              const isSelected = selectedSpan === span.id
              return (
                <button
                  key={span.id}
                  type="button"
                  onClick={() => setSelectedSpan(span.id)}
                   className={`flex flex-col rounded-xl border p-3.5 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-accent bg-accent-soft/40 shadow-xs'
                       : 'border-line bg-surface hover:border-accent/40 hover:shadow-sm'
                  }`}
                >
                   <span className="text-sm font-bold text-ink">{span.label}</span>
                   <span className="mt-1 text-sm leading-relaxed text-muted">{span.desc}</span>
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
             className="rounded-lg border border-line px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
          >
             Back
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
             <span>Continue</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover shadow-sm"
          >
            <Sparkles size={14} />
             <span>Configure suggested investigation</span>
          </button>
        )}
      </div>
    </div>
  )
}

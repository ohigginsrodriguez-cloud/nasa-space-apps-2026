import { MapPin, Sparkles } from 'lucide-react'
import { regions } from '../../data/mockData'
import type { RegionId, VariableId } from '../../types'
import { SectionTitle } from '../common/SectionTitle'

interface RegionSelectorProps {
  value: RegionId
  onChange: (regionId: RegionId) => void
  onUseSuggestion: (variableIds: VariableId[]) => void
}

const fieldClass = 'mt-2 block min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent'

export function RegionSelector({ value, onChange, onUseSuggestion }: RegionSelectorProps) {
  const region = regions.find((item) => item.id === value) ?? regions[0]
  const suggestedNames = region.suggestedVariables.map((id) => id === 'temperature' ? 'temperatura' : 'precipitación').join(' y ')

  return (
    <section id="preset-region" aria-labelledby="region-title" className="scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <SectionTitle id="region-title" title="¿Dónde quieres investigar?" description="Elige un área de interés para orientar tu pregunta.">
        <MapPin size={18} className="text-accent" aria-hidden="true" />
      </SectionTitle>
      <label className="block text-xs font-medium">Región de estudio
        <select value={value} onChange={(event) => {
          const selected = regions.find((item) => item.id === event.target.value)
          if (selected) onChange(selected.id)
        }} className={fieldClass}>
          {regions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <div className="mt-4 rounded-lg border border-accent/15 bg-accent-soft/50 p-4">
        <p className="text-xs font-medium text-muted">{region.description}</p>
        <p className="flex items-center gap-2 text-xs font-semibold text-accent"><Sparkles size={15} aria-hidden="true" />Pista de exploración</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{region.prompt}</p>
        <p className="mt-2 text-xs text-muted">Variables sugeridas: {suggestedNames}. Una pista para formular preguntas; no es una conclusión científica.</p>
        <button type="button" onClick={() => onUseSuggestion(region.suggestedVariables)} className="mt-3 min-h-10 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-accent hover:border-accent">
          Usar variables sugeridas
        </button>
      </div>
    </section>
  )
}

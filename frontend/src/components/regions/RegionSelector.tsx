import { MapPin, Sparkles } from 'lucide-react'
import { regions, variables } from '../../data/mockData'
import type { RegionId, VariableId } from '../../types'
import { SectionTitle } from '../common/SectionTitle'
import { useLanguage } from '../../context/LanguageContext'

interface RegionSelectorProps {
  value: RegionId
  onChange: (regionId: RegionId) => void
  onUseSuggestion: (variableIds: VariableId[]) => void
}

const fieldClass = 'mt-2 block min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15'

export function RegionSelector({ value, onChange, onUseSuggestion }: RegionSelectorProps) {
  const region = regions.find((item) => item.id === value) ?? regions[0]
  const { language } = useLanguage()
  const suggestedNames = region.suggestedVariables.map((id) => variables.find((variable) => variable.id === id)?.name ?? id).join(', ')

  return (
    <section id="preset-region" aria-labelledby="region-title" className="surface-panel scroll-mt-6 p-5 sm:p-6">
       <SectionTitle id="region-title" title={language === 'en' ? 'Where should we investigate?' : '¿Dónde quieres investigar?'} description={language === 'en' ? 'Choose a region of Mexico to focus your question.' : 'Elige una región de México para orientar tu pregunta.'}>
        <MapPin size={18} className="text-accent" aria-hidden="true" />
      </SectionTitle>
       <label className="block text-xs font-medium">{language === 'en' ? 'Study region' : 'Región de estudio'}
        <select value={value} onChange={(event) => {
          const selected = regions.find((item) => item.id === event.target.value)
          if (selected) onChange(selected.id)
        }} className={fieldClass}>
          {regions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <div className="mt-4 rounded-lg border border-accent/20 bg-accent-soft/65 p-4">
        <p className="text-xs font-medium text-muted">{region.description}</p>
         <p className="mt-3 flex items-center gap-2 text-xs font-bold text-accent"><Sparkles size={15} aria-hidden="true" />{language === 'en' ? 'Exploration prompt' : 'Pista de exploración'}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{region.prompt}</p>
         <p className="mt-2 text-xs text-muted">{language === 'en' ? 'Suggested variables' : 'Variables sugeridas'}: {suggestedNames}. {language === 'en' ? 'Use this as a question prompt, not a scientific conclusion.' : 'Una pista para formular preguntas; no es una conclusión científica.'}</p>
        <button type="button" onClick={() => onUseSuggestion(region.suggestedVariables)} className="mt-3 min-h-10 rounded-lg border border-accent/30 bg-surface px-3 py-2 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent hover:text-white">
           {language === 'en' ? 'Use suggested variables' : 'Usar variables sugeridas'}
        </button>
      </div>
    </section>
  )
}

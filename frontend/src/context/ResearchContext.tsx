import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { defaultConfiguration, demoExamples } from '../data/mockData'
import type { DataConfiguration, GeographicBounds, GeographicPoint, VariableId } from '../types'
import { sameConfiguration, validateConfiguration, validateTimeRange } from '../utils/configuration'

interface Notice {
  text: string
  error: boolean
}

interface ResearchContextValue {
  draft: DataConfiguration
  visualization: DataConfiguration | null
  geographicBounds: GeographicBounds | null
  selectedPoint: GeographicPoint | null
  notice: Notice | null
  timeError: string | null
  updateDraft: (configuration: DataConfiguration) => void
  toggleVariable: (id: VariableId) => void
  setVariableSelection: (ids: VariableId[]) => void
  setGeographicBounds: (bounds: GeographicBounds | null) => void
  setSelectedPoint: (point: GeographicPoint | null) => void
  applyConfiguration: () => boolean
  loadExample: (exampleId: string) => void
  isPending: boolean
}

const ResearchContext = createContext<ResearchContextValue | null>(null)

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<DataConfiguration>(defaultConfiguration)
  const [visualization, setVisualization] = useState<DataConfiguration | null>(null)
  const [geographicBounds, setGeographicBounds] = useState<GeographicBounds | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<GeographicPoint | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [timeError, setTimeError] = useState<string | null>(null)

  function updateDraft(next: DataConfiguration) {
    setDraft(next)
    setNotice(null)
    setTimeError(null)
  }

  function toggleVariable(id: VariableId) {
    updateDraft({
      ...draft,
      variableIds: draft.variableIds.includes(id)
        ? draft.variableIds.filter((item) => item !== id)
        : [...draft.variableIds, id],
    })
  }

  // Actualiza toda la selección en una sola operación para evitar estados
  // intermedios al seleccionar o limpiar varias variables.
  function setVariableSelection(ids: VariableId[]) {
    updateDraft({ ...draft, variableIds: ids })
  }

  function applyConfiguration(): boolean {
    const error = validateConfiguration(draft)
    setTimeError(validateTimeRange(draft.timeRange))
    if (error) {
      setNotice({ text: error, error: true })
      return false
    }
    setVisualization(draft)
    setNotice({ text: 'Análisis generado a partir de la serie sintética de demostración.', error: false })
    return true
  }

  function loadExample(exampleId: string) {
    const example = demoExamples.find((item) => item.id === exampleId)
    if (!example) return
    const configuration = { ...defaultConfiguration, regionId: example.regionId, variableIds: example.variableIds }
    setDraft(configuration)
    setVisualization(null)
    setGeographicBounds(null)
    setSelectedPoint(null)
    setTimeError(null)
    setNotice({ text: `Ejemplo cargado: ${example.title}`, error: false })
  }

  const isPending = visualization !== null && !sameConfiguration(draft, visualization)
  const value = useMemo(() => ({
    draft, visualization, geographicBounds, selectedPoint, notice, timeError, isPending,
    updateDraft, toggleVariable, setVariableSelection, setGeographicBounds, setSelectedPoint, applyConfiguration, loadExample,
  }), [draft, visualization, geographicBounds, selectedPoint, notice, timeError, isPending])

  return <ResearchContext.Provider value={value}>{children}</ResearchContext.Provider>
}

export function useResearch(): ResearchContextValue {
  const context = useContext(ResearchContext)
  if (!context) throw new Error('useResearch debe utilizarse dentro de ResearchProvider.')
  return context
}

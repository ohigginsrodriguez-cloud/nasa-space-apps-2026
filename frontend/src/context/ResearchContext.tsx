import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { defaultConfiguration, demoExamples } from '../data/mockData'
import type { DataConfiguration, GeographicBounds, GeographicPoint, TimeSeriesDataset, VariableId } from '../types'
import { runAnalysis } from '../services/api'
import { sameConfiguration, validateConfiguration, validateGeographicSelection, validateTimeRange } from '../utils/configuration'

type DataLoadState = 'idle' | 'loading' | 'success' | 'error'

interface Notice {
  text: string
  error: boolean
}

interface ResearchContextValue {
  draft: DataConfiguration
  visualization: DataConfiguration | null
  dataset: TimeSeriesDataset | null
  dataLoadState: DataLoadState
  dataLoadError: string | null
  geographicBounds: GeographicBounds | null
  selectedPoint: GeographicPoint | null
  notice: Notice | null
  timeError: string | null
  updateDraft: (configuration: DataConfiguration) => void
  toggleVariable: (id: VariableId) => void
  setGeographicBounds: (bounds: GeographicBounds | null) => void
  setSelectedPoint: (point: GeographicPoint | null) => void
  applyConfiguration: () => Promise<boolean>
  loadExample: (exampleId: string) => void
  isPending: boolean
}

const ResearchContext = createContext<ResearchContextValue | null>(null)

function sameGeography(
  boundsA: GeographicBounds | null,
  pointA: GeographicPoint | null,
  boundsB: GeographicBounds | null,
  pointB: GeographicPoint | null,
): boolean {
  return JSON.stringify(boundsA) === JSON.stringify(boundsB)
    && JSON.stringify(pointA) === JSON.stringify(pointB)
}

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<DataConfiguration>(defaultConfiguration)
  const [visualization, setVisualization] = useState<DataConfiguration | null>(null)
  const [dataset, setDataset] = useState<TimeSeriesDataset | null>(null)
  const [dataLoadState, setDataLoadState] = useState<DataLoadState>('idle')
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const [geographicBounds, setGeographicBounds] = useState<GeographicBounds | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<GeographicPoint | null>(null)
  const [visualizationBounds, setVisualizationBounds] = useState<GeographicBounds | null>(null)
  const [visualizationPoint, setVisualizationPoint] = useState<GeographicPoint | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [timeError, setTimeError] = useState<string | null>(null)

  function updateDraft(next: DataConfiguration) {
    if (next.regionId !== draft.regionId) {
      setGeographicBounds(null)
      setSelectedPoint(null)
    }
    setDraft(next)
    setNotice(null)
    setTimeError(null)
    if (dataLoadState === 'error') {
      setDataLoadState('idle')
      setDataLoadError(null)
    }
  }

  function toggleVariable(id: VariableId) {
    updateDraft({
      ...draft,
      variableIds: draft.variableIds.includes(id)
        ? draft.variableIds.filter((item) => item !== id)
        : [...draft.variableIds, id],
    })
  }

  async function applyConfiguration(): Promise<boolean> {
    const error = validateConfiguration(draft)
      ?? validateGeographicSelection(draft.sourceId, geographicBounds, selectedPoint)
    setTimeError(validateTimeRange(draft.timeRange))
    if (error) {
      setDataLoadState('idle')
      setDataLoadError(null)
      setNotice({ text: error, error: true })
      return false
    }
    setDataLoadState('loading')
    setDataLoadError(null)
    setNotice(null)
    try {
      const configuration = { ...draft, variableIds: [...draft.variableIds], timeRange: { ...draft.timeRange } }
      const loadedDataset = await runAnalysis(configuration, geographicBounds, selectedPoint)
       if (!loadedDataset.points.length) throw new Error('No data is available within the selected period.')
      setDataset(loadedDataset)
      setVisualization(configuration)
      setVisualizationBounds(geographicBounds)
      setVisualizationPoint(selectedPoint)
      setDataLoadState('success')
      setNotice({ text: 'Series loaded. Review the chart and trend analysis.', error: false })
      return true
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setDataLoadError(`The time series could not be loaded: ${reason}`)
      setDataLoadState('error')
      return false
    }
  }

  function loadExample(exampleId: string) {
    const example = demoExamples.find((item) => item.id === exampleId)
    if (!example) return
    const configuration = { ...defaultConfiguration, regionId: example.regionId, variableIds: example.variableIds, timeRange: example.timeRange, sourceId: 'nasa-power' }
    setDraft(configuration)
    setVisualization(null)
    setDataset(null)
    setVisualizationBounds(null)
    setVisualizationPoint(null)
    setDataLoadState('idle')
    setDataLoadError(null)
    setGeographicBounds(null)
    setSelectedPoint(null)
    setTimeError(null)
    setNotice({ text: `Example loaded: ${example.title}`, error: false })
  }

  const isPending = visualization !== null
    && (!sameConfiguration(draft, visualization)
      || !sameGeography(geographicBounds, selectedPoint, visualizationBounds, visualizationPoint))
  const value = useMemo(() => ({
    draft, visualization, dataset, dataLoadState, dataLoadError, geographicBounds, selectedPoint, notice, timeError, isPending,
    updateDraft, toggleVariable, setGeographicBounds, setSelectedPoint, applyConfiguration, loadExample,
  }), [draft, visualization, dataset, dataLoadState, dataLoadError, geographicBounds, selectedPoint, notice, timeError, isPending])

  return <ResearchContext.Provider value={value}>{children}</ResearchContext.Provider>
}

export function useResearch(): ResearchContextValue {
  const context = useContext(ResearchContext)
  if (!context) throw new Error('useResearch debe utilizarse dentro de ResearchProvider.')
  return context
}

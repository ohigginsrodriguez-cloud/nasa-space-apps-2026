import { useEffect, useMemo, useState } from 'react'
import { variables } from '../../data/mockData'
import { getVariables } from '../../services/api'
import type { BackendVariable, EnvironmentalVariable, VariableId } from '../../types'
import { SectionTitle } from '../common/SectionTitle'
import { VariableCard } from './VariableCard'

interface VariableSelectorProps {
  selectedIds: VariableId[]
  onToggle: (id: VariableId) => void
}

export function VariableSelector({ selectedIds, onToggle }: VariableSelectorProps) {
  const [catalog, setCatalog] = useState<BackendVariable[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)

  useEffect(() => {
    getVariables('nasa-power')
      .then(setCatalog)
      .catch(() => setCatalogError('Using the verified local NASA POWER variable catalog.'))
  }, [])

  const displayVariables = useMemo<EnvironmentalVariable[]>(
    () => variables.map((variable) => {
      const metadata = catalog.find((item) => item.id === variable.id)
      return {
        ...variable,
        demoId: variable.id,
        category: variable.id === 'precipitation'
          ? 'Hydrology'
          : variable.id === 'soil_moisture'
          ? 'Land surface'
          : variable.id === 'solar_radiation'
          ? 'Energy'
          : 'Atmosphere',
        dataType: 'Continuous',
        temporalResolution: 'Monthly',
        geographicCoverage: 'Global; spatial resolution depends on the product',
        potentialSources: [metadata?.product ?? 'NASA POWER (product varies by variable)'],
        integrationStatus: 'demo',
        available: metadata?.available ?? true,
      }
    }),
    [catalog],
  )

  return (
    <section id="variables" aria-labelledby="variables-title" className="surface-panel scroll-mt-6 border-accent/20 bg-linear-to-br from-accent-soft/35 via-surface to-surface p-5 sm:p-6">
      <SectionTitle
        id="variables-title"
        title="Which Earth system variable should we investigate?"
        description="Select one or more variables from the NASA POWER catalog. Each card includes an information icon with its meaning and source."
      >
        <span className="text-sm font-semibold text-accent" aria-live="polite">{selectedIds.length} selected</span>
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayVariables.map((variable) => (
          <VariableCard
            key={variable.id}
            variable={variable}
            selected={selectedIds.includes(variable.id as VariableId)}
            onToggle={() => onToggle(variable.id as VariableId)}
            compact
          />
        ))}
      </div>
      {catalogError && <p role="status" className="mt-3 text-sm text-muted">{catalogError}</p>}
    </section>
  )
}

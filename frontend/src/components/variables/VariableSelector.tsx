import { useEffect, useMemo, useState } from 'react'
import { Info, X } from 'lucide-react'
import { variables } from '../../data/mockData'
import { getVariables } from '../../services/api'
import type { BackendVariable, VariableId } from '../../types'
import { SectionTitle } from '../common/SectionTitle'

interface VariableSelectorProps {
  selectedIds: VariableId[]
  onToggle: (id: VariableId) => void
}

export function VariableSelector({ selectedIds, onToggle }: VariableSelectorProps) {
  const [catalog, setCatalog] = useState<BackendVariable[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [openInfo, setOpenInfo] = useState<VariableId | null>(null)

  useEffect(() => {
    getVariables('nasa-power').then(setCatalog)
      .catch(() => setCatalogError('Using the verified local NASA POWER variable catalog.'))
  }, [])

  const selectedVariables = useMemo(
    () => variables.filter((variable) => selectedIds.includes(variable.id)),
    [selectedIds],
  )

  function addVariable(id: VariableId) {
    if (!id) return
    if (!selectedIds.includes(id)) onToggle(id)
  }

  return (
    <section id="variables" aria-labelledby="variables-title" className="surface-panel scroll-mt-6 border-accent/20 bg-linear-to-br from-accent-soft/35 via-surface to-surface p-5 sm:p-6">
      <SectionTitle
        id="variables-title"
        title="What would you like to measure?"
        description="Add one variable to begin. Add a second only when your question involves related changes."
      >
        <span className="text-sm font-semibold text-accent" aria-live="polite">{selectedIds.length} selected</span>
      </SectionTitle>

      <details className="rounded-lg border border-accent/25 bg-accent-soft/35 p-3">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-bold text-accent">
          <span>Add a NASA POWER variable</span>
          <span className="text-xs font-normal text-muted">Choose one at a time</span>
        </summary>
        <div className="mt-3 space-y-2 border-t border-accent/15 pt-3">
          {variables.map((variable) => {
            const selected = selectedIds.includes(variable.id)
            const infoOpen = openInfo === variable.id
            return (
              <div key={variable.id} className="rounded-lg border border-line bg-surface p-2.5">
                <div className="flex items-center gap-2">
                  <button type="button" disabled={selected} onClick={() => addVariable(variable.id)} className="min-h-11 min-w-0 flex-1 text-left text-sm font-semibold text-ink disabled:cursor-default disabled:text-muted">
                    {variable.name}{selected ? ' · selected' : ''}
                  </button>
                  <button type="button" onClick={() => setOpenInfo(infoOpen ? null : variable.id)} title={`About ${variable.name}`} aria-label={`About ${variable.name}`} aria-expanded={infoOpen} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/30 text-accent hover:bg-accent hover:text-white">
                    <Info size={16} aria-hidden="true" />
                  </button>
                </div>
                {infoOpen && <p className="border-t border-line pt-2 text-sm leading-relaxed text-muted">{variable.description}</p>}
              </div>
            )
          })}
        </div>
      </details>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Start with one. Add another only to explore related changes—not to prove causality.
      </p>

      {selectedVariables.length > 0 ? (
        <div className="mt-5 space-y-2" aria-label="Selected variables">
          <p className="text-sm font-bold text-ink">Your investigation variables</p>
          {selectedVariables.map((variable) => {
            const metadata = catalog.find((item) => item.id === variable.id)
            const infoOpen = openInfo === variable.id
            return (
              <div key={variable.id} className="rounded-lg border border-accent/25 bg-accent-soft/45 p-3">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{variable.name}</span>
                    <span className="block text-xs text-muted">{metadata?.unit ?? variable.unit} · NASA POWER</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenInfo(infoOpen ? null : variable.id)}
                    title={`About ${variable.name}`}
                    aria-label={`About ${variable.name}`}
                    aria-expanded={infoOpen}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-surface text-accent hover:bg-accent hover:text-white"
                  >
                    <Info size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(variable.id)}
                    title={`Remove ${variable.name}`}
                    aria-label={`Remove ${variable.name}`}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted hover:border-signal hover:text-signal"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                {infoOpen && (
                  <p className="mt-3 border-t border-accent/15 pt-3 text-sm leading-relaxed text-muted">
                    {variable.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-line p-4 text-sm text-muted">
          Choose a variable above to begin your investigation.
        </p>
      )}
      {catalogError && <p role="status" className="mt-3 text-sm text-muted">{catalogError}</p>}
    </section>
  )
}

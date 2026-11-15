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
  const [pendingId, setPendingId] = useState('')
  const [openInfo, setOpenInfo] = useState<VariableId | null>(null)

  useEffect(() => {
    getVariables('nasa-power').then(setCatalog)
      .catch(() => setCatalogError('Using the verified local NASA POWER variable catalog.'))
  }, [])

  const selectedVariables = useMemo(
    () => variables.filter((variable) => selectedIds.includes(variable.id)),
    [selectedIds],
  )

  function addVariable(id: string) {
    if (!id) return
    if (!selectedIds.includes(id as VariableId)) onToggle(id as VariableId)
    setPendingId('')
  }

  return (
    <section id="variables" aria-labelledby="variables-title" className="surface-panel scroll-mt-6 p-5 sm:p-6">
      <SectionTitle
        id="variables-title"
        title="What would you like to measure?"
        description="Add one variable to begin. Add a second only when your question involves related changes."
      >
        <span className="text-sm font-semibold text-accent" aria-live="polite">{selectedIds.length} selected</span>
      </SectionTitle>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 text-sm font-semibold" htmlFor="variable-picker">
          Add a variable
          <select
            id="variable-picker"
            value={pendingId}
            onChange={(event) => addVariable(event.target.value)}
            className="mt-2 block min-h-12 w-full rounded-lg border border-line bg-surface px-3 text-sm font-normal text-ink focus:border-accent focus:ring-2 focus:ring-accent/15"
          >
            <option value="">Choose a NASA POWER variable…</option>
            {variables.map((variable) => (
              <option key={variable.id} value={variable.id} disabled={selectedIds.includes(variable.id)}>
                {variable.name}{selectedIds.includes(variable.id) ? ' · selected' : ''}
              </option>
            ))}
          </select>
        </label>
        <p className="max-w-sm text-xs leading-relaxed text-muted sm:pb-2">
          Start with one. You can add another variable to explore a possible relationship, not to prove causality.
        </p>
      </div>

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

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, CircleHelp, X } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoId, setInfoId] = useState<VariableId | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getVariables('nasa-power')
      .then(setCatalog)
      .catch(() => setCatalogError('Using the verified local NASA POWER variable catalog.'))
  }, [])

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  const selectedVariables = useMemo(
    () => variables.filter((variable) => selectedIds.includes(variable.id)),
    [selectedIds],
  )

  return (
    <section id="variables" aria-labelledby="variables-title" className="surface-panel scroll-mt-6 border-accent/20 bg-linear-to-br from-accent-soft/35 via-surface to-surface p-5 sm:p-6">
      <SectionTitle
        id="variables-title"
        title="Which Earth system variable should we investigate?"
        description="Choose one or more variables from the NASA POWER catalog. Hover over a name or focus its selection button to read its definition."
      >
        <span className="text-sm font-semibold text-accent" aria-live="polite">{selectedIds.length} selected</span>
      </SectionTitle>

      <div ref={menuRef} className="relative max-w-2xl">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 text-left text-base text-ink shadow-sm transition-colors hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/15"
        >
          <span>{selectedIds.length ? `${selectedIds.length} variable${selectedIds.length === 1 ? '' : 's'} selected` : 'Choose a NASA POWER variable'}</span>
          <ChevronDown size={19} className={`shrink-0 text-accent transition-transform ${menuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {menuOpen && (
          <div role="listbox" aria-label="NASA POWER variables" className="absolute z-30 mt-2 max-h-[min(28rem,60vh)] w-full overflow-y-auto rounded-lg border border-line bg-surface p-2 shadow-xl">
            {variables.map((variable, index) => {
              const selected = selectedIds.includes(variable.id)
              const infoOpen = infoId === variable.id
              const metadata = catalog.find((item) => item.id === variable.id)
              return (
                <div key={variable.id} role="option" aria-selected={selected} className="relative rounded-md">
                  <div className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent-soft/50">
                    <button
                      type="button"
                      onClick={() => onToggle(variable.id)}
                      onFocus={() => setInfoId(variable.id)}
                      onBlur={() => setInfoId((current) => current === variable.id ? null : current)}
                      aria-describedby={infoOpen ? `variable-description-${variable.id}` : undefined}
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left text-sm font-semibold text-ink"
                    >
                      <span className={`flex size-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-accent bg-accent text-white' : 'border-line bg-surface'}`}>
                        {selected && <Check size={14} aria-hidden="true" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block" onMouseEnter={() => setInfoId(variable.id)} onMouseLeave={() => setInfoId((current) => current === variable.id ? null : current)}>{variable.name}</span>
                        <span className="block text-xs font-normal text-muted">{metadata?.unit ?? variable.unit}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      title={`About ${variable.name}`}
                      aria-label={`About ${variable.name}`}
                      aria-expanded={infoOpen}
                      onClick={() => setInfoId(infoOpen ? null : variable.id)}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/30 text-accent hover:bg-accent hover:text-white"
                    >
                      <CircleHelp size={17} aria-hidden="true" />
                    </button>
                  </div>
                  {infoOpen && (
                    <p id={`variable-description-${variable.id}`} role="tooltip" className={`pointer-events-none absolute left-12 z-40 w-[min(24rem,calc(100%-4rem))] rounded-md border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink shadow-lg ${index >= variables.length - 2 ? 'bottom-full' : 'top-full'}`}>
                      {variable.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedVariables.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Selected variables">
          {selectedVariables.map((variable) => (
            <span key={variable.id} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 text-sm font-semibold text-accent">
              {variable.name}
              <button type="button" onClick={() => onToggle(variable.id)} aria-label={`Remove ${variable.name}`} className="rounded-full p-0.5 hover:bg-accent hover:text-white">
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Choose at least one variable to begin your investigation.</p>
      )}
      {catalogError && <p role="status" className="mt-3 text-sm text-muted">{catalogError}</p>}
    </section>
  )
}

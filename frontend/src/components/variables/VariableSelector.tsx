import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { variables } from '../../data/mockData'
import { getVariables } from '../../services/api'
import type { BackendVariable, EnvironmentalVariable, VariableCategory, VariableId } from '../../types'
import { SectionTitle } from '../common/SectionTitle'
import { VariableCard } from './VariableCard'

interface VariableSelectorProps {
  selectedIds: VariableId[]
  onToggle: (id: VariableId) => void
}

const categories: Array<'Todas' | VariableCategory> = ['Todas', 'Atmósfera', 'Hidrología', 'Océanos', 'Superficie terrestre']

function toEnvironmentalVariable(variable: BackendVariable): EnvironmentalVariable {
  const category: VariableCategory = variable.id === 'precipitation' ? 'Hidrología' : 'Atmósfera'
  return {
    id: variable.id,
    demoId: variable.id,
    name: variable.name,
    description: variable.description,
    category,
    unit: variable.unit,
    measurement: variable.unit,
    dataType: 'Continua',
    potentialSources: [variable.product ?? 'Proveedor configurado'],
    temporalResolution: 'Mensual',
    geographicCoverage: 'Según cobertura del proveedor',
    integrationStatus: variable.available ? 'demo' : 'pending',
    available: variable.available,
  }
}

export function VariableSelector({ selectedIds, onToggle }: VariableSelectorProps) {
  const fallbackCatalog: EnvironmentalVariable[] = variables.map((variable) => ({
    ...variable,
    id: variable.id,
    demoId: variable.id,
    category: variable.id === 'precipitation' ? 'Hidrología' : 'Atmósfera',
    dataType: 'Continua',
    potentialSources: ['NASA POWER'],
    temporalResolution: 'Mensual',
    geographicCoverage: 'Según cobertura del proveedor',
    integrationStatus: 'demo',
    available: true,
  }))
  const [catalog, setCatalog] = useState<EnvironmentalVariable[]>(fallbackCatalog)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'Todas' | VariableCategory>('Todas')
  const [showResults, setShowResults] = useState(false)
  const [searchVersion, setSearchVersion] = useState(0)
  const searchInput = useRef<HTMLInputElement>(null)
  const results = useRef<HTMLDivElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const visibleVariables = catalog.filter((variable) => {
    const matchesCategory = category === 'Todas' || variable.category === category
    const matchesQuery = !normalizedQuery || `${variable.name} ${variable.description} ${variable.category}`.toLocaleLowerCase('es').includes(normalizedQuery)
    return matchesCategory && matchesQuery
  })
  const selectedVariables = catalog.filter((variable) => variable.demoId && selectedIds.includes(variable.demoId))

  useEffect(() => {
    getVariables('nasa-power')
      .then((backendVariables) => setCatalog(backendVariables.filter((variable) => variable.available).map(toEnvironmentalVariable)))
      .catch(() => setCatalogError('No se pudo cargar el catálogo del backend; se muestran las variables del MVP.'))
  }, [])

  useEffect(() => {
    if (searchVersion > 0) results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [searchVersion])

  function showSearchResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowResults(true)
    setSearchVersion((version) => version + 1)
  }

  return (
    <section id="variables" aria-labelledby="variables-title" className="scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <SectionTitle id="variables-title" title="¿Qué deberías investigar?" description="Escribe una variable o explora el catálogo ambiental.">
        <span className="rounded-full bg-canvas px-2.5 py-1 text-xs text-muted">{selectedIds.length} seleccionadas</span>
      </SectionTitle>
      <form onSubmit={showSearchResults} className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">¿Qué deberías investigar?</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. temperatura, lluvia, humedad del suelo…" className="min-h-11 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm focus:border-accent" />
        </label>
        <button type="submit" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover">
          <Search size={15} aria-hidden="true" />{showResults ? 'Actualizar resultados' : 'Explorar variables ambientales'}
        </button>
      </form>

      {selectedVariables.length > 0 && <div className="mt-4 rounded-lg bg-accent-soft/50 p-3">
        <p className="text-xs font-medium text-ink">En tu investigación:</p>
        <ul className="mt-2 flex flex-wrap gap-2">{selectedVariables.map((variable) => <li key={variable.id} className="rounded-full border border-accent/20 bg-surface px-3 py-1 text-xs text-accent">{variable.name}</li>)}</ul>
      </div>}

      {showResults && <div ref={results} className="mt-5 scroll-mt-6" aria-label="Resultados de búsqueda de variables">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-sm font-semibold">Resultados del catálogo</h3><p className="mt-1 text-xs text-muted" aria-live="polite">{visibleVariables.length} variables encontradas</p></div>
          <button type="button" onClick={() => { setShowResults(false); searchInput.current?.focus() }} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line px-3 text-xs text-muted hover:text-ink"><X size={14} aria-hidden="true" />Ocultar resultados</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar por categoría">
          {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`min-h-9 rounded-full border px-3 text-xs ${category === item ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:border-muted'}`}>{item}</button>)}
        </div>
        <div tabIndex={0} aria-label="Lista desplazable de variables encontradas" className="mt-4 max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-line p-1 focus-visible:outline-2 focus-visible:outline-accent">
          {visibleVariables.length > 0
            ? <div className="grid grid-cols-1 gap-2 p-1">{visibleVariables.map((variable) => <VariableCard key={variable.id} variable={variable} selected={variable.demoId ? selectedIds.includes(variable.demoId) : false} onToggle={() => { if (variable.demoId && variable.available !== false) onToggle(variable.demoId) }} compact />)}</div>
            : <p className="m-2 rounded-lg border border-dashed border-line p-4 text-sm text-muted">No se encontraron variables para esta búsqueda. Prueba otro término.</p>}
        </div>
        {catalogError && <p role="status" className="mt-3 text-xs text-muted">{catalogError}</p>}
        <p className="mt-3 text-xs leading-relaxed text-muted">El catálogo procede del backend. El MVP habilita temperatura y precipitación; las demás variables se incorporarán cuando se valide su proveedor.</p>
      </div>}
    </section>
  )
}

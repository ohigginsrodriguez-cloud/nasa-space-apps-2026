import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { variableCatalog } from '../../data/mockData'
import type { VariableCategory, VariableId } from '../../types'
import { SectionTitle } from '../common/SectionTitle'
import { VariableCard } from './VariableCard'

interface VariableSelectorProps {
  selectedIds: VariableId[]
  onToggle: (id: VariableId) => void
  onSetSelection: (ids: VariableId[]) => void
}

const categories: Array<'Todas' | VariableCategory> = ['Todas', 'Atmósfera', 'Hidrología', 'Océanos', 'Superficie terrestre']

export function VariableSelector({ selectedIds, onToggle, onSetSelection }: VariableSelectorProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'Todas' | VariableCategory>('Todas')
  const [showResults, setShowResults] = useState(false)
  const [searchVersion, setSearchVersion] = useState(0)
  const searchInput = useRef<HTMLInputElement>(null)
  const results = useRef<HTMLDivElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const visibleVariables = variableCatalog.filter((variable) => {
    const matchesCategory = category === 'Todas' || variable.category === category
    const matchesQuery = !normalizedQuery || `${variable.name} ${variable.description} ${variable.category}`.toLocaleLowerCase('es').includes(normalizedQuery)
    return matchesCategory && matchesQuery
  })
  const selectedVariables = variableCatalog.filter((variable) => variable.demoId && selectedIds.includes(variable.demoId))
  const availableVariables = variableCatalog.filter((variable) => variable.demoId)
  const allAvailableSelected = availableVariables.every((variable) => variable.demoId && selectedIds.includes(variable.demoId))

  // La selección múltiple se mantiene como IDs, no como objetos completos.
  // Esto permite añadir variables al catálogo sin cambiar el estado global.
  function selectAllAvailable() {
    onSetSelection(availableVariables.flatMap((variable) => variable.demoId ? [variable.demoId] : []))
  }

  function clearSelection() {
    onSetSelection([])
  }

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

      <div className="mt-4 rounded-lg bg-accent-soft/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-ink">En tu investigación:</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={selectAllAvailable} disabled={allAvailableSelected} className="min-h-9 rounded-lg border border-accent/30 px-3 text-xs text-accent disabled:opacity-50">Seleccionar disponibles</button>
            <button type="button" onClick={clearSelection} disabled={selectedIds.length === 0} className="min-h-9 rounded-lg border border-line px-3 text-xs text-muted hover:text-ink disabled:opacity-50">Limpiar selección</button>
          </div>
        </div>
        {selectedVariables.length > 0
          ? <ul className="mt-2 flex flex-wrap gap-2">{selectedVariables.map((variable) => <li key={variable.id} className="rounded-full border border-accent/20 bg-surface px-3 py-1 text-xs text-accent">{variable.name}</li>)}</ul>
          : <p className="mt-2 text-xs text-muted">Todavía no has seleccionado una variable.</p>}
      </div>

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
            ? <div className="grid grid-cols-1 gap-2 p-1">{visibleVariables.map((variable) => <VariableCard key={variable.id} variable={variable} selected={variable.demoId ? selectedIds.includes(variable.demoId) : false} onToggle={() => { if (variable.demoId) onToggle(variable.demoId) }} compact />)}</div>
            : <p className="m-2 rounded-lg border border-dashed border-line p-4 text-sm text-muted">No se encontraron variables para esta búsqueda. Prueba otro término.</p>}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">La resolución y cobertura de fuentes reales se muestran como “por validar” hasta seleccionar un producto de datos concreto. Solo temperatura y precipitación tienen series sintéticas de demostración.</p>
      </div>}
    </section>
  )
}

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Database, ExternalLink, RadioTower, Satellite, Search, X } from 'lucide-react'
import { dataSources } from '../../data/mockData'
import { SectionTitle } from '../common/SectionTitle'

interface DataSourceSelectorProps {
  value: string
  onChange: (id: string) => void
}

function statusLabel(status: string) {
  if (status === 'demo') return 'Disponible · demo'
  if (status === 'requires-configuration') return 'Requiere configuración'
  return 'Integración pendiente'
}

export function DataSourceSelector({ value, onChange }: DataSourceSelectorProps) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [searchVersion, setSearchVersion] = useState(0)
  const searchInput = useRef<HTMLInputElement>(null)
  const results = useRef<HTMLDivElement>(null)
  const selectedSource = dataSources.find((source) => source.id === value)
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const visibleSources = dataSources.filter((source) => (
    !normalizedQuery
    || `${source.name} ${source.organization} ${source.description} ${source.variables.join(' ')} ${statusLabel(source.status)}`
      .toLocaleLowerCase('es')
      .includes(normalizedQuery)
  ))

  useEffect(() => {
    if (searchVersion > 0) results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [searchVersion])

  function showSourceResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setShowResults(true)
    setSearchVersion((version) => version + 1)
  }

  return (
    <section id="sources" aria-labelledby="sources-title" className="scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <SectionTitle id="sources-title" title="¿De dónde vienen los datos?" description="Escribe el nombre de una fuente o explora el catálogo disponible.">
        <span className="rounded border border-line px-2 py-1 font-mono text-[10px] tracking-wide text-muted">FUENTES CATALOGADAS: {dataSources.length}</span>
      </SectionTitle>
      <form onSubmit={showSourceResults} className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Buscar fuentes de datos</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. NASA, NOAA, precipitación…" className="min-h-11 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm focus:border-accent" />
        </label>
        <button type="submit" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover">
          <Search size={15} aria-hidden="true" />{showResults ? 'Actualizar resultados' : 'Explorar fuentes de datos'}
        </button>
      </form>

      {selectedSource && <div className="mt-4 rounded-lg bg-accent-soft/50 p-3">
        <p className="text-xs font-medium text-ink">Fuente seleccionada:</p>
        <p className="mt-1 text-xs text-accent">{selectedSource.name} · {statusLabel(selectedSource.status)}</p>
      </div>}

      {showResults && <div ref={results} className="mt-5 scroll-mt-6" aria-label="Resultados de búsqueda de fuentes">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-sm font-semibold">Fuentes de datos</h3><p className="mt-1 text-xs text-muted" aria-live="polite">{visibleSources.length} fuentes encontradas</p></div>
          <button type="button" onClick={() => { setShowResults(false); searchInput.current?.focus() }} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line px-3 text-xs text-muted hover:text-ink"><X size={14} aria-hidden="true" />Ocultar resultados</button>
        </div>
        <fieldset className="mt-4 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto overscroll-contain rounded-lg border border-line p-2 focus-within:ring-2 focus-within:ring-accent">
          <legend className="sr-only">Fuentes de datos y estado de integración</legend>
          {visibleSources.length > 0 ? visibleSources.map((source) => {
            const Icon = source.status === 'demo' ? Database : source.dataType.includes('satélite') ? Satellite : RadioTower
            return <article key={source.id} className={`min-w-0 rounded-lg border p-3 ${source.available ? value === source.id ? 'border-accent/50 bg-accent-soft/50' : 'border-line bg-surface' : 'border-dashed border-line bg-canvas/40'}`}>
              <label className={`flex min-h-9 items-start gap-3 ${source.available ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                <Icon size={18} className={`mt-0.5 shrink-0 ${source.available ? 'text-accent' : 'text-muted'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold">{source.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">{source.organization}</span>
                  <span className={`mt-1 block text-[10px] ${source.available ? 'text-accent' : 'text-muted'}`}>{statusLabel(source.status)}</span>
                </span>
                {source.available && <input type="radio" name="data-source" value={source.id} checked={value === source.id} onChange={() => onChange(source.id)} aria-label={`Seleccionar ${source.name}`} className="mt-1 size-4 shrink-0 accent-accent" />}
              </label>
              <details className="mt-2 border-t border-line pt-2">
                <summary className="w-fit cursor-pointer text-[10px] text-muted hover:text-accent">Detalles</summary>
                <p className="mt-2 text-xs leading-relaxed text-muted">{source.description}</p>
                <dl className="mt-2 space-y-1.5 text-xs">
                  <div><dt className="inline font-medium">Tipo: </dt><dd className="inline text-muted">{source.dataType}</dd></div>
                  <div><dt className="inline font-medium">Variables: </dt><dd className="inline text-muted">{source.variables.join(', ')}</dd></div>
                  <div><dt className="inline font-medium">Cobertura/resolución: </dt><dd className="inline text-muted">{source.coverage ?? 'por validar'} · {source.temporalResolution ?? 'por validar'}</dd></div>
                  <div><dt className="inline font-medium">Acceso: </dt><dd className="inline text-muted">{source.accessMethod}</dd></div>
                </dl>
                {source.url && <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-accent hover:underline">Sitio oficial <ExternalLink size={13} aria-hidden="true" /></a>}
              </details>
            </article>
          }) : <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">No se encontraron fuentes para esta búsqueda. Prueba otro término.</p>}
        </fieldset>
      </div>}
      <p className="mt-4 text-xs leading-relaxed text-muted">Las fuentes NASA, NOAA y sus plataformas no están conectadas. Autenticación, productos, unidades y disponibilidad deben validarse antes de habilitar una consulta.</p>
    </section>
  )
}

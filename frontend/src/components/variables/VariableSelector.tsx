import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ExternalLink, Layers, Search, Sparkles, X } from 'lucide-react'
import { variables } from '../../data/mockData'
import { getVariables } from '../../services/api'
import type { BackendVariable, EnvironmentalVariable, VariableCategory, VariableId } from '../../types'
import { SectionTitle } from '../common/SectionTitle'
import { VariableCard } from './VariableCard'

interface VariableSelectorProps {
  selectedIds: VariableId[]
  onToggle: (id: VariableId) => void
}

const categories: Array<VariableCategory> = [
  'Todas',
  'Atmósfera',
  'Hidrología',
  'Superficie terrestre',
  'Energía',
  'Océanos e Hidrología',
]

const roadmapInstruments = [
  {
    name: 'MODIS (Terra / Aqua) · NDVI',
    mission: 'MODIS MOD13C2 v061',
    description: 'Índice de vegetación global de 16 días y mensual a 0.05° de resolución.',
    integration: 'AppEEARS API / Earthdata Login OAuth2',
    status: 'Roadmap (Requiere Bearer Token)',
    url: 'https://lpdaac.usgs.gov/products/mod13c2v061/',
  },
  {
    name: 'GLDAS · Evapotranspiración y Humedad profunda',
    mission: 'GLDAS Catchment / NOAH LSM v2.1',
    description: 'Evaporación de suelo y transpiración vegetal horaria y mensual a 0.25°.',
    integration: 'NASA Giovanni / OPeNDAP GES DISC',
    status: 'Roadmap (En proceso de integración)',
    url: 'https://ldas.gsfc.nasa.gov/gldas',
  },
  {
    name: 'SWOT · Elevación de Aguas Superficiales',
    mission: 'Surface Water and Ocean Topography (NASA / CNES)',
    description: 'Radar de apertura sintética para cambios en nivel de lagos, ríos y costas.',
    integration: 'PO.DAAC Cloud / Earthdata Cloud AWS',
    status: 'Roadmap (Nueva misión satelital 2023+)',
    url: 'https://swot.jpl.nasa.gov/',
  },
  {
    name: 'GPM (IMERG) · Precipitación Satelital Global',
    mission: 'Global Precipitation Measurement',
    description: 'Fusión de radares y microondas satelitales a nivel global a 0.1°.',
    integration: 'NASA GES DISC / Giovanni',
    status: 'Roadmap (Candidata de alta resolución)',
    url: 'https://gpm.nasa.gov/data',
  },
]

function toEnvironmentalVariable(variable: BackendVariable): EnvironmentalVariable {
  const cat = (variable.category as VariableCategory) ||
    (variable.id === 'precipitation'
      ? 'Hidrología'
      : variable.id === 'soil_moisture'
      ? 'Superficie terrestre'
      : variable.id === 'solar_radiation'
      ? 'Energía'
      : 'Atmósfera')

  return {
    id: variable.id,
    demoId: variable.id as VariableId,
    name: variable.name,
    description: variable.description,
    category: cat,
    unit: variable.unit,
    measurement: variable.unit,
    dataType: 'Continua',
    potentialSources: [variable.product ?? 'NASA POWER (producto según variable)'],
    temporalResolution: 'Mensual',
    geographicCoverage: 'Global (cobertura satelital / modelo MERRA-2)',
    integrationStatus: variable.available ? 'demo' : 'pending',
    available: variable.available,
  }
}

export function VariableSelector({ selectedIds, onToggle }: VariableSelectorProps) {
  const fallbackCatalog: EnvironmentalVariable[] = variables.map((variable) => ({
    ...variable,
    id: variable.id,
    demoId: variable.id,
    category:
      variable.id === 'precipitation'
        ? 'Hidrología'
        : variable.id === 'soil_moisture'
        ? 'Superficie terrestre'
        : variable.id === 'solar_radiation'
        ? 'Energía'
        : 'Atmósfera',
    dataType: 'Continua',
    potentialSources: ['NASA POWER (producto según variable)'],
    temporalResolution: 'Mensual',
    geographicCoverage: 'Global (0.5° × 0.625°)',
    integrationStatus: 'demo',
    available: true,
  }))

  const [catalog, setCatalog] = useState<EnvironmentalVariable[]>(fallbackCatalog)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<VariableCategory>('Todas')
  const [showRoadmap, setShowRoadmap] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const results = useRef<HTMLDivElement>(null)

  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const visibleVariables = catalog.filter((variable) => {
    const matchesCategory = category === 'Todas' || variable.category === category
    const matchesQuery =
      !normalizedQuery ||
      `${variable.name} ${variable.description} ${variable.category}`.toLocaleLowerCase('es').includes(normalizedQuery)
    return matchesCategory && matchesQuery
  })
  const selectedVariables = catalog.filter((variable) => variable.demoId && selectedIds.includes(variable.demoId))

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: catalog.length }
    for (const cat of categories) {
      if (cat !== 'Todas') {
        counts[cat] = catalog.filter((v) => v.category === cat).length
      }
    }
    return counts
  }, [catalog])

  useEffect(() => {
    getVariables('nasa-power')
      .then((backendVariables) => {
        const available = backendVariables.filter((v) => v.available).map(toEnvironmentalVariable)
        if (available.length > 0) {
          setCatalog(available)
        }
      })
      .catch(() => setCatalogError('Usando catálogo local verificado de variables de NASA POWER.'))
  }, [])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="variables" aria-labelledby="variables-title" className="scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-sm">
      <SectionTitle
        id="variables-title"
        title="¿Qué variable del sistema Tierra investigar?"
        description="Explora variables de atmósfera, hidrología, radiación solar y humedad del suelo verificadas en NASA POWER."
      >
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-muted border border-line">
          {selectedIds.length} seleccionada{selectedIds.length !== 1 ? 's' : ''}
        </span>
      </SectionTitle>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Buscar variable ambiental</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            ref={searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar temperatura, precipitación, radiación, humedad, viento…"
            className="min-h-11 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm focus:border-accent"
          />
        </label>
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-line px-3 text-xs text-muted hover:text-ink"
          >
            <X size={14} aria-hidden="true" />
            Limpiar
          </button>
        )}
      </form>

      {selectedVariables.length > 0 && (
        <div className="mt-4 rounded-lg bg-accent-soft/60 p-3.5 border border-accent/20">
          <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Sparkles size={14} className="text-accent" />
            Variables activas para el análisis:
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {selectedVariables.map((variable) => (
              <li
                key={variable.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-surface px-3 py-1 text-xs font-medium text-accent shadow-2xs"
              >
                <span>{variable.name}</span>
                <button
                  type="button"
                  onClick={() => variable.demoId && onToggle(variable.demoId)}
                  className="hover:text-red-600 focus:outline-none"
                  title={`Quitar ${variable.name}`}
                  aria-label={`Quitar ${variable.name}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filtros por Categoría */}
      <div ref={results} className="mt-5 scroll-mt-6" aria-label="Variables disponibles en el catálogo">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Catálogo ambiental de NASA POWER</h3>
            <p className="mt-0.5 text-xs text-muted" aria-live="polite">
              {visibleVariables.length} variable{visibleVariables.length !== 1 ? 's' : ''} disponible{visibleVariables.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-muted hover:border-accent hover:text-accent"
          >
            <Layers size={13} aria-hidden="true" />
            {showRoadmap ? 'Ocultar Roadmap Satelital' : 'Misiones en Roadmap (MODIS, GLDAS, SWOT)'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar por categoría">
          {categories.map((item) => {
            const count = categoryCounts[item] ?? 0
            const isDisabled = item !== 'Todas' && count === 0
            return (
              <button
                key={item}
                type="button"
                disabled={isDisabled}
                aria-pressed={category === item}
                onClick={() => {
                  if (!isDisabled) setCategory(item)
                }}
                className={`min-h-9 rounded-full border px-3 text-xs font-medium transition-colors ${
                  category === item
                    ? 'border-accent bg-accent-soft text-accent'
                    : isDisabled
                    ? 'cursor-not-allowed border-line/40 bg-canvas text-muted/50'
                    : 'border-line text-muted hover:border-muted hover:text-ink'
                }`}
              >
                {item} {isDisabled ? '· Próximamente' : `(${count})`}
              </button>
            )
          })}
        </div>

        {/* Lista de tarjetas de variables activas */}
        <div
          tabIndex={0}
          aria-label="Lista de variables activas"
          className="mt-4 max-h-80 overflow-y-auto overscroll-contain rounded-lg border border-line p-1.5 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {visibleVariables.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 p-1 sm:grid-cols-2">
              {visibleVariables.map((variable) => (
                <VariableCard
                  key={variable.id}
                  variable={variable}
                  selected={variable.demoId ? selectedIds.includes(variable.demoId) : false}
                  onToggle={() => {
                    if (variable.demoId && variable.available !== false) onToggle(variable.demoId)
                  }}
                  compact
                />
              ))}
            </div>
          ) : (
            <p className="m-2 rounded-lg border border-dashed border-line p-5 text-sm text-center text-muted">
              No se encontraron variables para esta búsqueda. Prueba con otro término.
            </p>
          )}
        </div>

        {catalogError && <p role="status" className="mt-3 text-xs text-muted">{catalogError}</p>}

        {/* Sección Roadmap / Próximamente para instrumentos con Earthdata Login */}
        {showRoadmap && (
          <div className="mt-5 rounded-xl border border-line bg-canvas/70 p-4">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-accent" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
                Roadmap de misiones e instrumentos de NASA / Agencias asociadas
              </h4>
            </div>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Las siguientes misiones e instrumentos forman parte del alcance avanzado del reto. Requieren autenticación Bearer Token vía NASA Earthdata Login OAuth2 o consultas por polígono en Giovanni / AppEEARS:
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {roadmapInstruments.map((inst) => (
                <div key={inst.name} className="rounded-lg border border-line bg-surface p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-ink">{inst.name}</span>
                    <a
                      href={inst.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline inline-flex items-center gap-0.5 text-[11px]"
                    >
                      NASA <ExternalLink size={10} />
                    </a>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">{inst.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted border-t border-line/60 pt-1.5">
                    <span>{inst.integration}</span>
                    <span className="rounded bg-canvas px-1.5 py-0.5 font-medium">{inst.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

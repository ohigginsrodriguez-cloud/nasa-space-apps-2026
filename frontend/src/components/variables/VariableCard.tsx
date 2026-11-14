import { Activity, CircleHelp } from 'lucide-react'
import { dataSources } from '../../data/mockData'
import type { EnvironmentalVariable } from '../../types'

interface VariableCardProps {
  variable: EnvironmentalVariable
  selected: boolean
  onToggle: () => void
  compact?: boolean
}

export function VariableCard({ variable, selected, onToggle, compact = false }: VariableCardProps) {
  const pending = variable.demoId === undefined
  const potentialSources = variable.potentialSources
    .map((id) => dataSources.find((source) => source.id === id)?.name)
    .filter((name): name is string => name !== undefined)

  if (compact) {
    return (
      <article className={`min-w-0 rounded-lg border p-3 ${selected ? 'border-accent/50 bg-accent-soft/50' : 'border-line bg-surface'}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-xs font-semibold leading-relaxed">{variable.name}</h3>
          <label className={`flex shrink-0 items-center gap-1.5 text-[11px] ${pending ? 'cursor-not-allowed text-muted' : 'cursor-pointer text-ink'}`}>
            <input type="checkbox" checked={selected} disabled={pending} onChange={onToggle} aria-label={`Seleccionar ${variable.name}`} className="size-4 accent-accent" />
            {pending ? 'Próximamente' : 'Incluir'}
          </label>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
          <span className="text-muted">{variable.unit}</span>
          <span className={pending ? 'text-muted' : 'text-accent'}>{pending ? 'Integración pendiente' : 'Disponible en demo'}</span>
        </div>
        <details className="mt-1.5">
          <summary className="w-fit cursor-pointer text-[10px] text-muted hover:text-accent">Detalles</summary>
          <p className="mt-2 text-xs leading-relaxed text-muted">{variable.description}</p>
          <dl className="mt-2 grid gap-2 border-t border-line pt-2 text-xs">
            <div><dt className="font-medium">Categoría · unidad</dt><dd className="mt-0.5 text-muted">{variable.category} · {variable.measurement}</dd></div>
            <div><dt className="font-medium">Resolución temporal</dt><dd className="mt-0.5 text-muted">{variable.temporalResolution ?? 'Por validar en el producto'}</dd></div>
            <div><dt className="font-medium">Cobertura</dt><dd className="mt-0.5 text-muted">{variable.geographicCoverage ?? 'Por validar en el producto'}</dd></div>
            <div><dt className="font-medium">Fuentes candidatas (no integradas)</dt><dd className="mt-0.5 text-muted">{potentialSources.length ? potentialSources.join(' · ') : 'Sin fuente asociada'}</dd></div>
          </dl>
        </details>
      </article>
    )
  }

  return (
    <article className={`min-w-0 rounded-xl border p-4 ${selected ? 'border-accent/50 bg-accent-soft/50' : 'border-line bg-surface'}`}>
      <div className="flex items-start gap-3">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-accent-soft text-accent' : 'bg-canvas text-muted'}`}><Activity size={19} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{variable.name}</h3>
            <label className={`flex min-h-9 items-center gap-2 text-xs ${pending ? 'cursor-not-allowed text-muted' : 'cursor-pointer text-ink'}`}>
              <input type="checkbox" checked={selected} disabled={pending} onChange={onToggle} aria-label={`Seleccionar ${variable.name}`} className="size-4 accent-accent" />
              {pending ? 'Próximamente' : 'Incluir'}
            </label>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{variable.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px]">{variable.unit}</span>
        <span className="rounded border border-line px-2 py-1 text-[11px] text-muted">{variable.category}</span>
        <span className={`rounded px-2 py-1 text-[11px] ${pending ? 'bg-canvas text-muted' : 'bg-accent-soft text-accent'}`}>{pending ? 'Integración pendiente' : 'Disponible en demo'}</span>
      </div>
      <details className="mt-3">
        <summary className="flex min-h-8 w-fit items-center gap-1 text-xs text-muted hover:text-accent"><CircleHelp size={13} aria-hidden="true" />Metadatos y procedencia</summary>
        <dl className="mt-2 grid gap-2 border-t border-line pt-3 text-xs sm:grid-cols-2">
          <div><dt className="font-medium">Tipo de variable</dt><dd className="mt-0.5 text-muted">{variable.dataType}</dd></div>
          <div><dt className="font-medium">Unidad</dt><dd className="mt-0.5 text-muted">{variable.measurement}</dd></div>
          <div><dt className="font-medium">Resolución temporal</dt><dd className="mt-0.5 text-muted">{variable.temporalResolution ?? 'Por validar en el producto'}</dd></div>
          <div><dt className="font-medium">Cobertura</dt><dd className="mt-0.5 text-muted">{variable.geographicCoverage ?? 'Por validar en el producto'}</dd></div>
          <div className="sm:col-span-2"><dt className="font-medium">Fuentes candidatas (no integradas)</dt><dd className="mt-0.5 text-muted">{potentialSources.length ? potentialSources.join(' · ') : 'Sin fuente asociada'}</dd></div>
        </dl>
      </details>
    </article>
  )
}

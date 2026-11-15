import { Activity, CircleHelp } from 'lucide-react'
import type { EnvironmentalVariable } from '../../types'

interface VariableCardProps {
  variable: EnvironmentalVariable
  selected: boolean
  onToggle: () => void
  compact?: boolean
}

export function VariableCard({ variable, selected, onToggle, compact = false }: VariableCardProps) {
  const pending = variable.available === false || variable.demoId === undefined
  const potentialSources = variable.potentialSources
  const category = variable.category
    .replace('Atmósfera', 'Atmosphere')
    .replace('Hidrología', 'Hydrology')
    .replace('Superficie terrestre', 'Land surface')
    .replace('Energía', 'Energy')
    .replace('Océanos e Hidrología', 'Oceans and hydrology')

  if (compact) {
    return (
      <article className={`min-w-0 rounded-lg border p-3 transition-all duration-200 ${selected ? 'border-accent/55 bg-accent-soft/65 shadow-sm' : 'border-line bg-surface hover:border-accent/35 hover:shadow-sm'}`}>
        <div className="flex items-start justify-between gap-2">
           <h3 className="min-w-0 text-sm font-semibold leading-relaxed">{variable.name}</h3>
           <label className={`flex shrink-0 items-center gap-1.5 text-xs ${pending ? 'cursor-not-allowed text-muted' : 'cursor-pointer text-ink'}`}>
            <input type="checkbox" checked={selected} disabled={pending} onChange={onToggle} aria-label={`Select ${variable.name}`} className="size-4 accent-accent" />
             {pending ? 'Coming soon' : 'Include'}
          </label>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
          <span className="text-muted">{variable.unit}</span>
           <span className={pending ? 'text-muted' : 'text-accent'}>{pending ? 'Integration pending' : 'Available'}</span>
        </div>
        <details className="mt-1.5">
           <summary className="w-fit cursor-pointer text-xs text-muted hover:text-accent">Details</summary>
           <p className="mt-2 text-sm leading-relaxed text-muted">{variable.description}</p>
           <dl className="mt-2 grid gap-2 border-t border-line pt-2 text-sm">
             <div><dt className="font-medium">Category · unit</dt><dd className="mt-0.5 text-muted">{category} · {variable.measurement}</dd></div>
             <div><dt className="font-medium">Temporal resolution</dt><dd className="mt-0.5 text-muted">{variable.temporalResolution ?? 'To be verified for the product'}</dd></div>
             <div><dt className="font-medium">Coverage</dt><dd className="mt-0.5 text-muted">{variable.geographicCoverage ?? 'To be verified for the product'}</dd></div>
             <div><dt className="font-medium">Candidate sources</dt><dd className="mt-0.5 text-muted">{potentialSources.length ? potentialSources.join(' · ') : 'No associated source'}</dd></div>
          </dl>
        </details>
      </article>
    )
  }

  return (
    <article className={`min-w-0 rounded-xl border p-4 transition-all duration-200 ${selected ? 'border-accent/55 bg-accent-soft/65 shadow-sm' : 'border-line bg-surface hover:border-accent/35 hover:shadow-sm'}`}>
      <div className="flex items-start gap-3">
         <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-accent text-white' : 'bg-accent-soft text-accent'}`}><Activity size={19} aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{variable.name}</h3>
            <label className={`flex min-h-9 items-center gap-2 text-xs ${pending ? 'cursor-not-allowed text-muted' : 'cursor-pointer text-ink'}`}>
              <input type="checkbox" checked={selected} disabled={pending} onChange={onToggle} aria-label={`Select ${variable.name}`} className="size-4 accent-accent" />
               {pending ? 'Coming soon' : 'Include'}
            </label>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{variable.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px]">{variable.unit}</span>
        <span className="rounded border border-line px-2 py-1 text-[11px] text-muted">{variable.category}</span>
           <span className={`rounded px-2 py-1 text-xs ${pending ? 'bg-canvas text-muted' : 'bg-accent-soft text-accent'}`}>{pending ? 'Integration pending' : 'Available'}</span>
      </div>
      <details className="mt-3">
         <summary className="flex min-h-9 w-fit items-center gap-1 text-sm text-muted hover:text-accent"><CircleHelp size={14} aria-hidden="true" />Metadata and provenance</summary>
         <dl className="mt-2 grid gap-2 border-t border-line pt-3 text-sm sm:grid-cols-2">
           <div><dt className="font-medium">Variable type</dt><dd className="mt-0.5 text-muted">{variable.dataType}</dd></div>
           <div><dt className="font-medium">Unit</dt><dd className="mt-0.5 text-muted">{variable.measurement}</dd></div>
           <div><dt className="font-medium">Temporal resolution</dt><dd className="mt-0.5 text-muted">{variable.temporalResolution ?? 'To be verified for the product'}</dd></div>
           <div><dt className="font-medium">Coverage</dt><dd className="mt-0.5 text-muted">{variable.geographicCoverage ?? 'To be verified for the product'}</dd></div>
           <div className="sm:col-span-2"><dt className="font-medium">Candidate sources</dt><dd className="mt-0.5 text-muted">{potentialSources.length ? potentialSources.join(' · ') : 'No associated source'}</dd></div>
        </dl>
      </details>
    </article>
  )
}

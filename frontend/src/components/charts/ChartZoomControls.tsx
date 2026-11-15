interface ChartZoomControlsProps {
  level: number
  onChange: (level: number) => void
  label?: string
}

export function ChartZoomControls({ level, onChange, label = 'Controles de zoom' }: ChartZoomControlsProps) {
  return (
    <aside className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-line bg-surface p-1" aria-label={label}>
      <span className="px-1 text-[10px] font-semibold text-muted">Zoom</span>
      <button type="button" className="flex size-8 items-center justify-center rounded border border-line bg-surface text-lg font-semibold text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40" aria-label="Acercar gráfica" title="Acercar gráfica" onClick={() => onChange(level + 1)} disabled={level >= 4}>+</button>
      <span className="min-w-8 text-center text-[10px] tabular-nums text-muted">{level === 0 ? '1×' : `${(1.5 ** level).toFixed(1)}×`}</span>
      <button type="button" className="flex size-8 items-center justify-center rounded border border-line bg-surface text-lg font-semibold text-ink hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40" aria-label="Alejar gráfica" title="Alejar gráfica" onClick={() => onChange(level - 1)} disabled={level <= 0}>−</button>
      <button type="button" className="px-1 text-[10px] text-accent underline disabled:opacity-40" onClick={() => onChange(0)} disabled={level === 0}>Restablecer</button>
    </aside>
  )
}

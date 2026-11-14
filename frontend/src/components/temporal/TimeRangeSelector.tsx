import { CalendarDays } from 'lucide-react'
import type { TimeRange } from '../../types'
import { SectionTitle } from '../common/SectionTitle'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
  error: string | null
}

const fieldClass = 'mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent'

export function TimeRangeSelector({ value, onChange, error }: TimeRangeSelectorProps) {
  return (
    <section id="temporal" aria-labelledby="temporal-title" className="scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <SectionTitle id="temporal-title" title="¿Durante cuánto tiempo?" description="Un periodo largo ayuda a evaluar tendencias. La demo cubre 2001–2025." />
      <div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-medium">Fecha inicial<input aria-invalid={Boolean(error)} aria-describedby={error ? 'time-error' : undefined} type="date" min="2001-01-01" max="2025-12-01" required value={value.startDate} onChange={(event) => onChange({ ...value, startDate: event.target.value })} className={fieldClass} /></label>
          <label className="min-w-0 text-xs font-medium">Fecha final<input aria-invalid={Boolean(error)} aria-describedby={error ? 'time-error' : undefined} type="date" min="2001-01-01" max="2025-12-01" required value={value.endDate} onChange={(event) => onChange({ ...value, endDate: event.target.value })} className={fieldClass} /></label>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted">Frecuencia mensual · Datos disponibles: 2001–2025</p>
        </div>
        {error && <p id="time-error" role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted"><CalendarDays size={14} className="mt-0.5 shrink-0" aria-hidden="true" />La serie y el análisis se limitan a las fechas elegidas. Para el análisis estadístico se promedian las observaciones mensuales por año.</p>
      </div>
    </section>
  )
}

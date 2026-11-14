import { CalendarDays } from 'lucide-react'
import type { TimeRange } from '../../types'
import { SectionTitle } from '../common/SectionTitle'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
  error: string | null
}

const fieldClass = 'mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent'

function lastCompleteMonth(): { start: string; end: string } {
  const date = new Date()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() - 1)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  return {
    start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    end: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10),
  }
}

export function TimeRangeSelector({ value, onChange, error }: TimeRangeSelectorProps) {
  const latestCompleteMonth = lastCompleteMonth()
  return (
    <section id="temporal" aria-labelledby="temporal-title" className="scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <SectionTitle id="temporal-title" title="¿Durante cuánto tiempo?" description="Un periodo largo ayuda a evaluar tendencias. El proveedor indicará su cobertura disponible." />
      <div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-medium">Fecha inicial<input aria-invalid={Boolean(error)} aria-describedby={error ? 'time-error' : undefined} type="date" max={latestCompleteMonth.end} required value={value.startDate} onChange={(event) => onChange({ ...value, startDate: event.target.value })} className={fieldClass} /></label>
          <label className="min-w-0 text-xs font-medium">Fecha final<input aria-invalid={Boolean(error)} aria-describedby={error ? 'time-error' : undefined} type="date" max={latestCompleteMonth.end} required value={value.endDate} onChange={(event) => onChange({ ...value, endDate: event.target.value })} className={fieldClass} /></label>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted">Frecuencia mensual · Último mes completo disponible: {latestCompleteMonth.start} a {latestCompleteMonth.end}</p>
        </div>
        {error && <p id="time-error" role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted"><CalendarDays size={14} className="mt-0.5 shrink-0" aria-hidden="true" />La serie y el análisis se limitan a las fechas elegidas. Para el análisis estadístico se promedian las observaciones mensuales por año.</p>
      </div>
    </section>
  )
}

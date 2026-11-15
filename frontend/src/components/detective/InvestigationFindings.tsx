import { Link } from 'react-router-dom'
import type { DataConfiguration, TimeSeriesDataset } from '../../types'

export function InvestigationFindings({ configuration, dataset, pending }: {
  configuration: DataConfiguration
  dataset: TimeSeriesDataset
  pending: boolean
}) {
  return (
    <section aria-labelledby="findings-title" className="border-t-4 border-signal bg-accent-soft p-5 sm:p-7">
      <p className="eyebrow">YOUR INVESTIGATION / THE ANSWER</p>
      <h2 id="findings-title" className="mt-2 text-2xl font-bold">What changed in {dataset.region?.name ?? 'the selected region'}?</h2>
      <p className="mt-2 text-sm text-muted">
        {configuration.timeRange.startDate} – {configuration.timeRange.endDate} · {dataset.isDemonstration ? 'SYNTHETIC DEMO — not NASA observations' : 'NASA POWER · historical data'}
      </p>
      {pending && <p role="status" className="mt-3 font-semibold">These findings describe the previous analysis. Run your changed configuration to update them.</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {dataset.results.map(({ variable, interpretation, trend }) => (
          <article key={variable.id} className="border border-line bg-white p-5">
            <h3 className="font-bold">{variable.name}</h3>
            <p className="mt-2 text-lg font-bold text-accent">{interpretation?.title ?? 'Review the statistical evidence below'}</p>
            <p className="mt-2 text-sm leading-relaxed">{interpretation?.summary ?? trend.message}</p>
            <p className="mt-3 text-sm text-muted">Annual analysis: {trend.n_observations} complete years.</p>
            {!!trend.warnings?.length && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-semibold">Interpretation limits ({trend.warnings.length})</summary>
                <ul className="mt-2 list-disc space-y-2 pl-5">{trend.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
              </details>
            )}
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        A significant trend does not identify its cause. A non-significant result does not prove there is no change. Review the chart, method agreement, and uncertainty below.
      </p>
      <Link className="mt-4 inline-flex min-h-11 items-center font-bold text-accent underline underline-offset-4" to="/dashboard">Refine your question →</Link>
    </section>
  )
}

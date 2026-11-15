import { useLocation } from 'react-router-dom'
import { navigation } from './navigation'
import { useResearch } from '../../context/ResearchContext'

export function Header() {
  const { pathname } = useLocation()
  const { draft } = useResearch()
  const section = navigation.find((item) => item.path === pathname) ?? navigation[0]

  return (
    <header className="flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-line bg-surface px-5 py-5 shadow-[0_1px_0_rgb(16_35_63_/_0.02)] sm:px-8 xl:px-10">
      <div>
        <p className="text-sm font-bold tracking-tight">{section.label}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{section.description}</p>
      </div>
      <span className="status-pill" data-demo={draft.sourceId === 'local-demo'}>{draft.sourceId === 'local-demo' ? 'Demo local · sintético' : 'NASA POWER · MVP'}</span>
    </header>
  )
}

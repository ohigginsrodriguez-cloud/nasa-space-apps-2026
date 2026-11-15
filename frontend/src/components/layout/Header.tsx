import { useLocation } from 'react-router-dom'
import { navigation } from './navigation'
import { useResearch } from '../../context/ResearchContext'
import { useLanguage } from '../../context/LanguageContext'

export function Header() {
  const { pathname } = useLocation()
  const { draft } = useResearch()
  const { t } = useLanguage()
  const section = navigation.find((item) => item.path === pathname) ?? navigation[0]

  return (
    <header className="flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-line bg-surface px-5 py-5 shadow-[0_1px_0_rgb(16_35_63_/_0.02)] sm:px-8 xl:px-10">
      <div>
        <p className="text-sm font-bold tracking-tight">{section.id === 'investigation' ? t('investigation') : t('trends')}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{section.id === 'investigation' ? t('investigationDescription') : t('trendsDescription')}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="status-pill" data-demo={draft.sourceId === 'local-demo'}>{draft.sourceId === 'local-demo' ? 'Local demo · synthetic' : 'NASA POWER · live data'}</span>
      </div>
    </header>
  )
}

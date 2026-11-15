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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3 sm:px-8 xl:px-10">
      <div>
        <p className="text-sm font-bold tracking-tight">{section.id === 'investigation' ? t('investigation') : t('trends')}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="status-pill" data-demo={draft.sourceId === 'local-demo'}>{draft.sourceId === 'local-demo' ? 'Selected source · synthetic demo' : 'Selected source · NASA POWER'}</span>
      </div>
    </header>
  )
}

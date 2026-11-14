import { useLocation } from 'react-router-dom'
import { navigation } from './navigation'

export function Header() {
  const { pathname } = useLocation()
  const section = navigation.find((item) => item.path === pathname) ?? navigation[0]

  return (
    <header className="flex min-h-24 flex-wrap items-center justify-between gap-4 border-b border-line bg-surface px-5 py-5 sm:px-8 xl:px-10">
      <div>
        <p className="text-sm font-semibold">{section.label}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted sm:text-sm">{section.description}</p>
      </div>
      <span className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-muted"><span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />NASA POWER · MVP</span>
    </header>
  )
}

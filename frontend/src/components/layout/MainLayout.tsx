import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { pathname } = useLocation()
  const mainContent = useRef<HTMLElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    mainContent.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="min-h-dvh lg:flex">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-accent p-3 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4">Saltar al contenido</a>
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <main ref={mainContent} id="main-content" tabIndex={-1} className="mx-auto max-w-400 px-5 py-7 outline-none sm:px-8 sm:py-9 xl:px-10">{children}</main>
      </div>
    </div>
  )
}

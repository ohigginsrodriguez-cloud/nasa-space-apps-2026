import { useRef, useState } from 'react'
import { ArrowLeftToLine, ArrowRightFromLine, ChevronDown, Orbit, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigation } from './navigation'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  return (
    <aside
      className={`z-20 shrink-0 border-b border-accent-hover bg-accent text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0 ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && mobileOpen) {
          setMobileOpen(false)
          menuButton.current?.focus()
        }
      }}
    >
      <div className={`flex h-20 items-center justify-between gap-3 px-5 lg:h-24 ${collapsed ? 'lg:justify-center lg:px-3' : 'lg:px-6'}`}>
        <NavLink to="/dashboard" aria-label="Earth System Trend Detective — Inicio" className="flex min-w-0 items-center gap-3 rounded-md" onClick={() => setMobileOpen(false)}>
           <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-accent shadow-md"><Orbit size={25} strokeWidth={1.8} aria-hidden="true" /></span>
          <span className={collapsed ? 'lg:sr-only' : ''}>
             <span className="block text-sm font-extrabold tracking-[0.04em]">EARTH SYSTEM</span>
             <span className="block text-xs font-medium tracking-wide text-white/70">Trend Detective</span>
          </span>
        </NavLink>
        <button ref={menuButton} type="button" className="flex size-11 items-center justify-center rounded-lg border border-white/25 text-white transition-colors hover:bg-white/10 lg:hidden" aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobileOpen} aria-controls="main-navigation" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
        </button>
      </div>

      <nav id="main-navigation" aria-label="Navegación principal" className={`${mobileOpen ? 'block' : 'hidden'} px-3 pb-5 lg:block lg:flex-1 lg:overflow-y-auto lg:pt-5`}>
        <p className={`mb-3 px-3 text-[10px] font-semibold tracking-[0.18em] text-white/60 ${collapsed ? 'lg:sr-only' : ''}`}>INVESTIGACIÓN</p>
        <ul className="space-y-1.5">
          {navigation.map(({ id, path, label, icon: Icon }) => (
            <li key={id}>
               <NavLink to={path} end={path === '/dashboard'} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex min-h-11 w-full items-center gap-3 rounded-lg border-l-2 px-3 py-3 text-left text-sm transition-all duration-200 motion-reduce:transition-none ${collapsed ? 'lg:justify-center' : ''} ${isActive ? 'border-signal bg-white/12 font-bold text-white' : 'border-transparent text-white/72 hover:bg-white/10 hover:text-white'}`}>
                {({ isActive }) => <>
                  <Icon size={19} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
                  <span className={collapsed ? 'lg:sr-only' : ''}>{label}</span>
                   {isActive && <span className={`ml-auto size-1.5 rounded-full bg-signal ${collapsed ? 'lg:hidden' : ''}`} aria-hidden="true" />}
                </>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="hidden border-t border-white/15 p-4 lg:block">
        <button type="button" aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'} aria-expanded={!collapsed} className={`flex min-h-11 w-full items-center gap-3 rounded-lg text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : 'px-3'}`} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ArrowRightFromLine size={18} aria-hidden="true" /> : <><ArrowLeftToLine size={18} aria-hidden="true" /><span>Contraer panel</span></>}
        </button>
      </div>
    </aside>
  )
}

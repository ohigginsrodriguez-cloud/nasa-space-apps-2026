import { Orbit } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function Sidebar() {
  return (
    <header className="bg-black text-white">
      <div className="mx-auto flex max-w-400 flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8 xl:px-10">
        <NavLink to="/dashboard" className="flex items-center gap-3" aria-label="Earth Trend Detective — home">
          <Orbit size={36} className="text-signal" aria-hidden="true" />
          <span>
            <span className="block text-lg font-extrabold tracking-tight">Earth Trend Detective</span>
            <span className="text-xs tracking-widest text-white/70">NASA SPACE APPS PROJECT</span>
          </span>
        </NavLink>
        <nav aria-label="Main navigation" className="flex gap-6 text-sm font-bold">
          {[['/dashboard', 'Investigate'], ['/trends', 'Evidence']].map(([path, label]) => (
            <NavLink key={path} to={path} className={({ isActive }) => `border-b-2 py-2 ${isActive ? 'border-signal text-white' : 'border-transparent text-white/70 hover:text-white'}`}>
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

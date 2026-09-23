import {
  Bell,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  Compass,
  Menu,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { BrandLogo } from '../components/BrandLogo'

const navigation = [
  { to: '/employee', label: 'Career', icon: BriefcaseBusiness },
  { to: '/hr', label: 'HR Analytics', icon: ChartNoAxesColumnIncreasing },
]

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-2" aria-label="Primary navigation">
      {navigation.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              isActive
                ? 'bg-white text-forest shadow-sm'
                : 'text-white/65 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col overflow-hidden bg-[#0c2823] px-5 py-7 lg:flex">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3 px-2">
          <BrandLogo />
          <div>
            <p className="text-base font-bold tracking-tight text-white">ÖRLE</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200/60">AI Career Intelligence</p>
          </div>
        </div>

        <div className="relative mt-10">
          <p className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Workspace</p>
          <NavigationLinks />
        </div>

        <div className="relative mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <p className="mt-3 text-sm font-semibold text-white">Your growth. Your path. Your next move.</p>
          <p className="mt-1 text-xs leading-5 text-white/50">Turn every development activity into measurable career momentum.</p>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-canvas/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex">
              <Compass className="h-4 w-4 text-emerald-600" />
              HackAlem · Halyk Bank track
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 sm:inline-flex">
              Live intelligence
            </span>
            <button type="button" aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-bold text-white">AS</div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-[280px] bg-[#0c2823] p-6 shadow-2xl">
            <div className="mb-10 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <BrandLogo className="h-9 w-9" />
                <span className="font-bold">ÖRLE</span>
              </div>
              <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="text-white/60">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavigationLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  )
}


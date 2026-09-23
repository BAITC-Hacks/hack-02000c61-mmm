import { Activity, BarChart3, Bell, BriefcaseBusiness, ChevronRight, Menu, Route, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export interface ShellProfile { name: string; initials: string; role: string }
export interface ShellOutletContext { setProfile: (profile: ShellProfile) => void }

const navigation = [
  { to: '/employee', label: 'Career', icon: BriefcaseBusiness },
  { to: '/employee#journey', label: 'Journey', icon: Route },
  { to: '/employee#activities', label: 'Activities', icon: Activity },
  { to: '/hr', label: 'HR Analytics', icon: BarChart3 },
]

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  return <nav className="space-y-1.5" aria-label="Primary navigation">{navigation.map(({ to, label, icon: Icon }) => {
    const [path, hash = ''] = to.split('#')
    const isActive = location.pathname === path && location.hash === (hash ? `#${hash}` : '')
    return <Link key={to} to={to} onClick={onNavigate} className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${isActive ? 'border border-emerald-400/15 bg-emerald-400/[0.09] text-emerald-200 shadow-[inset_3px_0_0_#34d399]' : 'border border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'}`}><Icon className={`h-[18px] w-[18px] ${isActive ? 'text-emerald-300' : 'text-slate-600 group-hover:text-slate-300'}`} strokeWidth={1.8} /><span>{label}</span>{isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-emerald-400/70" />}</Link>
  })}</nav>
}

function Brand() {
  return <div className="flex items-center gap-3"><div className="relative grid h-10 w-10 place-items-center border border-emerald-300/20 bg-emerald-300/[0.08] text-[13px] font-black tracking-tight text-emerald-200 shadow-glow">CQ<span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-[#0a0f17] bg-emerald-400" /></div><div><p className="text-[15px] font-extrabold tracking-[-0.02em] text-white">Career Quest</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-slate-600">Career operating system</p></div></div>
}

export function PremiumAppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profile, setProfile] = useState<ShellProfile>({ name: 'Career Explorer', initials: 'CQ', role: 'Official workspace' })
  return <div className="min-h-screen bg-canvas text-ink">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-white/[0.06] bg-[#090e16]/95 px-5 py-6 backdrop-blur-xl lg:flex">
      <Brand />
      <div className="mt-10"><p className="mb-3 px-3.5 text-[9px] font-bold uppercase tracking-[0.24em] text-slate-700">Navigate</p><NavigationLinks /></div>
      <div className="mt-auto"><div className="mb-4 border-y border-white/[0.05] py-4"><div className="flex items-start gap-3 text-slate-500"><Sparkles className="mt-0.5 h-4 w-4 text-emerald-400" /><p className="text-[11px] leading-5">Every move is grounded in your target-grade requirements.</p></div></div><div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-300 to-teal-500 text-[11px] font-black text-[#07110e]">{profile.initials}</div><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-200">{profile.name}</p><p className="mt-1 truncate text-[10px] text-slate-600">{profile.role}</p></div><span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /></div></div>
    </aside>
    <div className="lg:pl-[264px]"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.05] bg-[#070b12]/80 px-4 backdrop-blur-xl sm:px-7 lg:px-10"><div className="flex items-center gap-3"><button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] lg:hidden"><Menu className="h-5 w-5" /></button><div className="hidden items-center gap-2 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Intelligence online</span></div></div><div className="flex items-center gap-3"><span className="hidden rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:inline-flex">Official data</span><button type="button" aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-white"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400" /></button></div></header><main className="min-h-[calc(100vh-4rem)]"><Outlet context={{ setProfile } satisfies ShellOutletContext} /></main></div>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /><aside className="relative h-full w-[280px] border-r border-white/10 bg-[#090e16] p-6 shadow-2xl"><div className="mb-10 flex items-center justify-between"><Brand /><button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="text-slate-500"><X className="h-5 w-5" /></button></div><NavigationLinks onNavigate={() => setMobileOpen(false)} /></aside></div>}
  </div>
}

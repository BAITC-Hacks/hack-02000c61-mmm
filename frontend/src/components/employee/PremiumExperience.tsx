import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Gauge,
  MapPin,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

import type { ActivityHistoryItem, EmployeeProfile, EmployeeSummary, Recommendation, SimulationResponse } from '../../types/career'

function readinessLabel(value: number) {
  if (value >= 80) return 'Milestone in sight'
  if (value >= 60) return 'Momentum building'
  return 'Route in progress'
}

export function PremiumEmployeeHero({ employee, employees, onEmployeeChange }: { employee: EmployeeProfile; employees: EmployeeSummary[]; onEmployeeChange: (id: string) => void }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const stepsAway = employee.recommendations.length

  return (
    <section className="panel-grid relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#111a24] via-[#0d151e] to-[#0a1118] p-6 shadow-card sm:p-8 xl:p-10">
      <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-emerald-400/[0.08] blur-3xl" />
      <div className="relative flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div className="animate-rise">
            <p className="eyebrow">Career command center</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">{greeting}, {employee.name.split(' ')[0]}.</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400"><span className="font-semibold text-slate-200">{employee.role}</span><span className="h-1 w-1 rounded-full bg-slate-700" /><span>{employee.currentGrade}</span><span className="h-1 w-1 rounded-full bg-slate-700" /><span>{employee.location}</span></div>
          </div>
          <div className="relative w-full xl:w-[350px]">
            <label htmlFor="employee-switcher" className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Explore employee profile</label>
            <select id="employee-switcher" value={employee.id} onChange={(event) => onEmployeeChange(event.target.value)} className="focus-ring w-full appearance-none rounded-xl border border-white/[0.09] bg-[#090f17] py-3.5 pl-14 pr-10 text-sm font-semibold text-slate-200 shadow-inner">
              {employees.map((option) => <option key={option.employee_id} value={option.employee_id}>{option.full_name} · {option.role}</option>)}
            </select>
            <div className="pointer-events-none absolute bottom-2.5 left-3 grid h-9 w-9 place-items-center rounded-lg bg-emerald-300 text-[10px] font-black text-[#06130f]">{employee.initials}</div>
            <ChevronDown className="pointer-events-none absolute bottom-[18px] right-4 h-4 w-4 text-slate-600" />
          </div>
        </div>

        <div className="grid gap-7 border-t border-white/[0.06] pt-7 xl:grid-cols-[1fr_310px] xl:items-end">
          <div>
            <div className="flex items-center justify-between gap-4"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">Your path to {employee.targetGrade}</p><span className="text-[10px] font-bold text-emerald-300">{employee.targetRole}</span></div>
            <div className="mt-7 flex items-start">
              <div className="relative z-10"><div className="animate-route grid h-10 w-10 place-items-center rounded-full border border-emerald-300/40 bg-emerald-300 text-[#05120e]"><MapPin className="h-4 w-4" /></div><p className="mt-3 text-sm font-extrabold text-white">{employee.currentGrade}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-300">You are here</p></div>
              <div className="relative mx-4 mt-5 h-px flex-1 bg-white/10"><div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${Math.max(5, employee.readiness)}%` }} /><span className="absolute -top-1 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_#34d399]" style={{ left: `${Math.min(98, employee.readiness)}%` }} /></div>
              <div className="text-right"><div className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-slate-400"><Target className="h-4 w-4" /></div><p className="mt-3 text-sm font-extrabold text-white">{employee.targetGrade}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600">Next milestone</p></div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
            <div className="flex items-end gap-3"><span className="text-6xl font-extrabold leading-none tracking-[-0.07em] text-white">{employee.readiness.toFixed(1)}</span><span className="mb-1 text-2xl font-bold text-emerald-300">%</span></div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Career readiness · {readinessLabel(employee.readiness)}</p>
            <p className="mt-4 text-xs leading-5 text-slate-500">{stepsAway > 0 ? `You’re ${stepsAway} grounded step${stepsAway === 1 ? '' : 's'} away from your clearest available route.` : 'Your route needs new activity coverage.'}</p>
            <div className="mt-4 flex gap-4 text-[10px] font-semibold text-slate-500"><span><strong className="text-slate-200">{employee.satisfiedRequirements}</strong>/{employee.totalRequirements} ready</span><span><strong className="text-rose-300">{employee.criticalGapCount}</strong> critical gaps</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function CareerJourney({ employee }: { employee: EmployeeProfile }) {
  const lastCompleted = employee.history.find((item) => item.status === 'completed')
  return (
    <section id="career-journey" className="scroll-mt-24">
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow">Career GPS</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-white">Your route to the next milestone</h2><p className="mt-2 text-sm text-slate-500">A live path built from eligible activities—not a generic course catalog.</p></div><Route className="hidden h-7 w-7 text-emerald-400/70 sm:block" /></div>
      <div className="surface-card panel-grid overflow-hidden p-6 sm:p-8">
        <div className="relative ml-4 border-l border-dashed border-white/15 pl-8">
          {lastCompleted && <JourneyNode state="completed" eyebrow="Recent progress" title={lastCompleted.title} detail={lastCompleted.detail} />}
          <JourneyNode state="current" eyebrow="Current position" title={`${employee.role} · ${employee.currentGrade}`} detail={`${employee.readiness.toFixed(1)}% readiness`} />
          {employee.recommendations.map((recommendation, index) => <JourneyNode key={recommendation.id} state={index === 0 ? 'recommended' : 'available'} eyebrow={index === 0 ? 'Best next move' : `Alternative ${index + 1}`} title={recommendation.title} detail={`${recommendation.skillName} · +${recommendation.readinessGain}% readiness`} />)}
          <JourneyNode state="target" eyebrow="Target milestone" title={`${employee.targetRole} · ${employee.targetGrade}`} detail={`${employee.totalRequirements} official requirements`} last />
        </div>
      </div>
    </section>
  )
}

function JourneyNode({ state, eyebrow, title, detail, last = false }: { state: 'completed' | 'current' | 'recommended' | 'available' | 'target'; eyebrow: string; title: string; detail: string; last?: boolean }) {
  const styles = {
    completed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300', current: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200', recommended: 'border-emerald-300 bg-emerald-300 text-[#06130f] shadow-[0_0_24px_rgba(52,211,153,.25)]', available: 'border-white/15 bg-[#111923] text-slate-400', target: 'border-amber-200/30 bg-amber-200/10 text-amber-200',
  }
  return <div className={`${last ? '' : 'pb-8'} relative`}><div className={`absolute -left-[49px] top-0 grid h-8 w-8 place-items-center rounded-full border ${styles[state]}`}>{state === 'completed' ? <Check className="h-3.5 w-3.5" /> : state === 'recommended' ? <Sparkles className="h-3.5 w-3.5" /> : state === 'target' ? <Target className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</div><div className={`rounded-xl border p-4 ${state === 'recommended' ? 'border-emerald-300/20 bg-emerald-300/[0.06]' : 'border-white/[0.06] bg-white/[0.018]'}`}><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">{eyebrow}</p><div className="mt-1.5 flex flex-col justify-between gap-1 sm:flex-row sm:items-center"><p className="text-sm font-bold text-slate-100">{title}</p><p className="text-[11px] text-slate-500">{detail}</p></div></div></div>
}

export function RecommendationDeck({ employee, selectedId, onSelect, onPreview, onComplete, busy }: { employee: EmployeeProfile; selectedId: string | null; onSelect: (id: string) => void; onPreview: (recommendation: Recommendation) => void; onComplete: (recommendation: Recommendation) => void; busy: boolean }) {
  const [evidenceId, setEvidenceId] = useState<string | null>(employee.recommendations[0]?.id ?? null)
  const [primary, ...alternatives] = employee.recommendations
  if (!primary) return <section id="career-activities" className="surface-card scroll-mt-24 border-dashed p-10 text-center"><Target className="mx-auto h-7 w-7 text-slate-700" /><h2 className="mt-4 text-xl font-bold text-white">No eligible next move</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">The engine found no voluntary activity that can currently improve an eligible target-grade gap. This profile is surfaced to HR for coverage review.</p></section>
  return (
    <section id="career-activities" className="scroll-mt-24">
      <div className="mb-6"><p className="eyebrow">Career intelligence</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-white">The clearest moves from here</h2><p className="mt-2 text-sm text-slate-500">Career relevance leads. Predicted engagement only adjusts the ranking within a narrow bound.</p></div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.45fr_.75fr]">
        <RecommendationCard recommendation={primary} rank={1} primary selected={selectedId === primary.id} evidenceOpen={evidenceId === primary.id} onEvidence={() => setEvidenceId(evidenceId === primary.id ? null : primary.id)} onSelect={() => onSelect(primary.id)} onPreview={() => onPreview(primary)} onComplete={() => onComplete(primary)} busy={busy} />
        <div className="grid gap-5">{alternatives.map((item, index) => <RecommendationCard key={item.id} recommendation={item} rank={index + 2} selected={selectedId === item.id} evidenceOpen={evidenceId === item.id} onEvidence={() => setEvidenceId(evidenceId === item.id ? null : item.id)} onSelect={() => onSelect(item.id)} onPreview={() => onPreview(item)} onComplete={() => onComplete(item)} busy={busy} />)}</div>
      </div>
    </section>
  )
}

function RecommendationCard({ recommendation, rank, primary = false, selected, evidenceOpen, onEvidence, onSelect, onPreview, onComplete, busy }: { recommendation: Recommendation; rank: number; primary?: boolean; selected: boolean; evidenceOpen: boolean; onEvidence: () => void; onSelect: () => void; onPreview: () => void; onComplete: () => void; busy: boolean }) {
  const mainSkill = recommendation.affectedSkills[0]
  return <article onClick={onSelect} className={`relative overflow-hidden rounded-2xl border bg-[#0d151e] transition-all duration-300 ${selected ? 'border-emerald-300/35 shadow-glow' : 'border-white/[0.07] hover:border-white/[0.13]'} ${primary ? 'p-6 sm:p-8' : 'p-5'}`}>
    {primary && <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 bg-emerald-400/[0.06] blur-3xl" />}
    <div className="relative">
      <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center rounded-md text-[10px] font-black ${primary ? 'bg-emerald-300 text-[#06130f]' : 'bg-white/[0.06] text-slate-500'}`}>0{rank}</span><p className={`text-[9px] font-black uppercase tracking-[0.2em] ${primary ? 'text-emerald-300' : 'text-slate-600'}`}>{primary ? 'Best next move' : 'Alternative route'}</p></div><h3 className={`${primary ? 'mt-5 text-3xl' : 'mt-4 text-lg'} text-balance font-extrabold tracking-[-0.035em] text-white`}>{recommendation.title}</h3>{primary && <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{recommendation.description}</p>}</div><div className="shrink-0 text-right"><p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-600">Career impact</p><p className={`${primary ? 'text-2xl' : 'text-lg'} mt-1 font-extrabold text-emerald-300`}>+{recommendation.readinessGain}%</p></div></div>
      <div className={`mt-6 grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.07] ${primary ? 'sm:grid-cols-3' : 'grid-cols-2'}`}>
        <Metric label={mainSkill?.skill_name ?? recommendation.skillName} value={`${mainSkill?.current_level ?? 0} → ${mainSkill?.projected_level ?? 0}`} />
        <Metric label="Readiness" value={`${recommendation.readinessBefore}% → ${recommendation.readinessAfter}%`} />
        {primary && <Metric label="Predicted engagement" value={recommendation.engagementProbability === null ? 'Unavailable' : `${Math.round(recommendation.engagementProbability * 100)}%`} />}
      </div>
      {!primary && <div className="mt-4 flex items-center justify-between text-[11px] text-slate-600"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{recommendation.duration}</span><span>{recommendation.format}</span></div>}
      <button type="button" onClick={(event) => { event.stopPropagation(); onEvidence() }} className="focus-ring mt-5 flex w-full items-center justify-between border-t border-white/[0.06] pt-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400"><span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-emerald-300" />Why this step?</span><ChevronDown className={`h-4 w-4 transition-transform ${evidenceOpen ? 'rotate-180' : ''}`} /></button>
      {evidenceOpen && <Evidence recommendation={recommendation} />}
      <div className={`mt-5 grid gap-2 ${primary ? 'sm:grid-cols-2' : ''}`}><button type="button" onClick={(event) => { event.stopPropagation(); onPreview() }} className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-xs font-bold text-slate-200 hover:bg-white/[0.06]"><Gauge className="h-4 w-4 text-emerald-300" />Preview impact</button><button type="button" disabled={busy} onClick={(event) => { event.stopPropagation(); onComplete() }} className={`focus-ring flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-black uppercase tracking-[0.1em] transition-colors disabled:opacity-50 ${primary ? 'bg-emerald-300 text-[#06130f] hover:bg-emerald-200' : 'bg-white/[0.07] text-slate-200 hover:bg-white/[0.1]'}`}>{busy ? 'Updating…' : 'Complete quest'}<ArrowRight className="h-4 w-4" /></button></div>
    </div>
  </article>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="bg-[#0a1119] p-4"><p className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-600">{label}</p><p className="mt-2 text-sm font-extrabold text-slate-100">{value}</p></div> }

function Evidence({ recommendation }: { recommendation: Recommendation }) {
  return <div className="mt-4 space-y-4 rounded-xl border border-white/[0.06] bg-black/15 p-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">Career requirement</p>{recommendation.affectedSkills.map((skill) => <div key={skill.skill_id} className="mt-3 flex items-center justify-between gap-3 text-xs"><div><p className="font-bold text-slate-200">{skill.skill_name}</p><p className="mt-1 text-slate-600">Current {skill.current_level} / Required {skill.required_level}</p></div>{skill.critical && <span className="rounded-md border border-rose-300/15 bg-rose-300/[0.06] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-rose-300">Critical</span>}</div>)}</div><div className="space-y-2 border-t border-white/[0.06] pt-3">{recommendation.evidence.map((reason) => <p key={reason} className="flex gap-2 text-[11px] leading-5 text-slate-500"><Check className="mt-1 h-3 w-3 shrink-0 text-emerald-300" />{reason}</p>)}</div>{recommendation.comparison && <div className="border-t border-white/[0.06] pt-3"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">Why this over another activity?</p><p className="mt-2 text-[11px] leading-5 text-slate-400">{recommendation.comparison}</p></div>}</div>
}

export function ImpactPreview({ recommendation, simulation, loading, onClose, onComplete }: { recommendation: Recommendation; simulation: SimulationResponse | null; loading: boolean; onClose: () => void; onComplete: () => void }) {
  const primary = simulation?.skill_changes.find((item) => item.skill_id === recommendation.skillId) ?? simulation?.skill_changes[0]
  return <section className="animate-rise relative overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#0b1718] p-6 shadow-glow sm:p-8"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(52,211,153,.12),transparent_35%)]" /><button type="button" onClick={onClose} aria-label="Close preview" className="absolute right-5 top-5 z-10 text-slate-600 hover:text-white"><X className="h-5 w-5" /></button><div className="relative"><p className="eyebrow">Career what-if · Backend simulation</p><h2 className="mt-2 text-2xl font-extrabold text-white">Preview the route before you commit</h2><p className="mt-2 text-sm text-slate-500">{recommendation.title}</p>{loading || !simulation ? <div className="mt-8 grid gap-3 sm:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-white/[0.04]" />)}</div> : <><div className="mt-8 grid gap-3 sm:grid-cols-3"><ImpactMetric label="Career readiness" before={`${simulation.readiness_before}%`} after={`${simulation.readiness_after}%`} /><ImpactMetric label={primary?.skill_name ?? recommendation.skillName} before={String(primary?.before ?? 0)} after={String(primary?.after ?? 0)} /><ImpactMetric label="Critical gaps" before={String(simulation.critical_gaps_before.length)} after={String(simulation.critical_gaps_after.length)} /></div><div className="mt-6 flex flex-col justify-between gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center"><p className="text-xs text-slate-500"><strong className="text-emerald-300">+{simulation.readiness_delta}% readiness</strong> · {simulation.critical_gaps_closed.length} critical gap{simulation.critical_gaps_closed.length === 1 ? '' : 's'} fully closed</p><button type="button" onClick={onComplete} className="focus-ring flex items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#06130f]">Complete quest <ArrowRight className="h-4 w-4" /></button></div></>}</div></section>
}

function ImpactMetric({ label, before, after }: { label: string; before: string; after: string }) { return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p><div className="mt-5 flex items-center justify-between"><div><p className="text-[8px] uppercase tracking-wider text-slate-700">Current</p><p className="mt-1 text-2xl font-extrabold text-slate-500">{before}</p></div><ArrowRight className="h-4 w-4 text-emerald-400" /><div className="text-right"><p className="text-[8px] uppercase tracking-wider text-emerald-500/60">After quest</p><p className="mt-1 text-2xl font-extrabold text-emerald-300">{after}</p></div></div></div> }

export function SkillMatrix({ employee }: { employee: EmployeeProfile }) {
  const skills = [...employee.skills].sort((a, b) => Number(b.critical) - Number(a.critical) || b.gap - a.gap)
  return <section><div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Capability matrix</p><h2 className="mt-2 text-2xl font-extrabold text-white">Skills shaping your readiness</h2><p className="mt-2 text-sm text-slate-500">Current level against official {employee.targetGrade} requirements.</p></div><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">Official scale · 0—5</span></div><div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">{skills.map((skill, index) => <article key={skill.id} className="surface-card animate-rise p-4" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-100">{skill.name}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-700">{skill.category}</p></div>{skill.gap === 0 ? <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Ready</span> : <div className="flex gap-1.5"><span className="rounded-md bg-amber-300/[0.08] px-2 py-1 text-[9px] font-bold text-amber-200">Gap {skill.gap}</span>{skill.critical && <span className="rounded-md bg-rose-300/[0.07] px-2 py-1 text-[9px] font-bold text-rose-300">Critical</span>}</div>}</div><div className="mt-4 grid grid-cols-[48px_1fr_18px] items-center gap-3"><span className="text-[9px] font-bold uppercase tracking-wider text-slate-700">You</span><LevelDots value={skill.currentLevel} muted={false} /><strong className="text-xs text-slate-300">{skill.currentLevel}</strong><span className="text-[9px] font-bold uppercase tracking-wider text-slate-700">Target</span><LevelDots value={skill.requiredLevel} muted /><strong className="text-xs text-slate-500">{skill.requiredLevel}</strong></div></article>)}</div></section>
}

function LevelDots({ value, muted }: { value: number; muted: boolean }) { return <div className="grid grid-cols-5 gap-1.5">{Array.from({ length: 5 }, (_, i) => <span key={i} className={`h-1.5 rounded-full ${i < value ? muted ? 'bg-slate-500' : 'bg-emerald-300 shadow-[0_0_7px_rgba(52,211,153,.3)]' : 'bg-white/[0.06]'}`} />)}</div> }

const historyStyles = { completed: { icon: Check, label: 'Completed', color: 'border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-300' }, skipped: { icon: X, label: 'Not completed', color: 'border-rose-300/20 bg-rose-300/[0.06] text-rose-300' }, upcoming: { icon: TrendingUp, label: 'In progress', color: 'border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-200' } }
export function PremiumTimeline({ history }: { history: ActivityHistoryItem[] }) { return <section><div className="mb-6"><p className="eyebrow">Activity history</p><h2 className="mt-2 text-2xl font-extrabold text-white">Your development signal</h2><p className="mt-2 text-sm text-slate-500">Official participation outcomes, newest first.</p></div><div className="surface-card p-5 sm:p-7"><div className="relative ml-4 border-l border-white/[0.07]">{history.map((item, index) => { const config = historyStyles[item.status]; const Icon = config.icon; return <div key={item.id} className={`${index !== history.length - 1 ? 'pb-6' : ''} relative pl-8`}><div className={`absolute -left-[17px] grid h-8 w-8 place-items-center rounded-full border ${config.color}`}><Icon className="h-3.5 w-3.5" /></div><div className="flex flex-col justify-between gap-2 rounded-xl border border-white/[0.05] bg-white/[0.018] px-4 py-3 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-slate-200">{item.title}</p><p className="mt-1 text-[10px] capitalize text-slate-600">{item.detail}</p></div><span className={`w-fit text-[9px] font-bold uppercase tracking-[0.16em] ${config.color.split(' ').at(-1)}`}>{config.label}</span></div></div> })}</div></div></section> }

export function QuestCompleted({ title, simulation, onClose }: { title: string; simulation: SimulationResponse; onClose: () => void }) { const changed = simulation.skill_changes.find((item) => item.gain_applied > 0); return <div className="fixed bottom-5 right-5 z-50 w-[min(420px,calc(100vw-2rem))] animate-rise overflow-hidden rounded-2xl border border-emerald-300/25 bg-[#0b1718] p-5 shadow-[0_24px_80px_rgba(0,0,0,.55)]"><button type="button" onClick={onClose} aria-label="Dismiss completion" className="absolute right-4 top-4 text-slate-600 hover:text-white"><X className="h-4 w-4" /></button><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-300 text-[#06130f]"><Check className="h-5 w-5" /></div><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">Quest completed</p><h3 className="mt-1 text-lg font-extrabold text-white">{title}</h3></div></div><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-lg bg-white/[0.035] p-3"><p className="text-[8px] uppercase tracking-wider text-slate-600">{changed?.skill_name ?? 'Capability'}</p><p className="mt-1 text-sm font-bold text-slate-200">{changed?.before ?? 0} → <span className="text-emerald-300">{changed?.after ?? 0}</span></p></div><div className="rounded-lg bg-white/[0.035] p-3"><p className="text-[8px] uppercase tracking-wider text-slate-600">Career readiness</p><p className="mt-1 text-sm font-bold text-slate-200">{simulation.readiness_before}% → <span className="text-emerald-300">{simulation.readiness_after}%</span></p></div></div><p className="mt-4 text-xs leading-5 text-slate-500">Your Career GPS has recalculated the route.</p></div> }

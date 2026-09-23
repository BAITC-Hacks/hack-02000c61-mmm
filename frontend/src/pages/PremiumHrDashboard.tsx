import { CalendarDays, LoaderCircle, Radar, Sparkles, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { DevelopmentStatusChart, ParticipationChart, SkillGapChart } from '../components/hr/AnalyticsCharts'
import { EmployeeTable } from '../components/hr/EmployeeTable'
import { MetricCards } from '../components/hr/MetricCards'
import { getHrAnalytics } from '../services/api'
import type { EmployeeAnalyticsRow, Metric, ParticipationMetric, SkillGapMetric, StatusMetric } from '../types/analytics'

interface AnalyticsResponse {
  as_of_date: string
  employee_count: number
  average_career_readiness: number
  most_common_target_grade_skill_gaps: SkillGapMetric[]
  critical_gap_frequency: SkillGapMetric[]
  participation_outcomes: Array<{ activity_type: string; enrolled: number; completed: number }>
  employees_with_no_eligible_next_step: number
  development_bottlenecks: Array<{ skill: string; employees_needing_improvement: number; available_activities: number; pressure_ratio: number }>
  employees: Array<{ employee_id: string; full_name: string; role: string; grade: string; readiness: number; primary_gap: string; recommendation_status: 'Ready' | 'Review' | 'No next step' }>
}

export function HrDashboard() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { getHrAnalytics<AnalyticsResponse>().then(setData).catch((reason: Error) => setError(reason.message)) }, [])

  const view = useMemo(() => {
    if (!data) return null
    const needingGuidance = data.employees.filter((item) => item.recommendation_status === 'Review').length
    const metrics: Metric[] = [
      { label: 'Employees', value: String(data.employee_count), change: `Official snapshot · ${data.as_of_date}`, tone: 'neutral' },
      { label: 'Average readiness', value: `${data.average_career_readiness}%`, change: 'Across target-grade profiles', tone: 'positive' },
      { label: 'Need guidance', value: String(needingGuidance), change: 'Below readiness threshold', tone: 'attention' },
      { label: 'Without next step', value: String(data.employees_with_no_eligible_next_step), change: 'Activity coverage required', tone: 'attention' },
    ]
    const participation: ParticipationMetric[] = data.participation_outcomes.slice(0, 6).map((item) => ({ activity: item.activity_type, enrolled: item.enrolled, completed: item.completed }))
    const status: StatusMetric[] = [
      { name: 'On track', value: data.employees.filter((item) => item.readiness >= 80 && item.recommendation_status !== 'No next step').length, color: '#34d399' },
      { name: 'Needs guidance', value: data.employees.filter((item) => item.readiness >= 50 && item.readiness < 80 && item.recommendation_status !== 'No next step').length, color: '#e3c26f' },
      { name: 'At risk', value: data.employees.filter((item) => item.readiness < 50 && item.recommendation_status !== 'No next step').length, color: '#fb7185' },
      { name: 'No next step', value: data.employees_with_no_eligible_next_step, color: '#52606d' },
    ]
    const rows: EmployeeAnalyticsRow[] = data.employees.slice(0, 12).map((item) => ({ id: item.employee_id, employee: item.full_name, initials: item.full_name.split(' ').map((part) => part[0]).slice(0, 2).join(''), role: item.role, grade: item.grade, readiness: Math.round(item.readiness), primaryGap: item.primary_gap, recommendationStatus: item.recommendation_status }))
    return { metrics, participation, status, rows }
  }, [data])

  if (error) return <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-rose-300/15 bg-rose-300/[0.04] p-8 text-center"><TriangleAlert className="mx-auto h-7 w-7 text-rose-300" /><h1 className="mt-4 text-xl font-extrabold">HR intelligence is unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div>
  if (!data || !view) return <div className="grid min-h-[70vh] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-emerald-300" /></div>

  return <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
    <header className="panel-grid relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c141d] p-7 sm:p-9">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-300/[0.05] blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><div><div className="flex items-center gap-2"><Radar className="h-4 w-4 text-emerald-300" /><p className="eyebrow">Workforce development intelligence</p></div><h1 className="mt-4 text-3xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">Organization capability pulse.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">See where career readiness is accelerating, where critical gaps concentrate, and where the activity portfolio needs investment.</p></div><div className="flex w-fit items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"><CalendarDays className="h-4 w-4 text-emerald-300" />Snapshot {data.as_of_date}</div></div>
    </header>
    <div className="mt-6"><MetricCards metrics={view.metrics} /></div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><SkillGapChart data={data.most_common_target_grade_skill_gaps.slice(0, 6)} /><DevelopmentStatusChart data={view.status} /></div>

    <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-[#0d1a1b] to-[#0b1219] p-6 shadow-glow sm:p-8">
      <div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-300/[0.1] text-emerald-300"><Sparkles className="h-4 w-4" /></div><div><p className="eyebrow">Development bottlenecks</p><h2 className="mt-2 text-2xl font-extrabold text-white">Where demand outpaces activity supply</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Pressure uses official target-grade gaps and the number of voluntary activities that can develop each skill.</p></div></div>
      <div className="mt-7 grid gap-3 lg:grid-cols-3">{data.development_bottlenecks.slice(0, 3).map((item, index) => {
        const criticalCount = data.critical_gap_frequency.find((gap) => gap.skill === item.skill)?.employees ?? 0
        return <article key={item.skill} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-5"><div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">Priority 0{index + 1}</span><span className="text-[10px] font-bold text-emerald-300">{item.pressure_ratio}× pressure</span></div><h3 className="mt-4 text-lg font-extrabold text-white">{item.skill}</h3><div className="mt-5 space-y-3"><div className="flex justify-between text-xs"><span className="text-slate-500">Employees with gap</span><strong className="text-slate-200">{item.employees_needing_improvement}</strong></div><div className="flex justify-between text-xs"><span className="text-slate-500">Critical requirement gaps</span><strong className="text-amber-200">{criticalCount}</strong></div><div className="flex justify-between text-xs"><span className="text-slate-500">Relevant activities</span><strong className={item.available_activities <= 1 ? 'text-rose-300' : 'text-emerald-300'}>{item.available_activities}</strong></div></div><div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.min(100, item.pressure_ratio * 5)}%` }} /></div></article>
      })}</div>
    </section>

    <div className="mt-6"><ParticipationChart data={view.participation} /></div>
    <div className="mt-6 pb-12"><EmployeeTable rows={view.rows} /></div>
  </div>
}

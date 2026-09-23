import { CalendarDays, LoaderCircle, Sparkles, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { DevelopmentStatusChart, ParticipationChart, SkillGapChart } from '../components/hr/AnalyticsCharts'
import { EmployeeTable } from '../components/hr/EmployeeTable'
import { MetricCards } from '../components/hr/MetricCards'
import { getHrAnalytics } from '../services/api'
import type { EmployeeAnalyticsRow, GuidanceSummary, Metric, ParticipationMetric, SkillGapMetric, StatusMetric } from '../types/analytics'

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

  useEffect(() => {
    getHrAnalytics<AnalyticsResponse>().then(setData).catch((reason: Error) => setError(reason.message))
  }, [])

  const view = useMemo(() => {
    if (!data) return null
    const criticalTotal = data.critical_gap_frequency.reduce((sum, item) => sum + item.employees, 0)
    const metrics: Metric[] = [
      { label: 'Employees', value: String(data.employee_count), change: `Official snapshot · ${data.as_of_date}`, tone: 'neutral' },
      { label: 'Average readiness', value: `${data.average_career_readiness}%`, change: 'Target-grade weighted average', tone: 'positive' },
      { label: 'Critical gaps', value: String(criticalTotal), change: 'Promotion-critical requirements', tone: 'attention' },
      { label: 'Without next step', value: String(data.employees_with_no_eligible_next_step), change: 'Requires activity coverage review', tone: 'attention' },
    ]
    const participation: ParticipationMetric[] = data.participation_outcomes.slice(0, 6).map((item) => ({ activity: item.activity_type, enrolled: item.enrolled, completed: item.completed }))
    const status: StatusMetric[] = [
      { name: 'On track', value: data.employees.filter((item) => item.readiness >= 80 && item.recommendation_status !== 'No next step').length, color: '#178a69' },
      { name: 'Needs guidance', value: data.employees.filter((item) => item.readiness >= 50 && item.readiness < 80 && item.recommendation_status !== 'No next step').length, color: '#d2a947' },
      { name: 'At risk', value: data.employees.filter((item) => item.readiness < 50 && item.recommendation_status !== 'No next step').length, color: '#dd6b55' },
      { name: 'No next step', value: data.employees_with_no_eligible_next_step, color: '#a7b4af' },
    ]
    const rows: EmployeeAnalyticsRow[] = data.employees.slice(0, 12).map((item) => ({
      id: item.employee_id,
      employee: item.full_name,
      initials: item.full_name.split(' ').map((part) => part[0]).slice(0, 2).join(''),
      role: item.role,
      grade: item.grade,
      readiness: Math.round(item.readiness),
      primaryGap: item.primary_gap,
      recommendationStatus: item.recommendation_status,
    }))
    const guidance: GuidanceSummary[] = [
      { value: String(data.most_common_target_grade_skill_gaps[0]?.employees ?? 0), label: `${data.most_common_target_grade_skill_gaps[0]?.skill ?? 'Top'} gaps` },
      { value: String(criticalTotal), label: 'Critical gaps' },
      { value: String(data.employees_with_no_eligible_next_step), label: 'Without next step' },
    ]
    return { metrics, participation, status, rows, guidance }
  }, [data])

  if (error) return <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center"><TriangleAlert className="mx-auto h-7 w-7 text-rose-500" /><h1 className="mt-4 text-xl font-extrabold">HR intelligence is unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div>
  if (!data || !view) return <div className="grid min-h-[70vh] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" /></div>

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="animate-rise"><div className="mb-3 flex items-center gap-2"><span className="h-px w-7 bg-emerald-500" /><p className="eyebrow">Workforce intelligence</p></div><h1 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">Development pulse</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">See where target-grade gaps are forming—and where activity coverage can unlock momentum.</p></div>
        <div className="flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm"><CalendarDays className="mr-2 h-4 w-4" /> Snapshot {data.as_of_date}</div>
      </div>
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4"><div className="flex gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /><p className="text-xs leading-5 text-emerald-950"><strong>Official intelligence:</strong> every value below is calculated from the Career Quest dataset and deterministic readiness engine.</p></div></div>
      <div className="mt-6"><MetricCards metrics={view.metrics} /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><SkillGapChart data={data.most_common_target_grade_skill_gaps.slice(0, 5)} /><ParticipationChart data={view.participation} /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.6fr]">
        <DevelopmentStatusChart data={view.status} />
        <div className="rounded-2xl bg-[#10332c] p-6 text-white shadow-card sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60">Development bottlenecks</p><h2 className="mt-3 max-w-xl text-2xl font-extrabold tracking-tight">Where employee demand exceeds activity supply.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Pressure compares employees needing a skill with the number of voluntary activities that develop it.</p><div className="mt-7 grid gap-3 sm:grid-cols-3">{data.development_bottlenecks.slice(0, 3).map((item) => <div key={item.skill} className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><p className="text-xl font-extrabold text-emerald-200">{item.skill}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">{item.employees_needing_improvement} people · {item.available_activities} activities</p></div>)}</div></div>
      </div>
      <div className="mt-6 pb-10"><EmployeeTable rows={view.rows} /></div>
    </div>
  )
}

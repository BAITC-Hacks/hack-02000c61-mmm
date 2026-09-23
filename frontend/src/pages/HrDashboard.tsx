import { CalendarDays, Download, Sparkles } from 'lucide-react'

import { DevelopmentStatusChart, ParticipationChart, SkillGapChart } from '../components/hr/AnalyticsCharts'
import { EmployeeTable } from '../components/hr/EmployeeTable'
import { MetricCards } from '../components/hr/MetricCards'
import {
  mockDevelopmentStatus,
  mockEmployeeAnalytics,
  mockGuidanceSummary,
  mockHrMetrics,
  mockParticipation,
  mockSkillGaps,
} from '../mocks/hrAnalytics'

export function HrDashboard() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="animate-rise">
          <div className="mb-3 flex items-center gap-2"><span className="h-px w-7 bg-emerald-500" /><p className="eyebrow">Workforce intelligence</p></div>
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">Development pulse</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">See where capability gaps are forming—and where the organization can unlock momentum.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="focus-ring flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm"><CalendarDays className="h-4 w-4" /> This quarter</button>
          <button type="button" className="focus-ring flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white"><Download className="h-4 w-4" /> Export view</button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4">
        <div className="flex gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><p className="text-xs leading-5 text-amber-900"><strong>Demo analytics:</strong> all values on this page are isolated mock data. Official organizational aggregates will be calculated only after the dataset schemas are inspected.</p></div>
      </div>

      <div className="mt-6"><MetricCards metrics={mockHrMetrics} /></div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SkillGapChart data={mockSkillGaps} />
        <ParticipationChart data={mockParticipation} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.75fr_1.6fr]">
        <DevelopmentStatusChart data={mockDevelopmentStatus} />
        <div className="rounded-2xl bg-[#10332c] p-6 text-white shadow-card sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60">Guidance opportunity</p>
          <h2 className="mt-3 max-w-xl text-2xl font-extrabold tracking-tight">Close the gap between available development and the people who need it.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Some demo employees have no suggested next step. The future engine will surface whether the cause is missing activity coverage, eligibility, or incomplete profile data.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {mockGuidanceSummary.map(({ value, label }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><p className="text-2xl font-extrabold text-emerald-200">{value}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">{label}</p></div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pb-10"><EmployeeTable rows={mockEmployeeAnalytics} /></div>
    </div>
  )
}


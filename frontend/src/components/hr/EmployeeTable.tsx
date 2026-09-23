import { ArrowUpRight, MoreHorizontal } from 'lucide-react'

import type { EmployeeAnalyticsRow } from '../../types/analytics'

const statusStyles = {
  Ready: 'bg-emerald-50 text-emerald-700',
  Review: 'bg-amber-50 text-amber-700',
  'No next step': 'bg-rose-50 text-rose-700',
}

export function EmployeeTable({ rows }: { rows: EmployeeAnalyticsRow[] }) {
  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="eyebrow">Employee guidance</p>
          <h2 className="mt-2 text-lg font-extrabold">Who needs attention next?</h2>
        </div>
        <button type="button" className="focus-ring flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">View all employees <ArrowUpRight className="h-3.5 w-3.5" /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/70 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
              <th className="px-6 py-3">Employee</th>
              <th className="px-4 py-3">Role / Grade</th>
              <th className="px-4 py-3">Readiness</th>
              <th className="px-4 py-3">Primary skill gap</th>
              <th className="px-4 py-3">Recommendation</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 text-sm transition-colors hover:bg-emerald-50/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-[10px] font-bold text-white">{row.initials}</div><span className="font-bold text-ink">{row.employee}</span></div>
                </td>
                <td className="px-4 py-4"><p className="font-semibold text-slate-700">{row.role}</p><p className="mt-1 text-xs text-slate-400">{row.grade}</p></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.readiness}%` }} /></div><span className="text-xs font-bold">{row.readiness}%</span></div>
                </td>
                <td className="px-4 py-4 text-xs font-semibold text-slate-600">{row.primaryGap}</td>
                <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${statusStyles[row.recommendationStatus]}`}>{row.recommendationStatus}</span></td>
                <td className="px-4 py-4"><button type="button" aria-label={`More actions for ${row.employee}`} className="text-slate-400 hover:text-ink"><MoreHorizontal className="h-5 w-5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}


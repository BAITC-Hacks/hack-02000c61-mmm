import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { ParticipationMetric, SkillGapMetric, StatusMetric } from '../../types/analytics'

const tooltipStyle = {
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: '10px',
  background: '#111923',
  color: '#dbe4e1',
  boxShadow: '0 16px 40px rgba(0,0,0,.35)',
  fontSize: '12px',
}

export function SkillGapChart({ data }: { data: SkillGapMetric[] }) {
  return (
    <article className="surface-card p-5 sm:p-6">
      <div>
        <p className="eyebrow">Organization signal</p>
        <h2 className="mt-2 text-lg font-extrabold text-white">Organization skill gaps</h2>
        <p className="mt-1 text-xs text-slate-500">Share of employees below official target requirements</p>
      </div>
      <div className="mt-6 h-[285px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 22, left: 15, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.05)" />
            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#52606d', fontSize: 10 }} unit="%" />
            <YAxis type="category" dataKey="skill" width={120} tickLine={false} axisLine={false} tick={{ fill: '#a5b2ae', fontSize: 10, fontWeight: 600 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,.025)' }} formatter={(value) => [`${value}%`, 'Employees']} />
            <Bar dataKey="percentage" fill="#34d399" radius={[0, 5, 5, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}

export function ParticipationChart({ data }: { data: ParticipationMetric[] }) {
  return (
    <article className="surface-card p-5 sm:p-6">
      <div>
        <p className="eyebrow">Engagement</p>
        <h2 className="mt-2 text-lg font-extrabold text-white">Participation by activity</h2>
        <p className="mt-1 text-xs text-slate-500">Official enrolled and completed activity counts</p>
      </div>
      <div className="mt-6 h-[285px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, left: -22, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="activity" tickLine={false} axisLine={false} tick={{ fill: '#718078', fontSize: 10 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#52606d', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,.025)' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px', color: '#718078' }} />
            <Bar dataKey="enrolled" name="Enrolled" fill="#24343a" radius={[5, 5, 0, 0]} barSize={17} />
            <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[5, 5, 0, 0]} barSize={17} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}

export function DevelopmentStatusChart({ data }: { data: StatusMetric[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <article className="surface-card p-5 sm:p-6">
      <div>
        <p className="eyebrow">Portfolio health</p>
        <h2 className="mt-2 text-lg font-extrabold text-white">Development status</h2>
        <p className="mt-1 text-xs text-slate-500">Distribution from real target-grade readiness</p>
      </div>
      <div className="relative mt-5 h-[205px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={65} outerRadius={88} paddingAngle={3} stroke="none">
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><p className="text-3xl font-extrabold tracking-[-0.05em] text-white">{total}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Employees</p></div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </article>
  )
}


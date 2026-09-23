import { CircleAlert, Compass, TrendingUp, Users } from 'lucide-react'

import type { Metric } from '../../types/analytics'

const icons = [Users, TrendingUp, Compass, CircleAlert]

const toneStyles = {
  positive: 'text-emerald-700 bg-emerald-50',
  neutral: 'text-blue-700 bg-blue-50',
  attention: 'text-amber-700 bg-amber-50',
}

export function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = icons[index % icons.length]
        return (
          <article key={metric.label} className="surface-card animate-rise p-5" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${toneStyles[metric.tone]}`}><Icon className="h-5 w-5" /></div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-5 text-xs font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-[-0.05em] text-ink">{metric.value}</p>
            <p className={`mt-3 text-[11px] font-bold ${metric.tone === 'attention' ? 'text-amber-700' : metric.tone === 'positive' ? 'text-emerald-700' : 'text-slate-400'}`}>{metric.change}</p>
          </article>
        )
      })}
    </div>
  )
}


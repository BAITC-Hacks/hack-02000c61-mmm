import { CircleAlert, Compass, TrendingUp, Users } from 'lucide-react'

import type { Metric } from '../../types/analytics'

const icons = [Users, TrendingUp, Compass, CircleAlert]

const toneStyles = {
  positive: 'text-emerald-300 bg-emerald-300/[0.08] border-emerald-300/10',
  neutral: 'text-cyan-200 bg-cyan-300/[0.07] border-cyan-300/10',
  attention: 'text-amber-200 bg-amber-300/[0.07] border-amber-300/10',
}

export function MetricCards({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = icons[index % icons.length]
        return (
          <article key={metric.label} className="surface-card animate-rise p-5" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-lg border ${toneStyles[metric.tone]}`}><Icon className="h-5 w-5" /></div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_9px_#34d399]" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">{metric.label}</p>
            <p className="mt-2 text-4xl font-extrabold tracking-[-0.055em] text-white">{metric.value}</p>
            <p className={`mt-3 text-[10px] font-semibold ${metric.tone === 'attention' ? 'text-amber-200/70' : metric.tone === 'positive' ? 'text-emerald-300/70' : 'text-slate-600'}`}>{metric.change}</p>
          </article>
        )
      })}
    </div>
  )
}


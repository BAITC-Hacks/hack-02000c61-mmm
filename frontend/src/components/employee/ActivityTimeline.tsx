import { Check, CircleDashed, X } from 'lucide-react'

import type { ActivityHistoryItem, Recommendation } from '../../types/career'
import { SectionHeader } from '../SectionHeader'

interface ActivityTimelineProps {
  history: ActivityHistoryItem[]
  completedRecommendations: Recommendation[]
}

const statusConfig = {
  completed: { icon: Check, label: 'Completed', style: 'bg-emerald-100 text-emerald-700' },
  skipped: { icon: X, label: 'Skipped', style: 'bg-rose-50 text-rose-600' },
  upcoming: { icon: CircleDashed, label: 'Upcoming', style: 'bg-amber-50 text-amber-700' },
}

export function ActivityTimeline({ history, completedRecommendations }: ActivityTimelineProps) {
  const completedItems: ActivityHistoryItem[] = completedRecommendations.map((recommendation) => ({
    id: `completed-${recommendation.id}`,
    title: recommendation.title,
    detail: 'Completed just now · Demo session',
    status: 'completed',
  }))
  const visibleHistory = [...completedItems, ...history.filter((item) => !completedRecommendations.some((recommendation) => recommendation.title === item.title))]

  return (
    <section>
      <SectionHeader eyebrow="Development activity" title="Your recent journey" description="A compact view of completed, skipped, and upcoming development moments." />
      <div className="surface-card mt-6 overflow-hidden">
        {visibleHistory.map((item, index) => {
          const config = statusConfig[item.status]
          const Icon = config.icon
          return (
            <div key={item.id} className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${index !== visibleHistory.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${config.style}`}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
              </div>
              <span className={`hidden rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] sm:inline-flex ${config.style}`}>{config.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}


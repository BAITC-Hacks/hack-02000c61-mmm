import type { EmployeeProfile, Recommendation } from '../../types/career'
import { SectionHeader } from '../SectionHeader'
import { RecommendationCard } from './RecommendationCard'

interface NextStepsSectionProps {
  employee: EmployeeProfile
  recommendations: Recommendation[]
  selectedId: string | null
  onSelect: (recommendationId: string) => void
  onComplete: (recommendation: Recommendation) => void
  busy?: boolean
}

export function NextStepsSection({ employee, recommendations, selectedId, onSelect, onComplete, busy = false }: NextStepsSectionProps) {
  return (
    <section>
      <SectionHeader
        eyebrow="Career intelligence"
        title="The clearest moves from here"
        description="Ranked from official target-grade gaps, activity impact, history, and a bounded engagement signal."
        action={<span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">Live · Official data</span>}
      />

      {recommendations.length > 0 ? (
        <div className="mt-6 grid items-start gap-5 xl:grid-cols-3">
          {recommendations.slice(0, 3).map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              rank={index + 1}
              selected={selectedId === recommendation.id}
              onSelect={() => onSelect(recommendation.id)}
              onComplete={() => onComplete(recommendation)}
              busy={busy}
            />
          ))}
        </div>
      ) : (
        <div className="surface-card mt-6 p-8 text-center">
          <p className="text-lg font-extrabold">No eligible next step</p>
          <p className="mt-2 text-sm text-slate-500">No current activity can improve an eligible target-grade gap for {employee.name}. HR can review activity coverage.</p>
        </div>
      )}
    </section>
  )
}


import type { EmployeeProfile, EmployeeProgress, Recommendation } from '../../types/career'
import { SectionHeader } from '../SectionHeader'
import { RecommendationCard } from './RecommendationCard'

interface NextStepsSectionProps {
  employee: EmployeeProfile
  progress: EmployeeProgress
  recommendations: Recommendation[]
  selectedId: string | null
  onSelect: (recommendationId: string) => void
  onComplete: (recommendation: Recommendation) => void
}

export function NextStepsSection({ employee, progress, recommendations, selectedId, onSelect, onComplete }: NextStepsSectionProps) {
  return (
    <section>
      <SectionHeader
        eyebrow="AI next steps"
        title="The clearest moves from here"
        description="These temporary recommendations demonstrate the future explainable experience. Final ranking will come from the deterministic engine after official data arrives."
        action={<span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">Mock mode</span>}
      />

      {recommendations.length > 0 ? (
        <div className="mt-6 grid items-start gap-5 xl:grid-cols-3">
          {recommendations.slice(0, 3).map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              rank={index + 1}
              currentSkillLevel={progress.skillLevels[recommendation.skillId] ?? 0}
              selected={selectedId === recommendation.id}
              onSelect={() => onSelect(recommendation.id)}
              onComplete={() => onComplete(recommendation)}
            />
          ))}
        </div>
      ) : (
        <div className="surface-card mt-6 p-8 text-center">
          <p className="text-lg font-extrabold">Demo plan complete</p>
          <p className="mt-2 text-sm text-slate-500">You completed every mock next step for {employee.name}. Switch profiles to continue the demo.</p>
        </div>
      )}
    </section>
  )
}


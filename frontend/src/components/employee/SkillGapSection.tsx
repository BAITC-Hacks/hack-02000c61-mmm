import { CheckCircle2, TrendingUp } from 'lucide-react'

import type { EmployeeProfile, EmployeeProgress } from '../../types/career'
import { SectionHeader } from '../SectionHeader'

interface SkillGapSectionProps {
  employee: EmployeeProfile
  progress: EmployeeProgress
}

const categoryColors = {
  Technical: 'bg-blue-50 text-blue-700',
  Leadership: 'bg-violet-50 text-violet-700',
  Communication: 'bg-amber-50 text-amber-700',
  Domain: 'bg-emerald-50 text-emerald-700',
}

export function SkillGapSection({ employee, progress }: SkillGapSectionProps) {
  return (
    <section>
      <SectionHeader
        eyebrow="Capability map"
        title="What is shaping your readiness"
        description={`Current levels compared with the temporary ${employee.targetGrade} target used in this demo.`}
        action={
          <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
            Scale · 1 to 5
          </span>
        }
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {employee.skills.map((skill, index) => {
          const currentLevel = progress.skillLevels[skill.id] ?? skill.currentLevel
          const gap = Math.max(0, skill.requiredLevel - currentLevel)
          const completion = Math.min(100, (currentLevel / skill.requiredLevel) * 100)

          return (
            <article key={skill.id} className="surface-card animate-rise p-5 transition-transform duration-300 hover:-translate-y-0.5" style={{ animationDelay: `${index * 55}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${categoryColors[skill.category]}`}>
                    {skill.category}
                  </span>
                  <h3 className="mt-3 text-base font-extrabold">{skill.name}</h3>
                </div>
                {gap === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600"><TrendingUp className="h-4 w-4" /> Gap {gap}</div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Current <strong className="ml-1 text-ink">{currentLevel}</strong></span>
                <span className="font-semibold text-slate-500">Required <strong className="ml-1 text-ink">{skill.requiredLevel}</strong></span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${completion}%` }} />
              </div>
              <div className="mt-3 flex gap-1.5" aria-label={`${currentLevel} of ${skill.requiredLevel} levels achieved`}>
                {Array.from({ length: 5 }, (_, level) => (
                  <span key={level} className={`h-1 flex-1 rounded-full ${level < currentLevel ? 'bg-emerald-500' : level < skill.requiredLevel ? 'bg-amber-200' : 'bg-slate-100'}`} />
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}


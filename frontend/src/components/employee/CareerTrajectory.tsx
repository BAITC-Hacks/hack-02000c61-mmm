import { Check, Flag, MapPin } from 'lucide-react'

import type { EmployeeProfile } from '../../types/career'

export function CareerTrajectory({ employee }: { employee: EmployeeProfile }) {
  const currentIndex = employee.careerPath.indexOf(employee.currentGrade)

  return (
    <div className="surface-card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Career trajectory</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Your route to {employee.targetGrade}</h2>
        </div>
        <div className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:block">
          1 grade to go
        </div>
      </div>

      <div className="mt-9 overflow-x-auto pb-2">
        <div className="flex min-w-[520px] items-start">
          {employee.careerPath.map((grade, index) => {
            const isComplete = index < currentIndex
            const isCurrent = index === currentIndex
            const isTarget = grade === employee.targetGrade

            return (
              <div key={grade} className="relative flex flex-1 flex-col items-center text-center">
                {index > 0 && (
                  <div className={`absolute right-1/2 top-4 h-0.5 w-full ${index <= currentIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                )}
                <div
                  className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border-4 border-white shadow-sm transition-colors ${
                    isCurrent
                      ? 'bg-gold text-white ring-4 ring-amber-100'
                      : isComplete
                        ? 'bg-emerald-600 text-white'
                        : isTarget
                          ? 'bg-ink text-white'
                          : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : isCurrent ? <MapPin className="h-4 w-4" /> : isTarget ? <Flag className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                </div>
                <p className={`mt-4 text-sm font-bold ${isCurrent || isTarget ? 'text-ink' : 'text-slate-400'}`}>{grade}</p>
                {isCurrent && <span className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-amber-600">You are here</span>}
                {isTarget && <span className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">Next target</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


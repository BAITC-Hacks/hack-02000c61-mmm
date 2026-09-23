import { ArrowUpRight, Target } from 'lucide-react'

import { getReadinessLabel } from '../../utils/career'

interface ReadinessCardProps {
  readiness: number
  targetGrade: string
}

export function ReadinessCard({ readiness, targetGrade }: ReadinessCardProps) {
  const degrees = readiness * 3.6

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#123b33] to-[#071f1b] p-6 text-white shadow-card sm:p-8">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[28px] border-emerald-400/10" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/60">Career readiness</p>
            <h2 className="mt-2 text-xl font-extrabold">Ready for {targetGrade}</h2>
          </div>
          <Target className="h-5 w-5 text-amber-300" />
        </div>

        <div className="my-7 flex items-center gap-6">
          <div
            className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(#63d3a7 ${degrees}deg, rgba(255,255,255,.10) 0deg)` }}
          >
            <div className="grid h-[86px] w-[86px] place-items-center rounded-full bg-[#0d2d27]">
              <span className="text-3xl font-extrabold tracking-[-0.06em]">{readiness}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-200">{getReadinessLabel(readiness)}</p>
            <p className="mt-2 text-xs leading-5 text-white/55">Complete focused next steps to close the capabilities that matter most.</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <span className="text-white/45">Mock readiness indicator</span>
          <span className="flex items-center gap-1 font-bold text-amber-300">Career GPS <ArrowUpRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </div>
  )
}


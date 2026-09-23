import { ArrowRight, Gauge, Lightbulb, TrendingUp } from 'lucide-react'

import type { Recommendation } from '../../types/career'
import { clampLevel } from '../../utils/career'

interface WhatIfPanelProps {
  recommendation: Recommendation | null
  currentReadiness: number
  currentSkillLevel: number
  onComplete: () => void
}

export function WhatIfPanel({ recommendation, currentReadiness, currentSkillLevel, onComplete }: WhatIfPanelProps) {
  if (!recommendation) return null

  const nextReadiness = Math.min(100, currentReadiness + recommendation.readinessGain)
  const nextLevel = clampLevel(currentSkillLevel + recommendation.skillGain)

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#dff3ea] via-white to-[#fff7df] shadow-card ring-1 ring-emerald-100">
      <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_1fr] lg:p-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-amber-600 shadow-sm"><Lightbulb className="h-4 w-4" /></div>
            <p className="eyebrow">Career what-if</p>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight">See the progress before you commit.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Completing <strong className="text-ink">{recommendation.title}</strong> produces this temporary demo outcome.</p>
          <button type="button" onClick={onComplete} className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-forest">
            Apply this step <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-white">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Gauge className="h-4 w-4 text-emerald-600" /> Readiness</div>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-2xl font-extrabold text-slate-400">{currentReadiness}%</span>
              <ArrowRight className="mb-1.5 h-4 w-4 text-slate-300" />
              <span className="text-3xl font-extrabold text-emerald-700">{nextReadiness}%</span>
            </div>
            <p className="mt-2 text-xs font-bold text-emerald-700">+{recommendation.readinessGain}% career impact</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-5 ring-1 ring-white">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><TrendingUp className="h-4 w-4 text-amber-600" /> {recommendation.skillName}</div>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-2xl font-extrabold text-slate-400">{currentSkillLevel}</span>
              <ArrowRight className="mb-1.5 h-4 w-4 text-slate-300" />
              <span className="text-3xl font-extrabold text-amber-600">{nextLevel}</span>
            </div>
            <p className="mt-2 text-xs font-bold text-amber-700">+{recommendation.skillGain} capability level</p>
          </div>
        </div>
      </div>
      <div className="border-t border-emerald-100 bg-white/45 px-6 py-3 text-[10px] font-semibold text-slate-500 lg:px-8">
        Demo simulation only · Official progress rules will be connected after dataset inspection.
      </div>
    </section>
  )
}


import { ArrowRight, Check, ChevronDown, Clock3, Sparkles, Target, Zap } from 'lucide-react'
import { useState } from 'react'

import type { Recommendation } from '../../types/career'

interface RecommendationCardProps {
  recommendation: Recommendation
  rank: number
  currentSkillLevel: number
  selected: boolean
  onSelect: () => void
  onComplete: () => void
}

const priorityStyles = {
  'High impact': 'bg-amber-300 text-amber-950',
  'Strong fit': 'bg-emerald-100 text-emerald-800',
  'Build momentum': 'bg-blue-100 text-blue-800',
}

export function RecommendationCard({
  recommendation,
  rank,
  currentSkillLevel,
  selected,
  onSelect,
  onComplete,
}: RecommendationCardProps) {
  const [evidenceOpen, setEvidenceOpen] = useState(rank === 1)
  const isPrimary = rank === 1

  return (
    <article
      onClick={onSelect}
      className={`group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
        selected ? 'border-emerald-500 shadow-card ring-2 ring-emerald-500/10' : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-emerald-200 hover:shadow-card'
      } ${isPrimary ? 'bg-white' : 'bg-white/80'}`}
    >
      {isPrimary && (
        <div className="flex items-center justify-between bg-[#11382f] px-5 py-3 text-white">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.17em]"><Sparkles className="h-3.5 w-3.5 text-amber-300" /> AI Recommended Next Step</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/45">Demo recommendation</span>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${isPrimary ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
              {rank}
            </div>
            <div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${priorityStyles[recommendation.priority]}`}>
                {recommendation.priority}
              </span>
              <h3 className="mt-3 text-lg font-extrabold tracking-tight text-ink">{recommendation.title}</h3>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">Career impact</p>
            <p className="mt-0.5 text-lg font-extrabold text-emerald-700">+{recommendation.readinessGain}%</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-500">{recommendation.description}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500"><Target className="h-4 w-4 text-emerald-600" /><span><strong className="text-ink">{recommendation.skillName}</strong><br />{currentSkillLevel} → {currentSkillLevel + recommendation.skillGain}</span></div>
          <div className="flex items-center gap-2 text-slate-500"><Clock3 className="h-4 w-4 text-emerald-600" /><span><strong className="text-ink">{recommendation.duration}</strong><br />{recommendation.format}</span></div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setEvidenceOpen((open) => !open)
          }}
          className="focus-ring mt-5 flex w-full items-center justify-between rounded-xl py-1 text-left text-xs font-bold text-ink"
          aria-expanded={evidenceOpen}
        >
          <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Why this?</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${evidenceOpen ? 'rotate-180' : ''}`} />
        </button>

        {evidenceOpen && (
          <ul className="mt-3 space-y-2 border-l-2 border-emerald-100 pl-4">
            {recommendation.evidence.map((reason) => (
              <li key={reason} className="flex gap-2 text-xs leading-5 text-slate-500">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {reason}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onComplete()
          }}
          className={`focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
            isPrimary ? 'bg-ink text-white hover:bg-forest' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          Complete activity <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}


import { CheckCircle2, LoaderCircle, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ActivityTimeline } from '../components/employee/ActivityTimeline'
import { CareerTrajectory } from '../components/employee/CareerTrajectory'
import { EmployeeHero, EmployeeIdentity } from '../components/employee/EmployeeHero'
import { NextStepsSection } from '../components/employee/NextStepsSection'
import { ReadinessCard } from '../components/employee/ReadinessCard'
import { SkillGapSection } from '../components/employee/SkillGapSection'
import { WhatIfPanel } from '../components/employee/WhatIfPanel'
import { completeActivity, getEmployeeBundle, getEmployees, type EmployeeBundle } from '../services/api'
import type { EmployeeProfile, EmployeeSummary, Recommendation } from '../types/career'

function categoryFor(skillId: string, skillType: string): 'Technical' | 'Leadership' | 'Communication' | 'Domain' {
  if (skillId.includes('LEADERSHIP') || skillId.includes('MENTOR') || skillId.includes('FEEDBACK')) return 'Leadership'
  if (skillId.includes('COMMUNICATION') || skillId.includes('SPEAKING')) return 'Communication'
  return skillType === 'hard' ? 'Technical' : 'Domain'
}

function profileFromBundle(bundle: EmployeeBundle): EmployeeProfile {
  const { employee, career } = bundle
  const recommendations: Recommendation[] = bundle.recommendations.map((item) => {
    const primary = item.affected_relevant_skills[0]
    return {
      id: item.event_id,
      title: item.activity_name,
      skillId: primary?.skill_id ?? '',
      skillName: primary?.skill_name ?? 'Target skills',
      priority: item.rank === 1 ? 'High impact' : item.rank === 2 ? 'Strong fit' : 'Build momentum',
      description: item.description,
      duration: `${item.duration_hours} hours`,
      format: item.format.replace('_', ' '),
      type: item.type,
      skillGain: primary?.gain_applied ?? 0,
      readinessGain: item.readiness_delta,
      readinessBefore: item.readiness_before,
      readinessAfter: item.readiness_after,
      careerScore: item.career_score,
      finalScore: item.final_score,
      engagementProbability: item.engagement_probability,
      evidence: item.evidence,
      affectedSkills: item.affected_relevant_skills,
      skillChanges: item.simulation.skill_changes,
      prerequisitesSatisfied: item.prerequisites_status.satisfied,
      criticalSkills: item.critical_skill_relevance.skills,
      comparison: item.comparison?.summary,
    }
  })
  const history = bundle.history.slice(0, 10).map((item) => ({
    id: item.record_id,
    title: item.activity_name,
    detail: `${item.status.replace('_', ' ')} · ${item.date} · ${item.assigned_by}`,
    status: item.status === 'completed' ? 'completed' as const : item.status === 'in_progress' ? 'upcoming' as const : 'skipped' as const,
  }))
  const initials = employee.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('')
  const years = Math.floor(employee.tenure_months / 12)
  const months = employee.tenure_months % 12
  return {
    id: employee.employee_id,
    name: employee.full_name,
    initials,
    role: employee.role,
    targetRole: career.target_role,
    currentGrade: employee.grade,
    targetGrade: career.target_grade,
    tenure: `${years ? `${years}y ` : ''}${months}m`,
    location: `${employee.department} · ${employee.work_format}`,
    readiness: career.readiness_percentage,
    satisfiedRequirements: career.satisfied_requirements,
    totalRequirements: career.total_requirements,
    criticalGapCount: career.critical_gaps.length,
    careerPath: employee.career_path,
    skills: career.requirements.map((skill) => ({
      id: skill.skill_id,
      name: skill.skill_name,
      currentLevel: skill.current_level,
      requiredLevel: skill.required_level,
      gap: skill.gap,
      critical: skill.critical,
      category: categoryFor(skill.skill_id, skill.skill_type),
    })),
    recommendations,
    history,
  }
}

export function EmployeeDashboard() {
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [bundle, setBundle] = useState<EmployeeBundle | null>(null)
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null)
  const [completionMessage, setCompletionMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getEmployees().then((items) => {
      setEmployees(items)
      setSelectedEmployeeId(items[0]?.employee_id ?? '')
    }).catch((reason: Error) => setError(reason.message))
  }, [])

  useEffect(() => {
    if (!selectedEmployeeId) return
    let active = true
    setBusy(true)
    setError(null)
    getEmployeeBundle(selectedEmployeeId).then((nextBundle) => {
      if (!active) return
      setBundle(nextBundle)
      setSelectedRecommendationId(nextBundle.recommendations[0]?.event_id ?? null)
    }).catch((reason: Error) => active && setError(reason.message)).finally(() => active && setBusy(false))
    return () => { active = false }
  }, [selectedEmployeeId])

  if (error && !bundle) {
    return <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center"><TriangleAlert className="mx-auto h-7 w-7 text-rose-500" /><h1 className="mt-4 text-xl font-extrabold">Career intelligence is unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div>
  }
  if (!bundle) {
    return <div className="grid min-h-[70vh] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" /></div>
  }

  const employee = profileFromBundle(bundle)
  const selectedRecommendation = employee.recommendations.find((item) => item.id === selectedRecommendationId) ?? employee.recommendations[0] ?? null

  async function completeRecommendation(recommendation: Recommendation) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await completeActivity(employee.id, recommendation.id)
      const nextBundle = { ...bundle!, career: response.career, recommendations: response.recommendations, history: response.history }
      setBundle(nextBundle)
      setSelectedRecommendationId(response.recommendations[0]?.event_id ?? null)
      setCompletionMessage(`${recommendation.title} completed. Your real Career GPS has recalculated.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to complete activity')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <EmployeeHero employee={employee} employees={employees} onEmployeeChange={(id) => { setSelectedEmployeeId(id); setCompletionMessage(null) }} />
      <div className="mt-8"><EmployeeIdentity employee={employee} /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_0.9fr]">
        <CareerTrajectory employee={employee} />
        <ReadinessCard readiness={employee.readiness} targetGrade={employee.targetGrade} satisfied={employee.satisfiedRequirements} total={employee.totalRequirements} criticalGaps={employee.criticalGapCount} />
      </div>
      <div className="mt-14"><SkillGapSection employee={employee} /></div>
      <div className="mt-14">
        <NextStepsSection employee={employee} recommendations={employee.recommendations} selectedId={selectedRecommendation?.id ?? null} onSelect={setSelectedRecommendationId} onComplete={completeRecommendation} busy={busy} />
      </div>
      {selectedRecommendation && <div className="mt-8"><WhatIfPanel recommendation={selectedRecommendation} onComplete={() => completeRecommendation(selectedRecommendation)} /></div>}
      <div className="mt-14 pb-10"><ActivityTimeline history={employee.history} /></div>
      {error && <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-bold text-white shadow-xl">{error}</div>}
      {completionMessage && (
        <div className="fixed bottom-5 right-5 z-40 flex max-w-sm items-start gap-3 rounded-2xl bg-ink p-4 text-white shadow-2xl" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><div><p className="text-sm font-bold">Progress updated</p><p className="mt-1 text-xs leading-5 text-white/65">{completionMessage}</p></div>
          <button type="button" aria-label="Dismiss message" onClick={() => setCompletionMessage(null)} className="ml-2 text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  )
}

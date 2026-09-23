import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import {
  CareerJourney,
  ImpactPreview,
  PremiumEmployeeHero,
  PremiumTimeline,
  QuestCompleted,
  RecommendationDeck,
  SkillMatrix,
} from '../components/employee/PremiumExperience'
import type { ShellOutletContext } from '../layouts/PremiumAppShell'
import { completeActivity, getEmployeeBundle, getEmployees, simulateActivity, type EmployeeBundle } from '../services/api'
import type { EmployeeProfile, EmployeeSummary, Recommendation, SimulationResponse } from '../types/career'

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
      id: skill.skill_id, name: skill.skill_name, currentLevel: skill.current_level,
      requiredLevel: skill.required_level, gap: skill.gap, critical: skill.critical,
      category: categoryFor(skill.skill_id, skill.skill_type),
    })),
    recommendations,
    history,
  }
}

export function EmployeeDashboard() {
  const { setProfile } = useOutletContext<ShellOutletContext>()
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [bundle, setBundle] = useState<EmployeeBundle | null>(null)
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null)
  const [previewRecommendation, setPreviewRecommendation] = useState<Recommendation | null>(null)
  const [preview, setPreview] = useState<SimulationResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [completed, setCompleted] = useState<{ title: string; simulation: SimulationResponse } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const employee = bundle ? profileFromBundle(bundle) : null

  useEffect(() => {
    getEmployees().then((items) => { setEmployees(items); setSelectedEmployeeId(items[0]?.employee_id ?? '') }).catch((reason: Error) => setError(reason.message))
  }, [])

  useEffect(() => {
    if (!selectedEmployeeId) return
    let active = true
    setBusy(true); setError(null); setPreview(null); setPreviewRecommendation(null); setCompleted(null)
    getEmployeeBundle(selectedEmployeeId).then((nextBundle) => {
      if (!active) return
      setBundle(nextBundle); setSelectedRecommendationId(nextBundle.recommendations[0]?.event_id ?? null)
    }).catch((reason: Error) => active && setError(reason.message)).finally(() => active && setBusy(false))
    return () => { active = false }
  }, [selectedEmployeeId])

  useEffect(() => {
    if (employee) setProfile({ name: employee.name, initials: employee.initials, role: `${employee.role} · ${employee.currentGrade}` })
  }, [employee?.id, employee?.readiness, setProfile])

  async function previewImpact(recommendation: Recommendation) {
    if (!employee) return
    setSelectedRecommendationId(recommendation.id); setPreviewRecommendation(recommendation); setPreview(null); setPreviewLoading(true); setError(null)
    requestAnimationFrame(() => document.getElementById('impact-preview')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    try { setPreview(await simulateActivity(employee.id, recommendation.id)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to simulate activity') }
    finally { setPreviewLoading(false) }
  }

  async function completeRecommendation(recommendation: Recommendation) {
    if (!employee || busy) return
    setBusy(true); setError(null)
    try {
      const response = await completeActivity(employee.id, recommendation.id)
      setBundle({ ...bundle!, career: response.career, recommendations: response.recommendations, history: response.history })
      setSelectedRecommendationId(response.recommendations[0]?.event_id ?? null)
      setCompleted({ title: recommendation.title, simulation: response.simulation })
      setPreview(null); setPreviewRecommendation(null)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to complete activity') }
    finally { setBusy(false) }
  }

  if (error && !bundle) return <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-rose-300/15 bg-rose-300/[0.04] p-8 text-center"><TriangleAlert className="mx-auto h-7 w-7 text-rose-300" /><h1 className="mt-4 text-xl font-extrabold">Career intelligence is unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div>
  if (!employee) return <div className="grid min-h-[70vh] place-items-center"><LoaderCircle className="h-8 w-8 animate-spin text-emerald-300" /></div>

  return <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-10 lg:py-10">
    <PremiumEmployeeHero employee={employee} employees={employees} onEmployeeChange={setSelectedEmployeeId} />
    <div className="mt-16"><CareerJourney employee={employee} /></div>
    <div className="mt-16"><RecommendationDeck employee={employee} selectedId={selectedRecommendationId} onSelect={setSelectedRecommendationId} onPreview={previewImpact} onComplete={completeRecommendation} busy={busy} /></div>
    {previewRecommendation && <div id="impact-preview" className="mt-7 scroll-mt-24"><ImpactPreview recommendation={previewRecommendation} simulation={preview} loading={previewLoading} onClose={() => { setPreviewRecommendation(null); setPreview(null) }} onComplete={() => completeRecommendation(previewRecommendation)} /></div>}
    <div className="mt-16"><SkillMatrix employee={employee} /></div>
    <div className="mt-16 pb-12"><PremiumTimeline history={employee.history} /></div>
    {error && <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-rose-300/20 bg-[#231216] px-4 py-3 text-sm font-bold text-rose-200 shadow-2xl">{error}</div>}
    {completed && <QuestCompleted title={completed.title} simulation={completed.simulation} onClose={() => setCompleted(null)} />}
  </div>
}

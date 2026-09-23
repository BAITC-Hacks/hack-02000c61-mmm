export type RecommendationPriority = 'High impact' | 'Strong fit' | 'Build momentum'
export type HistoryStatus = 'completed' | 'skipped' | 'upcoming'

export interface SkillProfile {
  id: string
  name: string
  currentLevel: number
  requiredLevel: number
  category: 'Technical' | 'Leadership' | 'Communication' | 'Domain'
  critical: boolean
  gap: number
}

export interface SkillChange {
  skill_id: string
  skill_name: string
  before: number
  after: number
  gain_applied: number
  configured_gain: number
  max_level: number
}

export interface AffectedSkill {
  skill_id: string
  skill_name: string
  current_level: number
  required_level: number
  gap: number
  projected_level: number
  gain_applied: number
  critical: boolean
}

export interface Recommendation {
  id: string
  title: string
  skillId: string
  skillName: string
  priority: RecommendationPriority
  description: string
  duration: string
  format: string
  type: string
  skillGain: number
  readinessGain: number
  readinessBefore: number
  readinessAfter: number
  careerScore: number
  finalScore: number
  engagementProbability: number | null
  evidence: string[]
  affectedSkills: AffectedSkill[]
  skillChanges: SkillChange[]
  prerequisitesSatisfied: boolean
  criticalSkills: string[]
  comparison?: string
}

export interface ActivityHistoryItem {
  id: string
  title: string
  detail: string
  status: HistoryStatus
}

export interface EmployeeProfile {
  id: string
  name: string
  initials: string
  role: string
  targetRole: string
  currentGrade: string
  targetGrade: string
  tenure: string
  location: string
  readiness: number
  satisfiedRequirements: number
  totalRequirements: number
  criticalGapCount: number
  careerPath: string[]
  skills: SkillProfile[]
  recommendations: Recommendation[]
  history: ActivityHistoryItem[]
}

export interface EmployeeSummary {
  employee_id: string
  full_name: string
  department: string
  role: string
  grade: string
  target_role: string
  target_grade: string
  readiness_percentage: number
}

export interface CareerRequirement {
  skill_id: string
  skill_name: string
  skill_type: 'hard' | 'soft'
  category: string
  current_level: number
  required_level: number
  gap: number
  satisfied: boolean
  critical: boolean
}

export interface CareerResponse {
  current_role: string
  current_grade: string
  target_role: string
  target_grade: string
  readiness_percentage: number
  satisfied_requirements: number
  total_requirements: number
  critical_gaps: CareerRequirement[]
  requirements: CareerRequirement[]
}

export interface EmployeeDetailResponse {
  employee_id: string
  full_name: string
  department: string
  role: string
  grade: string
  tenure_months: number
  work_format: string
  career_path: string[]
}

export interface RecommendationApi {
  event_id: string
  activity_name: string
  description: string
  type: string
  format: string
  duration_hours: number
  rank: number
  affected_relevant_skills: AffectedSkill[]
  career_score: number
  engagement_probability: number | null
  final_score: number
  readiness_before: number
  readiness_after: number
  readiness_delta: number
  evidence: string[]
  prerequisites_status: { satisfied: boolean }
  critical_skill_relevance: { relevant: boolean; skills: string[] }
  comparison?: { summary: string }
  simulation: { skill_changes: SkillChange[] }
}

export interface HistoryApi {
  record_id: string
  activity_name: string
  date: string
  status: string
  completion_pct: string
  assigned_by: string
}

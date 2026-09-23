export type RecommendationPriority = 'High impact' | 'Strong fit' | 'Build momentum'
export type HistoryStatus = 'completed' | 'skipped' | 'upcoming'

export interface SkillProfile {
  id: string
  name: string
  currentLevel: number
  requiredLevel: number
  category: 'Technical' | 'Leadership' | 'Communication' | 'Domain'
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
  skillGain: number
  readinessGain: number
  evidence: string[]
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
  currentGrade: string
  targetGrade: string
  tenure: string
  location: string
  readiness: number
  careerPath: string[]
  skills: SkillProfile[]
  recommendations: Recommendation[]
  history: ActivityHistoryItem[]
}

export interface EmployeeProgress {
  readiness: number
  skillLevels: Record<string, number>
  completedRecommendationIds: string[]
}


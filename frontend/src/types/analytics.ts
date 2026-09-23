export interface Metric {
  label: string
  value: string
  change: string
  tone: 'positive' | 'neutral' | 'attention'
}

export interface SkillGapMetric {
  skill: string
  percentage: number
  employees: number
}

export interface ParticipationMetric {
  activity: string
  completed: number
  enrolled: number
}

export interface StatusMetric {
  name: string
  value: number
  color: string
}

export interface EmployeeAnalyticsRow {
  id: string
  employee: string
  initials: string
  role: string
  grade: string
  readiness: number
  primaryGap: string
  recommendationStatus: 'Ready' | 'Review' | 'No next step'
}

export interface GuidanceSummary {
  value: string
  label: string
}


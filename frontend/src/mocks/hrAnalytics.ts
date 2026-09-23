import type {
  EmployeeAnalyticsRow,
  GuidanceSummary,
  Metric,
  ParticipationMetric,
  SkillGapMetric,
  StatusMetric,
} from '../types/analytics'

// Demo-only organizational aggregates. Replace after official data integration.
export const mockHrMetrics: Metric[] = [
  { label: 'Employees', value: '248', change: '+12 this quarter', tone: 'neutral' },
  { label: 'Participation rate', value: '74%', change: '+6.2% vs last month', tone: 'positive' },
  { label: 'Needing guidance', value: '38', change: '15% of workforce', tone: 'attention' },
  { label: 'Without next step', value: '7', change: 'Requires HR review', tone: 'attention' },
]

export const mockSkillGaps: SkillGapMetric[] = [
  { skill: 'System Design', percentage: 37, employees: 92 },
  { skill: 'Leadership', percentage: 29, employees: 72 },
  { skill: 'Communication', percentage: 24, employees: 60 },
  { skill: 'Cloud Architecture', percentage: 18, employees: 45 },
  { skill: 'Data Storytelling', percentage: 14, employees: 35 },
]

export const mockParticipation: ParticipationMetric[] = [
  { activity: 'Technical labs', completed: 76, enrolled: 94 },
  { activity: 'Mentoring', completed: 58, enrolled: 81 },
  { activity: 'Workshops', completed: 68, enrolled: 103 },
  { activity: 'Shadowing', completed: 34, enrolled: 52 },
]

export const mockDevelopmentStatus: StatusMetric[] = [
  { name: 'On track', value: 126, color: '#178a69' },
  { name: 'Needs guidance', value: 71, color: '#d2a947' },
  { name: 'At risk', value: 32, color: '#dd6b55' },
  { name: 'No next step', value: 19, color: '#a7b4af' },
]

export const mockEmployeeAnalytics: EmployeeAnalyticsRow[] = [
  { id: 'hr-1', employee: 'Aigerim Sadykova', initials: 'AS', role: 'Software Engineer', grade: 'Middle', readiness: 68, primaryGap: 'System Design', recommendationStatus: 'Ready' },
  { id: 'hr-2', employee: 'Daniyar Akhmetov', initials: 'DA', role: 'Risk Analyst', grade: 'Specialist', readiness: 54, primaryGap: 'Data Storytelling', recommendationStatus: 'Ready' },
  { id: 'hr-3', employee: 'Madina Tulegenova', initials: 'MT', role: 'Product Manager', grade: 'Senior', readiness: 76, primaryGap: 'Coaching', recommendationStatus: 'Ready' },
  { id: 'hr-4', employee: 'Timur Iskakov', initials: 'TI', role: 'Data Engineer', grade: 'Middle', readiness: 43, primaryGap: 'Cloud Architecture', recommendationStatus: 'Review' },
  { id: 'hr-5', employee: 'Aliya Nurgali', initials: 'AN', role: 'Branch Manager', grade: 'Senior', readiness: 61, primaryGap: 'Leadership', recommendationStatus: 'No next step' },
]

export const mockGuidanceSummary: GuidanceSummary[] = [
  { value: '92', label: 'System Design gaps' },
  { value: '38', label: 'Need guidance' },
  { value: '7', label: 'Without next step' },
]


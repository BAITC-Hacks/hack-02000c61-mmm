import type { EmployeeProfile, EmployeeProgress } from '../types/career'

export function createInitialProgress(employee: EmployeeProfile): EmployeeProgress {
  return {
    readiness: employee.readiness,
    skillLevels: Object.fromEntries(
      employee.skills.map((skill) => [skill.id, skill.currentLevel]),
    ),
    completedRecommendationIds: [],
  }
}

export function getReadinessLabel(readiness: number): string {
  if (readiness >= 80) return 'Nearly ready'
  if (readiness >= 60) return 'Building readiness'
  return 'Foundation in progress'
}

export function clampLevel(value: number, maximum = 5): number {
  return Math.min(maximum, Math.max(0, value))
}


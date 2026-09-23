import { CheckCircle2, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ActivityTimeline } from '../components/employee/ActivityTimeline'
import { CareerTrajectory } from '../components/employee/CareerTrajectory'
import { EmployeeHero, EmployeeIdentity } from '../components/employee/EmployeeHero'
import { NextStepsSection } from '../components/employee/NextStepsSection'
import { ReadinessCard } from '../components/employee/ReadinessCard'
import { SkillGapSection } from '../components/employee/SkillGapSection'
import { WhatIfPanel } from '../components/employee/WhatIfPanel'
import { mockEmployees } from '../mocks/employees'
import type { EmployeeProgress, Recommendation } from '../types/career'
import { clampLevel, createInitialProgress } from '../utils/career'

function initializeProgress(): Record<string, EmployeeProgress> {
  return Object.fromEntries(
    mockEmployees.map((employee) => [employee.id, createInitialProgress(employee)]),
  )
}

export function EmployeeDashboard() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(mockEmployees[0].id)
  const [progressByEmployee, setProgressByEmployee] = useState<Record<string, EmployeeProgress>>(initializeProgress)
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(mockEmployees[0].recommendations[0]?.id ?? null)
  const [completionMessage, setCompletionMessage] = useState<string | null>(null)

  const employee = mockEmployees.find((profile) => profile.id === selectedEmployeeId) ?? mockEmployees[0]
  const progress = progressByEmployee[employee.id]
  const availableRecommendations = employee.recommendations.filter(
    (recommendation) => !progress.completedRecommendationIds.includes(recommendation.id),
  )
  const selectedRecommendation = availableRecommendations.find(
    (recommendation) => recommendation.id === selectedRecommendationId,
  ) ?? availableRecommendations[0] ?? null

  const completedRecommendations = useMemo(
    () => employee.recommendations.filter((recommendation) => progress.completedRecommendationIds.includes(recommendation.id)),
    [employee.recommendations, progress.completedRecommendationIds],
  )

  function handleEmployeeChange(employeeId: string) {
    const nextEmployee = mockEmployees.find((profile) => profile.id === employeeId) ?? mockEmployees[0]
    const nextProgress = progressByEmployee[nextEmployee.id]
    const nextRecommendation = nextEmployee.recommendations.find(
      (recommendation) => !nextProgress.completedRecommendationIds.includes(recommendation.id),
    )

    setSelectedEmployeeId(nextEmployee.id)
    setSelectedRecommendationId(nextRecommendation?.id ?? null)
    setCompletionMessage(null)
  }

  function completeRecommendation(recommendation: Recommendation) {
    if (progress.completedRecommendationIds.includes(recommendation.id)) return

    setProgressByEmployee((current) => {
      const currentProgress = current[employee.id]
      const currentSkillLevel = currentProgress.skillLevels[recommendation.skillId] ?? 0
      return {
        ...current,
        [employee.id]: {
          readiness: Math.min(100, currentProgress.readiness + recommendation.readinessGain),
          skillLevels: {
            ...currentProgress.skillLevels,
            [recommendation.skillId]: clampLevel(currentSkillLevel + recommendation.skillGain),
          },
          completedRecommendationIds: [...currentProgress.completedRecommendationIds, recommendation.id],
        },
      }
    })

    const nextRecommendation = availableRecommendations.find((item) => item.id !== recommendation.id)
    setSelectedRecommendationId(nextRecommendation?.id ?? null)
    setCompletionMessage(`${recommendation.title} completed. Your Career GPS has recalculated.`)
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-10 lg:py-10">
      <EmployeeHero employee={employee} employees={mockEmployees} onEmployeeChange={handleEmployeeChange} />

      <div className="mt-8">
        <EmployeeIdentity employee={employee} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_0.9fr]">
        <CareerTrajectory employee={employee} />
        <ReadinessCard readiness={progress.readiness} targetGrade={employee.targetGrade} />
      </div>

      <div className="mt-14">
        <SkillGapSection employee={employee} progress={progress} />
      </div>

      <div className="mt-14">
        <NextStepsSection
          employee={employee}
          progress={progress}
          recommendations={availableRecommendations}
          selectedId={selectedRecommendation?.id ?? null}
          onSelect={setSelectedRecommendationId}
          onComplete={completeRecommendation}
        />
      </div>

      {selectedRecommendation && (
        <div className="mt-8">
          <WhatIfPanel
            recommendation={selectedRecommendation}
            currentReadiness={progress.readiness}
            currentSkillLevel={progress.skillLevels[selectedRecommendation.skillId] ?? 0}
            onComplete={() => completeRecommendation(selectedRecommendation)}
          />
        </div>
      )}

      <div className="mt-14 pb-10">
        <ActivityTimeline history={employee.history} completedRecommendations={completedRecommendations} />
      </div>

      {completionMessage && (
        <div className="fixed bottom-5 right-5 z-40 flex max-w-sm items-start gap-3 rounded-2xl bg-ink p-4 text-white shadow-2xl" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <div>
            <p className="text-sm font-bold">Progress updated</p>
            <p className="mt-1 text-xs leading-5 text-white/65">{completionMessage}</p>
          </div>
          <button type="button" aria-label="Dismiss message" onClick={() => setCompletionMessage(null)} className="ml-2 text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}


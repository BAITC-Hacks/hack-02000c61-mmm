import type {
  CareerResponse,
  EmployeeDetailResponse,
  EmployeeSummary,
  HistoryApi,
  RecommendationApi,
  SimulationResponse,
} from '../types/career'

const API_ROOT = import.meta.env.VITE_API_ROOT ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null
    throw new Error(body?.detail ?? `Career Quest API returned ${response.status}`)
  }
  return response.json() as Promise<T>
}

export interface EmployeeBundle {
  employee: EmployeeDetailResponse
  career: CareerResponse
  recommendations: RecommendationApi[]
  history: HistoryApi[]
}

export async function getEmployees(): Promise<EmployeeSummary[]> {
  return request('/employees')
}

export async function getEmployeeBundle(employeeId: string): Promise<EmployeeBundle> {
  const [employee, career, recommendationResponse, history] = await Promise.all([
    request<EmployeeDetailResponse>(`/employees/${employeeId}`),
    request<CareerResponse>(`/employees/${employeeId}/career`),
    request<{ recommendations: RecommendationApi[] }>(`/employees/${employeeId}/recommendations`),
    request<HistoryApi[]>(`/employees/${employeeId}/history`),
  ])
  return { employee, career, recommendations: recommendationResponse.recommendations, history }
}

export interface CompletionResponse {
  completed_event_id: string
  simulation: SimulationResponse
  career: CareerResponse
  recommendations: RecommendationApi[]
  history: HistoryApi[]
}

export async function simulateActivity(employeeId: string, eventId: string): Promise<SimulationResponse> {
  return request(`/employees/${employeeId}/simulate/${eventId}`, { method: 'POST' })
}

export async function completeActivity(employeeId: string, eventId: string): Promise<CompletionResponse> {
  return request(`/employees/${employeeId}/complete/${eventId}`, { method: 'POST' })
}

export async function getHrAnalytics<T>(): Promise<T> {
  return request('/hr/analytics')
}

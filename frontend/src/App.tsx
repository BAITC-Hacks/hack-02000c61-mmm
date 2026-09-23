import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from './layouts/AppShell'

const EmployeeDashboard = lazy(async () => {
  const module = await import('./pages/EmployeeDashboard')
  return { default: module.EmployeeDashboard }
})

const HrDashboard = lazy(async () => {
  const module = await import('./pages/HrDashboard')
  return { default: module.HrDashboard }
})

function PageLoader() {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Loading Career GPS</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/employee" element={<Suspense fallback={<PageLoader />}><EmployeeDashboard /></Suspense>} />
        <Route path="/hr" element={<Suspense fallback={<PageLoader />}><HrDashboard /></Suspense>} />
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Route>
    </Routes>
  )
}


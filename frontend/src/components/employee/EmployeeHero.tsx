import { ChevronDown, MapPin } from 'lucide-react'

import type { EmployeeProfile } from '../../types/career'

interface EmployeeHeroProps {
  employee: EmployeeProfile
  employees: EmployeeProfile[]
  onEmployeeChange: (employeeId: string) => void
}

export function EmployeeHero({ employee, employees, onEmployeeChange }: EmployeeHeroProps) {
  return (
    <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
      <div className="animate-rise">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-px w-7 bg-emerald-500" />
          <p className="eyebrow">Career command center</p>
        </div>
        <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
          Good morning, {employee.name.split(' ')[0]}.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          You are building momentum toward <span className="font-semibold text-ink">{employee.targetGrade}</span>. Here is the clearest path forward.
        </p>
      </div>

      <div className="relative w-full animate-rise xl:w-[330px]" style={{ animationDelay: '80ms' }}>
        <label htmlFor="employee-switcher" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Demo profile
        </label>
        <select
          id="employee-switcher"
          value={employee.id}
          onChange={(event) => onEmployeeChange(event.target.value)}
          className="focus-ring w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3.5 pl-14 pr-10 text-sm font-semibold text-ink shadow-sm"
        >
          {employees.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} · {option.role}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute bottom-2.5 left-3 grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800">
          {employee.initials}
        </div>
        <ChevronDown className="pointer-events-none absolute bottom-[18px] right-4 h-4 w-4 text-slate-400" />
      </div>

      <div className="sr-only" aria-live="polite">
        Viewing {employee.name}, {employee.role}
      </div>
    </div>
  )
}

export function EmployeeIdentity({ employee }: { employee: EmployeeProfile }) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-[#0f332c] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-base font-bold ring-1 ring-white/15">
          {employee.initials}
        </div>
        <div>
          <h2 className="text-lg font-bold">{employee.name}</h2>
          <p className="mt-1 text-sm text-white/60">{employee.role} · {employee.currentGrade}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">Tenure</p>
          <p className="mt-1 font-semibold text-white/85">{employee.tenure}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/35">Team</p>
          <p className="mt-1 flex items-center gap-1.5 font-semibold text-white/85">
            <MapPin className="h-3.5 w-3.5" /> {employee.location}
          </p>
        </div>
      </div>
    </div>
  )
}


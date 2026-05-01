import { motion } from 'framer-motion';
import {
  Mail, Phone, MapPin, Briefcase, Building2, BadgeCheck, Calendar, CircleUser,
  Star, CalendarDays,
} from 'lucide-react';
import type { Employee } from '../lib/api';

interface Props {
  employee: Employee;
}

export function EmployeeCard({ employee }: Props) {
  const initials =
    ((employee.FirstName?.[0] ?? '') + (employee.LastName?.[0] ?? '')).toUpperCase() || 'EM';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl p-5 sm:p-7 shadow-glow"
    >
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
        {/* Avatar */}
        <div className="flex sm:flex-col items-center sm:items-start gap-4 sm:gap-3">
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-rose-500 grid place-items-center text-white text-2xl sm:text-3xl font-bold shadow-glow-lg">
              {initials}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                employee.Status === 'Active'
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-amber-500/90 text-white'
              }`}
            >
              {employee.Status}
            </span>
          </div>
          <div className="sm:hidden flex flex-col">
            <h2 className="text-xl font-bold text-slate-50">{employee.FullName}</h2>
            <p className="text-sm text-slate-400">{employee.Designation} · {employee.Department}</p>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="hidden sm:flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
            <h2 className="text-2xl font-bold text-slate-50 truncate">{employee.FullName}</h2>
            <span className="text-sm text-slate-400">{employee.EmpID}</span>
          </div>
          <p className="hidden sm:block text-slate-300 mb-4">
            {employee.Designation} · {employee.Department}
            {employee.DepartmentCode ? <span className="text-slate-500"> ({employee.DepartmentCode})</span> : null}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <Info icon={Mail} label="Email" value={employee.Email} />
            <Info icon={Phone} label="Phone" value={employee.Phone} />
            <Info icon={Briefcase} label="Designation" value={employee.Designation} />
            <Info icon={Building2} label="Department" value={`${employee.Department}`} />
            <Info icon={MapPin} label="Location" value={employee.Location} />
            <Info icon={CircleUser} label="Manager" value={employee.Manager} />
            <Info icon={Calendar} label="Joined" value={employee.DateOfJoining} />
            <Info icon={BadgeCheck} label="Type" value={employee.EmploymentType} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat
              icon={Star}
              label="Rating"
              value={`${employee.PerformanceRating} / 5`}
              accent="from-amber-400/20 to-amber-600/10 text-amber-300"
            />
            <Stat
              icon={CalendarDays}
              label="Leave"
              value={`${employee.LeaveBalance}d`}
              accent="from-emerald-400/20 to-emerald-600/10 text-emerald-300"
            />
            <Stat
              icon={Briefcase}
              label="Salary"
              value={formatCurrency(employee.AnnualSalary)}
              accent="from-indigo-400/20 to-indigo-600/10 text-indigo-300"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Info({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-sm text-slate-200 truncate">{value || '—'}</div>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon, label, value, accent,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 bg-gradient-to-br ${accent} border border-white/5`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-80">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function formatCurrency(n: number): string {
  return n?.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }) ?? '—';
}

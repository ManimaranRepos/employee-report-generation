import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import type { Employee } from '../lib/api';

interface Props {
  employees: Employee[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (emp: Employee) => void;
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function PaginationBar({
  page, pages, total, onPageChange,
}: { page: number; pages: number; total: number; onPageChange: (p: number) => void }) {
  const from = total === 0 ? 0 : (page - 1) * 10 + 1;
  const to = Math.min(page * 10, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-xs text-slate-400">
      <span>{total > 0 ? `${from}–${to} of ${total.toLocaleString()}` : 'No results'}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {getPageNumbers(page, pages).map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-slate-600">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[26px] h-[26px] rounded-lg text-[11px] font-medium transition-colors ${
                p === page
                  ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/40'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function EmployeeTable({
  employees, loading, selectedId, onSelect, page, pages, total, onPageChange,
}: Props) {
  return (
    <div className="glass rounded-2xl overflow-hidden shadow-glow">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Name</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Emp ID</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium hidden md:table-cell">Department</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium hidden lg:table-cell">Designation</th>
              <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide text-slate-500 font-medium">Status</th>
              <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wide text-slate-500 font-medium hidden sm:table-cell">Salary</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3.5"><div className="h-3 w-32 rounded shimmer" /></td>
                  <td className="px-4 py-3.5"><div className="h-3 w-20 rounded shimmer" /></td>
                  <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-3 w-24 rounded shimmer" /></td>
                  <td className="px-4 py-3.5 hidden lg:table-cell"><div className="h-3 w-28 rounded shimmer" /></td>
                  <td className="px-4 py-3.5"><div className="h-3 w-12 rounded shimmer" /></td>
                  <td className="px-4 py-3.5 hidden sm:table-cell"><div className="h-3 w-16 rounded shimmer ml-auto" /></td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2.5 text-slate-600" />
                  <p className="text-slate-500 text-sm">No employees found</p>
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const selected = selectedId === emp.EmpID;
                return (
                  <motion.tr
                    key={emp.EmpID}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => onSelect(emp)}
                    className={`border-b border-white/5 last:border-0 cursor-pointer transition-colors ${
                      selected ? 'bg-indigo-500/15' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className={`px-4 py-3 font-medium text-slate-100 ${selected ? 'shadow-[inset_3px_0_0_rgb(99,102,241)]' : ''}`}>
                      {emp.FullName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-300">{emp.EmpID}</td>
                    <td className="px-4 py-3 text-slate-300 hidden md:table-cell">{emp.Department}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{emp.Designation}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        emp.Status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {emp.Status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300 font-medium hidden sm:table-cell">
                      {emp.AnnualSalary.toLocaleString('en-US', {
                        style: 'currency', currency: 'USD', maximumFractionDigits: 0,
                      })}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} pages={pages} total={total} onPageChange={onPageChange} />
    </div>
  );
}

import { motion } from 'framer-motion';
import { X, Send, Mail, Loader2, Users } from 'lucide-react';
import type { Employee } from '../lib/api';

interface Props {
  employees: Employee[];
  sending: boolean;
  onRemove: (empId: string) => void;
  onSendAll: () => void;
  onClose: () => void;
}

export function SelectionReviewPanel({ employees, sending, onRemove, onSendAll, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl shadow-glow overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-fuchsia-100 grid place-items-center">
            <Users className="w-3.5 h-3.5 text-fuchsia-700" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Review & Send</div>
            <div className="text-[11px] text-slate-600">
              {employees.length} employee{employees.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          title="Close review panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Employee cards list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
        {employees.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-500 text-sm">
            No employees selected
          </div>
        ) : (
          employees.map((emp) => {
            const initials = ((emp.FirstName?.[0] ?? '') + (emp.LastName?.[0] ?? '')).toUpperCase() || 'EM';
            return (
              <div key={emp.EmpID} className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{emp.FullName}</div>
                  <div className="text-[11px] text-slate-600 truncate mt-0.5">
                    {emp.Department} · {emp.Designation}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="text-[11px] text-indigo-600 truncate font-mono">
                      {emp.Email || <span className="text-amber-600 font-sans">No email on file</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      emp.Status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {emp.Status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{emp.EmpID}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(emp.EmpID)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 mt-0.5 shrink-0"
                  title="Remove from selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer — Send All */}
      <div className="px-4 py-3.5 border-t border-slate-200 space-y-2">
        {employees.some((e) => !e.Email) && (
          <p className="text-[11px] text-amber-600 text-center">
            Employees without an email will be skipped.
          </p>
        )}
        <button
          onClick={onSendAll}
          disabled={sending || employees.length === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white font-semibold shadow-glow hover:shadow-glow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />}
          {sending ? 'Sending…' : `Send ${employees.length} Report${employees.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </motion.div>
  );
}

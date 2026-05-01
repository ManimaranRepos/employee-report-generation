import { motion } from 'framer-motion';
import { Users, Sparkles, FileDown, Mail } from 'lucide-react';

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-2xl p-8 sm:p-12 text-center"
    >
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 grid place-items-center">
        <Users className="w-7 h-7 text-indigo-200" />
      </div>
      <h3 className="mt-4 text-xl font-bold text-slate-50">Find an employee to get started</h3>
      <p className="mt-2 text-slate-400 max-w-md mx-auto">
        Search by Employee ID (e.g. <span className="font-mono text-slate-200">EMP100042</span>) or by name.
        We index ~40,000 records in memory for instant lookups.
      </p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        <Step icon={Sparkles} title="Search" body="Type an EmpID or name." />
        <Step icon={FileDown} title="Generate" body="One-click branded PDF report." />
        <Step icon={Mail} title="Send" body="Email it to the employee." />
      </div>
    </motion.div>
  );
}

function Step({
  icon: Icon, title, body,
}: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-xl p-4 bg-slate-900/40 border border-white/5">
      <Icon className="w-5 h-5 text-indigo-300" />
      <div className="mt-2 text-sm font-semibold text-slate-100">{title}</div>
      <div className="text-xs text-slate-400 mt-0.5">{body}</div>
    </div>
  );
}

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import { fetchEmailLog, type EmailLogEntry } from '../lib/api';

export interface EmailLogHandle {
  refresh: () => void;
}

export const EmailLog = forwardRef<EmailLogHandle>((_, ref) => {
  const [entries, setEntries] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await fetchEmailLog();
      setEntries(data.entries);
    } catch {
      // silently ignore — non-critical
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useImperativeHandle(ref, () => ({ refresh: load }));

  if (!loading && entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass rounded-2xl shadow-glow overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-800">Sent History</span>
          {entries.length > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
              {entries.length}
            </span>
          )}
        </div>
        <button
          onClick={load}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-6 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 rounded shimmer" />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          <AnimatePresence initial={false}>
            {entries.map((entry, i) => (
              <motion.div
                key={entry.sentAt + entry.empId}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 px-5 py-3.5"
              >
                {entry.status === 'sent' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {entry.employeeName}
                    </span>
                    <span className="text-[11px] text-slate-500">{entry.empId}</span>
                    {entry.attempts > 1 && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                        {entry.attempts} attempts
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 truncate">
                    {entry.status === 'sent'
                      ? `→ ${entry.sentTo}`
                      : <span className="text-rose-400">{entry.error}</span>
                    }
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(entry.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
});

EmailLog.displayName = 'EmailLog';

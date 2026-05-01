import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, IdCard } from 'lucide-react';
import { searchEmployees, type Employee } from '../lib/api';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (empId: string) => void;
  loading?: boolean;
}

export function SearchBar({ value, onChange, onSubmit, loading }: Props) {
  const [suggestions, setSuggestions] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await searchEmployees(value, 6);
        setSuggestions(res);
        setOpen(true);
        setHighlight(0);
      } catch { /* swallow */ }
    }, 180);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && suggestions[highlight]) {
        onSubmit(suggestions[highlight].EmpID);
      } else {
        onSubmit(value.trim());
      }
      setOpen(false);
    } else if (e.key === 'ArrowDown' && open) {
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp' && open) {
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-2 sm:gap-3 glass rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-glow focus-within:shadow-glow-lg transition-shadow">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Enter Employee ID (e.g., EMP100042) or search by name…"
          className="flex-1 bg-transparent outline-none placeholder:text-slate-500 text-slate-100 text-sm sm:text-base"
          aria-label="Search employees"
        />
        <button
          onClick={() => onSubmit(value.trim())}
          disabled={loading || !value.trim()}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-2 w-full max-h-80 overflow-auto glass rounded-xl py-1 border border-slate-700/40"
          >
            {suggestions.map((s, i) => (
              <li
                key={s.EmpID}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); onSubmit(s.EmpID); setOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                  i === highlight ? 'bg-indigo-500/15' : ''
                }`}
              >
                <IdCard className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-slate-100 truncate">{s.FullName}</span>
                  <span className="text-xs text-slate-400 truncate">
                    {s.EmpID} · {s.Department} · {s.Designation}
                  </span>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

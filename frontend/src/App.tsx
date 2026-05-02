import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Database, Activity, ShieldCheck } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { EmployeeCard } from './components/EmployeeCard';
import { ActionBar } from './components/ActionBar';
import { PdfPreview } from './components/PdfPreview';
import { EmptyState } from './components/EmptyState';
import { EmailLog, type EmailLogHandle } from './components/EmailLog';
import {
  fetchEmployee, generatePdf, emailReport, fetchHealth, type Employee,
} from './lib/api';

export default function App() {
  const [query, setQuery] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [health, setHealth] = useState<{ count: number } | null>(null);
  const emailLogRef = useRef<EmailLogHandle>(null);

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h)).catch(() => setHealth(null));
  }, []);

  // Revoke previous object URL when a new PDF arrives or component unmounts
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  async function handleSearch(rawId: string) {
    const empId = rawId.trim();
    if (!empId) return;
    setLoading(true);
    setEmployee(null);
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
    try {
      const t0 = performance.now();
      const emp = await fetchEmployee(empId);
      setEmployee(emp);
      toast.success(`Found ${emp.FullName} in ${(performance.now() - t0).toFixed(0)}ms`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!employee) return;
    setGenerating(true);
    try {
      const blob = await generatePdf(employee.EmpID);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob));
      toast.success('PDF generated');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSendEmail() {
    if (!employee) return;
    setSending(true);
    try {
      const res = await emailReport(employee.EmpID);
      if (res.previewOnly) {
        toast.success(`Preview-only: would have emailed ${res.sentTo}`);
      } else {
        toast.success(`Sent to ${res.sentTo}`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
      emailLogRef.current?.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-mesh relative">
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 sm:mb-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center shadow-glow">
              <span className="font-extrabold text-white">E</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-50">Employee Reports</h1>
              <p className="text-xs text-slate-400 -mt-0.5">Search · Generate · Email</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Pill icon={Database} text={health ? `${health.count.toLocaleString()} records` : 'connecting…'} />
            <Pill icon={Activity} text="Indexed in-memory" />
            <Pill icon={ShieldCheck} text="Helmet · CORS · Rate-limited" />
          </div>
        </motion.header>

        {/* Hero / Search */}
        <section className="mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-50 leading-tight">
              <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-rose-300 bg-clip-text text-transparent">
                Find any employee
              </span>{' '}
              in milliseconds.
            </h2>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl">
              Search by Employee ID, generate a polished PDF report, and email it to them — all in one flow.
            </p>
          </motion.div>

          <div className="mt-5 sm:mt-7">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={handleSearch}
              loading={loading}
            />
          </div>
        </section>

        {/* Body */}
        <section className="space-y-6">
          {!employee && !loading && <EmptyState />}

          {loading && <SkeletonCard />}

          {employee && (
            <>
              <EmployeeCard employee={employee} />
              <ActionBar
                onGenerate={handleGenerate}
                onSendEmail={handleSendEmail}
                generating={generating}
                sending={sending}
                hasPdf={!!pdfUrl}
              />
              <PdfPreview
                url={pdfUrl}
                fileName={`EmployeeReport-${employee.EmpID}.pdf`}
                onClose={() => { URL.revokeObjectURL(pdfUrl!); setPdfUrl(null); }}
              />
            </>
          )}
        </section>

        {/* Sent History */}
        <section className="mt-8">
          <EmailLog ref={emailLogRef} />
        </section>

        <footer className="mt-14 text-center text-xs text-slate-500">
          Built with React · Vite · Tailwind · Framer Motion · Express · PDFKit · Nodemailer
        </footer>
      </div>
    </div>
  );
}

function Pill({
  icon: Icon, text,
}: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-900/60 border border-white/5 text-slate-300">
      <Icon className="w-3.5 h-3.5 text-indigo-300" />
      {text}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-6 shadow-glow">
      <div className="flex gap-5">
        <div className="w-20 h-20 rounded-2xl shimmer" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/3 rounded shimmer" />
          <div className="h-3 w-1/2 rounded shimmer" />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="h-3 rounded shimmer" />
            <div className="h-3 rounded shimmer" />
            <div className="h-3 rounded shimmer" />
            <div className="h-3 rounded shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

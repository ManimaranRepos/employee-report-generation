import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Activity, ShieldCheck, Search, Loader2, Mail, X, ExternalLink, Download, ClipboardList,
} from 'lucide-react';
import { EmployeeTable } from './components/EmployeeTable';
import { SelectionReviewPanel } from './components/SelectionReviewPanel';
import { EmailLog, type EmailLogHandle } from './components/EmailLog';
import {
  fetchEmployeesPage, generatePdf, emailReport, bulkEmailReports, fetchHealth, type Employee,
} from './lib/api';

export default function App() {
  const [filterQuery, setFilterQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tableLoading, setTableLoading] = useState(true);

  // Single-employee PDF preview
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Multi-select — store full Employee objects so review panel needs no extra fetches
  const [checkedEmployees, setCheckedEmployees] = useState<Map<string, Employee>>(new Map());
  const [reviewMode, setReviewMode] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  const [health, setHealth] = useState<{ count: number } | null>(null);
  const emailLogRef = useRef<EmailLogHandle>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h)).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(filterQuery);
      setCurrentPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filterQuery]);

  useEffect(() => {
    setTableLoading(true);
    fetchEmployeesPage(currentPage, 10, debouncedQuery)
      .then(({ data, total, pages }) => {
        setEmployees(data);
        setTotalRecords(total);
        setTotalPages(pages);
      })
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setTableLoading(false));
  }, [currentPage, debouncedQuery]);

  useEffect(() => {
    const url = pdfUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [pdfUrl]);

  // --- PDF preview (single row click) ---
  async function handleRowSelect(emp: Employee) {
    if (reviewMode) return; // don't override review panel
    if (selectedEmployee?.EmpID === emp.EmpID && pdfUrl) return;
    setSelectedEmployee(emp);
    setPdfUrl(null);
    setGenerating(true);
    try {
      const blob = await generatePdf(emp.EmpID);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function handleClosePreview() {
    setSelectedEmployee(null);
    setPdfUrl(null);
  }

  async function handleSendEmail() {
    if (!selectedEmployee) return;
    setSending(true);
    try {
      const res = await emailReport(selectedEmployee.EmpID);
      toast.success(res.previewOnly ? `Preview-only: would have emailed ${res.sentTo}` : `Sent to ${res.sentTo}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
      emailLogRef.current?.refresh();
    }
  }

  // --- Multi-select ---
  const checkedIds = new Set(checkedEmployees.keys());

  function handleToggleCheck(emp: Employee) {
    setCheckedEmployees((prev) => {
      const next = new Map(prev);
      next.has(emp.EmpID) ? next.delete(emp.EmpID) : next.set(emp.EmpID, emp);
      return next;
    });
  }

  function handleToggleCheckAll(emps: Employee[]) {
    const allChecked = emps.every((e) => checkedEmployees.has(e.EmpID));
    setCheckedEmployees((prev) => {
      const next = new Map(prev);
      if (allChecked) emps.forEach((e) => next.delete(e.EmpID));
      else emps.forEach((e) => next.set(e.EmpID, e));
      return next;
    });
  }

  function handleRemoveFromSelection(empId: string) {
    setCheckedEmployees((prev) => {
      const next = new Map(prev);
      next.delete(empId);
      if (next.size === 0) setReviewMode(false);
      return next;
    });
  }

  function handleOpenReview() {
    setSelectedEmployee(null);
    setPdfUrl(null);
    setReviewMode(true);
  }

  function handleCloseReview() {
    setReviewMode(false);
  }

  async function handleBulkSend() {
    if (checkedEmployees.size === 0 || bulkSending) return;
    setBulkSending(true);
    const ids = Array.from(checkedEmployees.keys());
    const loadingId = toast.loading(`Sending ${ids.length} report${ids.length > 1 ? 's' : ''}…`);
    try {
      const { results } = await bulkEmailReports(ids);
      toast.dismiss(loadingId);
      const sent = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);
      if (sent.length > 0) toast.success(`${sent.length} report${sent.length > 1 ? 's' : ''} sent successfully`);
      failed.forEach((r) => toast.error(`Failed for ${r.empId}: ${r.error ?? 'unknown error'}`));
      setCheckedEmployees(new Map());
      setReviewMode(false);
      emailLogRef.current?.refresh();
    } catch (err) {
      toast.dismiss(loadingId);
      toast.error((err as Error).message);
    } finally {
      setBulkSending(false);
    }
  }

  const rightPanelOpen = reviewMode || !!selectedEmployee;

  return (
    <div className="min-h-screen bg-mesh relative">
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
              <p className="text-xs text-slate-400 -mt-0.5">Browse · Preview · Select · Email</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Pill icon={Database} text={health ? `${health.count.toLocaleString()} records` : 'connecting…'} />
            <Pill icon={Activity} text="Indexed in-memory" />
            <Pill icon={ShieldCheck} text="Helmet · CORS · Rate-limited" />
          </div>
        </motion.header>

        {/* Filter + action bar row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 flex items-center gap-3 flex-wrap"
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by name, ID, department…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition"
            />
          </div>

          {/* Review & Send button — appears when employees are checked */}
          <AnimatePresence>
            {checkedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-slate-400">
                  <span className="font-semibold text-indigo-300">{checkedIds.size}</span> selected
                </span>
                <button
                  onClick={() => setCheckedEmployees(new Map())}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
                >
                  Clear
                </button>
                <button
                  onClick={handleOpenReview}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white text-sm font-semibold shadow-glow hover:shadow-glow-lg transition"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Review & Send ({checkedIds.size})
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Table + right panel */}
        <div className={`grid gap-5 ${rightPanelOpen ? 'lg:grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>
          <EmployeeTable
            employees={employees}
            loading={tableLoading}
            selectedId={!reviewMode ? (selectedEmployee?.EmpID ?? null) : null}
            onSelect={handleRowSelect}
            checkedIds={checkedIds}
            onToggleCheck={handleToggleCheck}
            onToggleCheckAll={handleToggleCheckAll}
            page={currentPage}
            pages={totalPages}
            total={totalRecords}
            onPageChange={setCurrentPage}
          />

          <AnimatePresence mode="wait">
            {reviewMode ? (
              <SelectionReviewPanel
                key="review"
                employees={Array.from(checkedEmployees.values())}
                sending={bulkSending}
                onRemove={handleRemoveFromSelection}
                onSendAll={handleBulkSend}
                onClose={handleCloseReview}
              />
            ) : selectedEmployee ? (
              <DetailPanel
                key={selectedEmployee.EmpID}
                employee={selectedEmployee}
                pdfUrl={pdfUrl}
                generating={generating}
                sending={sending}
                onSendEmail={handleSendEmail}
                onClose={handleClosePreview}
                fileName={`EmployeeReport-${selectedEmployee.EmpID}.pdf`}
              />
            ) : null}
          </AnimatePresence>
        </div>

        {/* Sent history */}
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

interface DetailPanelProps {
  employee: Employee;
  pdfUrl: string | null;
  generating: boolean;
  sending: boolean;
  onSendEmail: () => void;
  onClose: () => void;
  fileName: string;
}

function DetailPanel({ employee, pdfUrl, generating, sending, onSendEmail, onClose, fileName }: DetailPanelProps) {
  const initials = ((employee.FirstName?.[0] ?? '') + (employee.LastName?.[0] ?? '')).toUpperCase() || 'EM';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-2xl shadow-glow overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 grid place-items-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-100 truncate">{employee.FullName}</div>
            <div className="text-xs text-slate-400 truncate">
              {employee.Designation} · <span className="font-mono text-indigo-300">{employee.EmpID}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0 ml-2"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 bg-slate-950 min-h-0">
        {generating ? (
          <div className="h-[460px] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Generating PDF…</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-slate-900/40">
              <span className="text-xs text-slate-400 truncate mr-2">{fileName}</span>
              <div className="flex gap-1.5 shrink-0">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
                <a
                  href={pdfUrl}
                  download={fileName}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 transition-colors"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
            <iframe title="PDF preview" src={pdfUrl} className="w-full h-[460px] bg-slate-950" />
          </>
        ) : (
          <div className="h-[460px] flex items-center justify-center text-slate-600 text-sm">
            PDF generation failed — click the row to retry
          </div>
        )}
      </div>

      <div className="px-4 py-3.5 border-t border-white/5">
        <button
          onClick={onSendEmail}
          disabled={sending || !pdfUrl || generating}
          title={pdfUrl ? `Send PDF to ${employee.Email}` : 'Waiting for PDF…'}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white font-semibold shadow-glow hover:shadow-glow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {employee.Email ? `Send to ${employee.Email.split('@')[0]}@…` : 'Send Email'}
        </button>
      </div>
    </motion.div>
  );
}

function Pill({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-900/60 border border-white/5 text-slate-300">
      <Icon className="w-3.5 h-3.5 text-indigo-300" />
      {text}
    </span>
  );
}

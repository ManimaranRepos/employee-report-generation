import { motion } from 'framer-motion';
import { FileDown, Mail, Loader2 } from 'lucide-react';

interface Props {
  onGenerate: () => void;
  onSendEmail: () => void;
  generating: boolean;
  sending: boolean;
  hasPdf: boolean;
}

export function ActionBar({ onGenerate, onSendEmail, generating, sending, hasPdf }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.25 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <button
        onClick={onGenerate}
        disabled={generating}
        className="group relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-white font-semibold shadow-glow hover:shadow-glow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
        Generate PDF
      </button>

      <button
        onClick={onSendEmail}
        disabled={sending || !hasPdf}
        title={hasPdf ? 'Send the latest PDF to the employee email' : 'Generate the PDF first'}
        className="group relative inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800/70 border border-slate-700 text-slate-100 font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
        Send Email
      </button>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { FileText, ExternalLink, Download, X } from 'lucide-react';

interface Props {
  url: string | null;
  fileName: string;
  onClose: () => void;
}

export function PdfPreview({ url, fileName, onClose }: Props) {
  if (!url) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="glass rounded-2xl overflow-hidden shadow-glow"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="font-medium truncate">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-200"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open
          </a>
          <a
            href={url}
            download={fileName}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 transition-colors"
            title="Close preview"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </div>
      <div className="bg-slate-950">
        <iframe
          title="PDF preview"
          src={url}
          className="w-full h-[520px] sm:h-[640px] bg-slate-950"
        />
      </div>
    </motion.div>
  );
}

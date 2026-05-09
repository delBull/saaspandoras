'use client';

import { FileText, FileWarning } from 'lucide-react';

export function PrintButton({ variant = 'default' }: { variant?: 'default' | 'warning' }) {
  return (
    <button
      onClick={() => window.print()}
      className="px-5 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2"
    >
      {variant === 'warning' ? <FileWarning size={14} /> : <FileText size={14} />}
      Imprimir / PDF
    </button>
  );
}

'use client';

import { Download } from 'lucide-react';

export function CertificateActions() {
  return (
    <button 
      onClick={() => window.print()}
      className="group relative px-10 py-6 bg-narai-gold text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[0.7rem] transition-all hover:scale-[1.03] active:scale-[0.98] shadow-2xl shadow-narai-gold/20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
      <span className="relative flex items-center gap-4">
        Imprimir / Descargar Título Legal <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
      </span>
    </button>
  );
}

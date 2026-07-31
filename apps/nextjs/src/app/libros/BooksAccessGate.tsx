'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const BOOK_LABELS: Record<string, string> = {
  'constitucion': 'Libro 0 — Constitución de Pandoras (Documento Supremo)',
  'libro-i': 'Libro I — Corporate Charter (Estructura de Organización)',
  'libro-ii': 'Libro II — Corporate Governance (Matriz de Control)',
  'libro-iii': 'Libro III — Institutional Treasury (Gestión de Reservas)',
  'libro-iv': 'Libro IV — IP & Asset Register (Registro de Activos & Ciclo de Vida)',
  'libro-v': 'Libro V — Licensing Framework (Licenciamiento Territorial)',
  'libro-vi': 'Libro VI — Technology Platform & Capital Engine',
  'libro-vii': 'Libro VII — Growth & Expansion (Roadmap Geográfico)',
  'libro-viii': 'Libro VIII — Institutional Doctrine (Doctrina Estratégica)',
};

export default function BooksAccessGate({ bookSlug }: { bookSlug: string }) {
  const [email, setEmail] = useState('marco.munoz9@gmail.com');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await fetch('/api/books/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, bookSlug }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060606] flex items-center justify-center px-6">
      {/* Grid bg */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center max-w-lg w-full"
      >
        {/* Logo / wordmark */}
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 mb-10">
          Pandoras Growth OS
        </p>

        {/* Lock icon */}
        <div className="mx-auto mb-8 w-14 h-14 rounded-full border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="text-4xl font-thin text-white tracking-tight mb-3">
          Acceso Restringido
        </h1>
        <p className="text-sm text-zinc-600 font-light mb-2">
          {BOOK_LABELS[bookSlug] ?? 'Documento Institucional'}
        </p>
        <p className="text-xs text-zinc-700 mb-12">
          Este documento es confidencial. Solicita un enlace de acceso.
        </p>

        {!sent ? (
          <button
            onClick={handleRequest}
            disabled={loading}
            className="w-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white transition-all duration-200 disabled:opacity-40 font-light tracking-wide"
          >
            {loading ? 'Solicitando...' : 'Solicitar Acceso'}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border border-white/[0.06] rounded-xl px-6 py-5 bg-white/[0.02]"
          >
            <p className="text-zinc-300 text-sm font-light mb-1">Enlace Solicitado</p>
            <p className="text-zinc-600 text-xs">
              Revisa tu canal privado en Discord. El enlace expira en 2 horas.
            </p>
          </motion.div>
        )}

        <p className="mt-10 text-[10px] text-zinc-800 tracking-widest uppercase">
          Pandoras Group · Confidential
        </p>
      </motion.div>
    </div>
  );
}

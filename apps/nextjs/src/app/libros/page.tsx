'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

function GridBg() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }}
    />
  );
}

const BOOKS = [
  {
    slug: 'constitucion',
    roman: '★',
    title: 'Constitución de Pandoras',
    subtitle: 'Marco Institucional Invariable v2.0 · Documento Supremo',
    chapters: ['Declaración de Identidad', 'Principios Innegociables', 'Arquitectura del Holding & SPVs', 'Gobernanza y Criterios', 'Pandoras 2035'],
    accent: 'border-amber-500/40 hover:border-amber-500/70',
    label: 'border-amber-500/50 text-amber-400',
  },
  {
    slug: 'libro-i',
    roman: 'I',
    title: 'Institutional Corporate Architecture',
    subtitle: 'Holding · SPVs · Entidades · IP · Tesorería',
    chapters: ['Corporate Philosophy', 'Corporate Architecture', 'Intellectual Property', 'Treasury Architecture', 'Asset Capitalization'],
    accent: 'border-blue-500/20 hover:border-blue-500/40',
    label: 'border-blue-500/30 text-blue-400/70',
  },
  {
    slug: 'libro-ii',
    roman: 'II',
    title: 'Financial Engine',
    subtitle: 'Payments · Settlement · Fee Engine · Economic Engine',
    chapters: ['Dual Payment Engine', 'Platform Fee Engine', 'Settlement Architecture', 'Economic Engine', 'Liquidity Layer'],
    accent: 'border-emerald-500/20 hover:border-emerald-500/40',
    label: 'border-emerald-500/30 text-emerald-400/70',
  },
  {
    slug: 'libro-iii',
    roman: 'III',
    title: 'Protocol & Technology',
    subtitle: 'Growth OS · Smart Contracts · APIs · Security',
    chapters: ['Growth OS Stack', 'Smart Contract Layer', 'API Architecture', 'Security Perimeter'],
    accent: 'border-purple-500/20 hover:border-purple-500/40',
    label: 'border-purple-500/30 text-purple-400/70',
  },
  {
    slug: 'libro-iv',
    roman: 'IV',
    title: 'Governance',
    subtitle: 'Principios · Riesgo · Auditoría · Compliance · 2035',
    chapters: ['Operating Principles', 'Risk Framework', 'Audit & Controls', 'Compliance Layer', 'Pandoras 2035'],
    accent: 'border-amber-500/20 hover:border-amber-500/40',
    label: 'border-amber-500/30 text-amber-400/70',
  },
];

function BookCard({ book, index }: { book: typeof BOOKS[0]; index: number }) {
  const [email, setEmail] = useState('marco.munoz9@gmail.com');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await fetch('/api/books/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, bookSlug: book.slug }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={`border ${book.accent} rounded-2xl p-6 bg-white/[0.01] transition-all duration-300 group flex flex-col gap-5`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`text-[9px] uppercase tracking-widest border rounded px-2 py-0.5 ${book.label} mb-3 inline-block`}>
            Libro {book.roman}
          </span>
          <h2 className="text-white text-lg font-thin tracking-tight leading-snug">{book.title}</h2>
          <p className="text-zinc-600 text-xs font-light mt-1">{book.subtitle}</p>
        </div>
      </div>

      {/* Chapter list */}
      <ul className="space-y-1.5">
        {book.chapters.map((ch, i) => (
          <li key={i} className="text-zinc-600 text-xs flex gap-2 items-center">
            <span className="text-zinc-800">{String(i + 1).padStart(2, '0')}</span>
            {ch}
          </li>
        ))}
      </ul>

      {/* Access */}
      {!sent ? (
        <button
          onClick={handleRequest}
          disabled={loading}
          className="mt-auto w-full border border-white/[0.06] hover:border-white/20 rounded-xl px-4 py-2.5 text-xs text-zinc-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {loading ? 'Solicitando...' : 'Solicitar Acceso'}
        </button>
      ) : (
        <div className="mt-auto border border-white/[0.05] rounded-xl px-4 py-3 bg-white/[0.02]">
          <p className="text-zinc-400 text-xs">Enlace enviado a tu <span className="text-zinc-300">Discord Privado</span></p>
          <p className="text-zinc-700 text-[10px] mt-1">Expira en 2 horas</p>
        </div>
      )}
    </motion.div>
  );
}

export default function LibrosIndexPage() {
  return (
    <main className="min-h-screen bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* Header */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-8">Pandoras Growth OS</p>
          <h1 className="text-5xl md:text-7xl font-thin tracking-tight text-white mb-6">
            Institutional<br />Library
          </h1>
          <p className="text-zinc-600 text-sm font-light max-w-md mx-auto">
            Documentación institucional confidencial. El acceso a cada libro se entrega vía enlace firmado con TTL de 2 horas.
          </p>
        </motion.div>

        {/* Books grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {BOOKS.map((book, i) => (
            <BookCard key={book.slug} book={book} index={i} />
          ))}
        </div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <Link href="/nexus" className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors tracking-widest uppercase">
            ← Volver a Nexus
          </Link>
        </motion.div>

        <p className="mt-16 text-center text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Group · Confidencial · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}

'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
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
    roman: '0',
    title: 'Constitution',
    subtitle: 'Principios Inmutables, Access Economy & Declaración Supremai',
    chapters: ['Declaración de Identidad', 'Access Economy (AaaS)', 'Principios Innegociables', 'Arquitectura del Holding', 'Visión 2035'],
    accent: 'border-amber-500/40 hover:border-amber-500/70',
    label: 'border-amber-500/50 text-amber-400',
  },
  {
    slug: 'libro-i',
    roman: 'I',
    title: 'Corporate Charter (PGAPA-001)',
    subtitle: 'Arquitectura Corporativa Matriz · ADGM Holding · Operativas (MX/USA) · SPVs',
    chapters: ['Pandoras IP Holdings Ltd (ADGM)', 'Compañías Operativas LLC/S.A. (USA/MX)', 'Project SPVs (RWA Aislados)', 'Contrato Maestro de Licencia', 'Foundation ADGM Roadmap'],
    accent: 'border-blue-500/20 hover:border-blue-500/40',
    label: 'border-blue-500/30 text-blue-400/70',
  },
  {
    slug: 'libro-ii',
    roman: 'II',
    title: 'Corporate Governance',
    subtitle: 'Matriz de Decisión, Criterios de Admisión de Proyectos y Controles',
    chapters: ['Consejo Fundador (Holding)', 'Directores Regionales (Operativas)', 'Criterios de Rechazo', 'Auditoría de Cumplimiento'],
    accent: 'border-emerald-500/20 hover:border-emerald-500/40',
    label: 'border-emerald-500/30 text-emerald-400/70',
  },
  {
    slug: 'libro-iii',
    roman: 'III',
    title: 'Institutional Treasury',
    subtitle: 'Gestión Tripartita de Tesorería · Operativa, Estratégica y Reservas',
    chapters: ['Operational Treasury', 'Strategic Treasury (Equity/Certificados)', 'Reserve Treasury (3-6m Opex)', 'Yield Distribution'],
    accent: 'border-purple-500/20 hover:border-purple-500/40',
    label: 'border-purple-500/30 text-purple-400/70',
  },
  {
    slug: 'libro-iv',
    roman: 'IV',
    title: 'IP & Asset Register (PACS-001)',
    subtitle: 'Estándar Institucional de Clasificación de Activos, 6 Niveles PACS & Taxonomía IP',
    chapters: ['Taxonomía de Activos (Software/Brand/AI)', 'Niveles de Madurez PACS (A a F)', 'Capital Engine Protocol', 'Investor & Deal Data Assets', 'Matriz de Estado & Titularidad'],
    accent: 'border-rose-500/20 hover:border-rose-500/40',
    label: 'border-rose-500/30 text-rose-400/70',
  },
  {
    slug: 'libro-v',
    roman: 'V',
    title: 'Licensing Framework',
    subtitle: 'Contrato Maestro de Licencia Territorial Exclusiva y Aislamiento de IP',
    chapters: ['Derechos Concedidos (Operativas)', 'Royalty Fees al Holding', 'Levantamiento de Capital en LLCs', 'Aislamiento Patrimonial'],
    accent: 'border-cyan-500/20 hover:border-cyan-500/40',
    label: 'border-cyan-500/30 text-cyan-400/70',
  },
  {
    slug: 'libro-vi',
    roman: 'VI',
    title: 'Technology Platform & Capital Engine',
    subtitle: 'Growth OS Stack, Capital Engine, Dual Payment Pipeline & Data',
    chapters: ['Capital Engine (Fees/Equity)', 'Dual Payments (Thirdweb+Blokko)', 'Smart Contracts & Web3', 'Security Perimeter (HMAC/Edge)'],
    accent: 'border-indigo-500/20 hover:border-indigo-500/40',
    label: 'border-indigo-500/30 text-indigo-400/70',
  },
  {
    slug: 'libro-vii',
    roman: 'VII',
    title: 'Growth & Expansion',
    subtitle: 'Estrategia de Crecimiento Institucional, Roadmap Geográfico y AaaS',
    chapters: ['Fase 1: Institucionalización IOM', 'Fase 2: Pandoras USA LLC', 'Fase 3: Operación LatAm (Blokko)', 'Fase 4: Access as a Service'],
    accent: 'border-teal-500/20 hover:border-teal-500/40',
    label: 'border-teal-500/30 text-teal-400/70',
  },
  {
    slug: 'libro-viii',
    roman: 'VIII',
    title: 'Institutional Doctrine',
    subtitle: 'Principios Intelectuales de Decisión, Filosofía de Riesgo y Criterios',
    chapters: ['Pensar en Decenios', 'Calidad de Socios sobre Volumen', 'Resiliencia Patrimonial RWA', 'Confianza Diseñada en Código'],
    accent: 'border-amber-500/30 hover:border-amber-500/60',
    label: 'border-amber-500/40 text-amber-300',
  },
];

function BookCard({ book, index, activeToken }: { book: typeof BOOKS[0]; index: number; activeToken?: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      await fetch('/api/books/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'marco.munoz9@gmail.com', bookSlug: book.slug }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const bookUrl = activeToken ? `/libros/${book.slug}?token=${activeToken}` : `/libros/${book.slug}`;

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

      {/* Access / Open Button */}
      {activeToken ? (
        <Link
          href={bookUrl}
          className="mt-auto w-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 rounded-xl px-4 py-2.5 text-xs text-white transition-all duration-200 flex items-center justify-center gap-2 font-light"
        >
          <span>Abrir Documento</span>
          <span className="text-xs">→</span>
        </Link>
      ) : !sent ? (
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
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      sessionStorage.setItem('pandoras_books_token', urlToken);
      setToken(urlToken);
    } else {
      const stored = sessionStorage.getItem('pandoras_books_token');
      if (stored) setToken(stored);
    }
  }, []);

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
            <BookCard key={book.slug} book={book} index={i} activeToken={token} />
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

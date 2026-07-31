'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

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

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ChapterSplash({ number, title, anchor }: { number: string; title: string; anchor: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section id={anchor} ref={ref} className="min-h-screen flex flex-col items-center justify-center bg-[#060606] relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center px-6"
      >
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 mb-8">Sección {number}</p>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-thin tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">{title}</h2>
      </motion.div>
    </section>
  );
}

function ManifestoQuote({ text, sub }: { text: string; sub?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-24 bg-[#070707]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-4xl mx-auto"
      >
        <p className="text-3xl md:text-5xl lg:text-6xl font-thin text-white leading-[1.15] tracking-tight">{text}</p>
        {sub && <p className="mt-8 text-zinc-600 text-sm font-light tracking-[0.2em] uppercase">{sub}</p>}
      </motion.div>
    </section>
  );
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-h-screen px-6 py-32 flex flex-col items-center bg-[#080808] ${className}`}>
      <div className="max-w-4xl w-full">{children}</div>
    </section>
  );
}

export default function LibroIClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* Cover */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center px-6"
        >
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Holdings · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-blue-400/80 mb-4">Libro I</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Corporate Charter
          </h1>
          <p className="text-zinc-500 text-sm font-light max-w-md mx-auto mt-8">
            Estructura Corporativa Nivel 1, 2 y 3 · Holding · Operativas LLC · SPVs
          </p>
        </motion.div>
      </section>

      {/* Sec 01 */}
      <ChapterSplash number="01" title="Arquitectura Corporativa en 3 Niveles" anchor="sec1" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">01 — Estructura Institucional</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-10">
            Pandoras Holdings no es una empresa operativa.<br />
            Pandoras Holdings es la entidad titular y administradora<br />
            de los activos estratégicos del grupo.
          </p>
          <p className="text-zinc-400 font-light leading-relaxed max-w-2xl">
            La arquitectura corporativa de Pandoras separa estrictamente el patrimonio estratégico de los riesgos operativos comerciales y del levantamiento de capital en mercados locales.
          </p>
        </Reveal>

        <Reveal delay={0.2} className="mt-16 space-y-6">
          <div className="border border-blue-500/20 rounded-xl p-6 bg-white/[0.01]">
            <p className="text-xs uppercase tracking-widest text-blue-400 mb-2">Nivel 1: Pandoras Holdings (Entidad Matriz)</p>
            <p className="text-zinc-400 text-sm font-light leading-relaxed">
              Concentra, protege y administra el patrimonio estratégico: Propiedad Intelectual, Tesorería, Portfolio de Participaciones, Gobernanza y Licenciamiento Global.
            </p>
          </div>
          <div className="border border-emerald-500/20 rounded-xl p-6 bg-white/[0.01]">
            <p className="text-xs uppercase tracking-widest text-emerald-400 mb-2">Nivel 2: Compañías Operativas (Pandoras USA LLC / LATAM)</p>
            <p className="text-zinc-400 text-sm font-light leading-relaxed">
              Adquieren derechos de comercialización, operación, nómina y facturación mediante Contratos de Licencia Territorial Exclusiva. No poseen el software ni las marcas.
            </p>
          </div>
          <div className="border border-purple-500/20 rounded-xl p-6 bg-white/[0.01]">
            <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">Nivel 3: Project SPVs (Entidades de Propósito Específico)</p>
            <p className="text-zinc-400 text-sm font-light leading-relaxed">
              Entidades jurídicas independientes aisladas para cada activo real (ej. S'Narai Bucerías). Contingencias de un SPV jamás comprometen al Holding ni a la LLC operativa.
            </p>
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote text="Pandoras Holdings concentrates, protects, and manages the group's strategic assets." sub="Corporate Principle" />

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Libro I · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/libro-ii?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro II: Corporate Governance →
          </a>
        </div>
      </section>
    </main>
  );
}

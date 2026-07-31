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
    <section id={anchor} ref={ref} className="min-h-[45vh] flex flex-col items-center justify-center bg-[#060606] relative overflow-hidden my-12">
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center px-6"
      >
        <p className="text-[10px] uppercase tracking-[0.6em] text-indigo-400/80 mb-4">{number}</p>
        <h2 className="text-3xl md:text-5xl font-thin tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">{title}</h2>
      </motion.div>
    </section>
  );
}

function ManifestoQuote({ text, sub }: { text: string; sub?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} className="min-h-[40vh] flex flex-col items-center justify-center px-6 py-20 bg-[#070707] my-16 border-y border-white/[0.04]">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-4xl mx-auto"
      >
        <p className="text-2xl md:text-4xl font-thin text-white leading-[1.25] tracking-tight italic">"{text}"</p>
        {sub && <p className="mt-6 text-indigo-400/80 text-xs font-light tracking-[0.3em] uppercase">{sub}</p>}
      </motion.div>
    </section>
  );
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`px-6 py-16 flex flex-col items-center bg-[#060606] ${className}`}>
      <div className="max-w-4xl w-full">{children}</div>
    </section>
  );
}

export default function LibroVIClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* Cover */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden bg-[#060606] border-b border-white/[0.04]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center px-6"
        >
          <p className="text-[10px] uppercase tracking-[0.7em] text-zinc-600 mb-12">Pandoras Holdings · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-indigo-400/80 mb-4">Libro VI</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-6">
            Technology Platform & Capital Engine
          </h1>
          <p className="text-zinc-400 text-sm font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Growth OS Architecture, Capital Engine Non-Custodial Layer & AI Intelligence Engine
          </p>
        </motion.div>
      </section>

      {/* Capítulo 1 */}
      <ChapterSplash number="CAPÍTULO 1" title="Growth OS Architecture" anchor="cap1" />
      <Section>
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.5em] text-indigo-400 mb-6">Capítulo 1 — Sistema Operativo Digital</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-8">
            Growth OS no es un simple software.<br />
            Es la infraestructura digital que transforma procesos humanos repetitivos en automatizaciones institucionales escalables.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-indigo-400 mb-2">Investor Portal</p>
              <p className="text-zinc-400 text-xs font-light">Onboarding, verificación KYC/AML, portfolio view, transacciones y gobernanza.</p>
            </div>
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-indigo-400 mb-2">Partner Portal</p>
              <p className="text-zinc-400 text-xs font-light">Estructuración de proyectos, comisiones, atribución y seguimiento comercial.</p>
            </div>
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-indigo-400 mb-2">Founder Dashboard</p>
              <p className="text-zinc-400 text-xs font-light">Métricas en tiempo real, cap table, emisor analytics y control de tesorería.</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 2: Capital Engine */}
      <ChapterSplash number="CAPÍTULO 2" title="Capital Engine & Fee Waterfall" anchor="cap2" />
      <Section>
        <Reveal>
          <div className="space-y-4">
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-emerald-400 mb-2">Non-Custodial Architecture</p>
              <p className="text-zinc-400 text-xs font-light">Los fondos fluyen directamente entre inversionistas y la entidad emisora del proyecto. Pandoras actúa exclusivamente como motor de coordinación y registro.</p>
            </div>
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-amber-400 mb-2">Fee Waterfall & Structuring</p>
              <p className="text-zinc-400 text-xs font-light">Administra Structuring Fees, Platform Subscriptions, Licencias territoriales y acumulación de participaciones en Strategic Treasury (`SCC`).</p>
            </div>
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote text="La tecnología de Pandoras no automatiza una empresa. Ejecuta una arquitectura institucional." sub="Principio Tecnológico" />

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Libro VI · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/libro-vii?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro VII: Growth & Expansion →
          </a>
        </div>
      </section>
    </main>
  );
}

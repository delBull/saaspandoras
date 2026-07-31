'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function GridBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
      style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
  );
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
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
      <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="text-center px-6">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 mb-8">Sección {number}</p>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-thin tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">{title}</h2>
      </motion.div>
    </section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen px-6 py-32 flex flex-col items-center bg-[#080808]">
      <div className="max-w-4xl w-full">{children}</div>
    </section>
  );
}

export default function LibroIIClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606]">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 text-center px-6">
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Holdings · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-emerald-400/80 mb-4">Libro II</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Corporate Governance
          </h1>
          <p className="text-zinc-500 text-sm font-light max-w-md mx-auto mt-8">
            Matriz de Decisión, Criterios de Admisión de Proyectos y Reglas de Control
          </p>
        </motion.div>
      </section>

      <ChapterSplash number="01" title="Matriz de Decisión y Control" anchor="sec1" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">01 — Gobernanza Institucional</p>
          <div className="space-y-6">
            <div className="border border-white/[0.05] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-zinc-200 text-sm font-light mb-2">Consejo Fundador (Holding)</p>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">
                Aprueba licencias territoriales, emite o recompra capital del Holding, aprueba adición de activos al Holding y enmiendas constitucionales.
              </p>
            </div>
            <div className="border border-white/[0.05] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-zinc-200 text-sm font-light mb-2">Directores Regionales (Operativas LLC)</p>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">
                Ejecutan ventas, marketing, relaciones bancarias locales (SPEI/Wire) y atención a clientes regionales dentro de su jurisdicción licenciada.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Libro II · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/libro-iii?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro III: Institutional Treasury →
          </a>
        </div>
      </section>
    </main>
  );
}

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
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 mb-8">Artículo {number}</p>
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
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="text-center max-w-4xl mx-auto">
        <p className="text-3xl md:text-5xl lg:text-6xl font-thin text-white leading-[1.15] tracking-tight">{text}</p>
        {sub && <p className="mt-8 text-zinc-600 text-sm font-light tracking-[0.2em] uppercase">{sub}</p>}
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

export default function ConstitucionClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* Cover */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606]">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 text-center px-6">
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Group · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-amber-500/70 mb-4">Documento Supremo</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Constitución<br />de Pandoras
          </h1>
          <p className="text-zinc-600 text-sm font-light max-w-md mx-auto mt-8">
            Marco Institucional Invariable v2.0 · Principios, Gobernanza y Arquitectura del Holding
          </p>
        </motion.div>
      </section>

      {/* Preámbulo */}
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">Preámbulo</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-10">
            Pandoras no fue concebido como una startup.<br />
            Pandoras es una infraestructura institucional.
          </p>
          <p className="text-zinc-500 font-light leading-relaxed max-w-2xl">
            Esta Constitución establece las reglas inviolables de arquitectura, gobernanza y principios operativos de Pandoras Group. Es el documento supremo del grupo; cualquier política, producto, entidad o acuerdo posterior debe subordinarse a este marco.
          </p>
        </Reveal>
      </Section>

      {/* Art. I */}
      <ChapterSplash number="I" title="Declaración de Identidad" anchor="art1" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">Artículo I — Identidad</p>
          <p className="text-zinc-300 text-xl font-thin leading-relaxed mb-8">
            Pandoras es una Capa de Infraestructura Institucional (Institutional Infrastructure Layer).
          </p>
          <div className="border border-red-500/20 rounded-xl p-6 bg-white/[0.01] space-y-3">
            <p className="text-xs uppercase tracking-widest text-red-400/80 mb-2">Lo que NUNCA será Pandoras:</p>
            <p className="text-zinc-400 text-sm font-light">1. NUNCA será un custodio ni un intermediario financiero.</p>
            <p className="text-zinc-400 text-sm font-light">2. NUNCA será una plataforma de especulación sin activo real respaldatorio.</p>
            <p className="text-zinc-400 text-sm font-light">3. NUNCA comprometerá su neutralidad ni su independencia tecnológica.</p>
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote text="Pandoras exists to build trust where central entities are not required." sub="Constitucional Maxim" />

      {/* Art. II */}
      <ChapterSplash number="II" title="Principios Innegociables" anchor="art2" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">Artículo II — Principios Innegociables</p>
          <div className="space-y-6">
            <div className="border border-white/[0.05] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-zinc-200 text-sm font-light mb-1">§ 2.1 Non-Custodial by Architecture</p>
              <p className="text-zinc-500 text-xs leading-relaxed">El flujo de fondos ocurre directamente entre emisor e inversionista. Pandoras nunca custodia dinero fiat ni crypto.</p>
            </div>
            <div className="border border-white/[0.05] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-zinc-200 text-sm font-light mb-1">§ 2.2 Transparencia Cero-Sorpresas</p>
              <p className="text-zinc-500 text-xs leading-relaxed">Todos los costos, fees y condiciones legales son inmutables y explícitos previo a cualquier transacción.</p>
            </div>
            <div className="border border-white/[0.05] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-zinc-200 text-sm font-light mb-1">§ 2.3 Alineación de Incentivos (Treasury Equity)</p>
              <p className="text-zinc-500 text-xs leading-relaxed">Pandoras acumula participaciones en su Strategic Treasury, asegurando alineación de éxito a largo plazo con cada proyecto.</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Group · Constitución v2.0 · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Volver a la Galería de Libros
          </a>
        </div>
      </section>
    </main>
  );
}

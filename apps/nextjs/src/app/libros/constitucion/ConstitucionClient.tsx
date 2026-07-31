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
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 mb-8">Capítulo {number}</p>
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

export default function ConstitucionClient({ token }: { token: string }) {
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
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Holdings · Documento Supremo</p>
          <p className="text-xs uppercase tracking-[0.5em] text-amber-500/80 mb-4">Libro 0</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Constitución de Pandoras
          </h1>
          <p className="text-zinc-500 text-sm font-light max-w-md mx-auto mt-8">
            Marco Institucional Invariable, Glosario Constitucional & Access Economy
          </p>
        </motion.div>
      </section>

      {/* Preambulo */}
      <ChapterSplash number="00" title="Preámbulo Institucional" anchor="preambulo" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">Preámbulo</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-10">
            Pandoras no fue concebida como una startup, una plataforma tecnológica o un vehículo de inversión.<br />
            Pandoras fue concebida como una institución diseñada para perdurar durante generaciones.
          </p>
          <p className="text-zinc-400 font-light leading-relaxed max-w-2xl">
            Su propósito es desarrollar la infraestructura que permita a personas, empresas e instituciones acceder, estructurar, administrar y escalar activos, capital y oportunidades mediante un modelo abierto, modular y tecnológicamente neutral.
          </p>
        </Reveal>
      </Section>

      {/* Glosario */}
      <ChapterSplash number="01" title="Glosario Constitucional" anchor="glosario" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">Capítulo I — Definiciones Fundamentales</p>
          <div className="space-y-6">
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-amber-400 text-xs font-mono mb-1">Access (Acceso)</p>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                Capacidad institucional de permitir que una persona, empresa o institución participe legítimamente en una oportunidad económica mediante la infraestructura de Pandoras.
              </p>
            </div>
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-amber-400 text-xs font-mono mb-1">Strategic Capital (Capital Estratégico)</p>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                Conjunto de activos intangibles y tangibles (IP, Código Fuente, Datos, Marcas, Tesorería, Participaciones, Relaciones y Reputación) que concentran el valor del grupo.
              </p>
            </div>
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-amber-400 text-xs font-mono mb-1">Pandoras Holdings</p>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                Entidad matriz titular y administradora exclusiva del Patrimonio Estratégico y del sistema de licenciamiento global.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote text="Pandoras Holdings acts as the sole owner and manager of the group's strategic assets." sub="Constitutional Principle" />

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Libro 0 · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/libro-i?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro I: Corporate Charter →
          </a>
        </div>
      </section>
    </main>
  );
}

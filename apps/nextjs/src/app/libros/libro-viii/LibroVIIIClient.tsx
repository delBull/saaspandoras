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
        <p className="text-[10px] uppercase tracking-[0.6em] text-amber-300/80 mb-4">{number}</p>
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
        {sub && <p className="mt-6 text-amber-300/80 text-xs font-light tracking-[0.3em] uppercase">{sub}</p>}
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

export default function LibroVIIIClient({ token }: { token: string }) {
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
          <p className="text-xs uppercase tracking-[0.5em] text-amber-300/80 mb-4">Libro VIII</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-6">
            Institutional Doctrine
          </h1>
          <p className="text-zinc-400 text-sm font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Pensamiento de Decenios, Principios Inmutables, Filosofía de Riesgo & Criterios de Permanencia
          </p>
        </motion.div>
      </section>

      {/* Capítulo 1 */}
      <ChapterSplash number="CAPÍTULO 1" title="The Long Term Principle" anchor="cap1" />
      <Section>
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.5em] text-amber-300 mb-6">Capítulo 1 — Pensar en Decenios</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-8">
            Pandoras no fue diseñado para maximizar resultados inmediatos.<br />
            Fue diseñado para construir una institución capaz de acumular valor durante generaciones.
          </p>
          <div className="space-y-4 text-zinc-400 text-sm font-light leading-relaxed">
            <p>
              Las decisiones no se evalúan por ingresos mensuales o métricas superficiales de vanidad, sino por el nivel de resiliencia patrimonial y reputacional acumulado a lo largo del tiempo.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 2 */}
      <ChapterSplash number="CAPÍTULO 2" title="Institution over Opportunity" anchor="cap2" />
      <Section>
        <Reveal>
          <div className="space-y-4">
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-amber-300 mb-2">Rechazo de Oportunidades Rentables Incompatibles</p>
              <p className="text-zinc-400 text-xs font-light">Una oportunidad comercial debe ser rechazadas si compromete la reputación, la neutralidad, la independencia o la arquitectura inalienable del Holding.</p>
            </div>
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-amber-300 mb-2">Trust as Primary Asset</p>
              <p className="text-zinc-400 text-xs font-light">El activo principal de Pandoras es la confianza acumulada. Toda decisión corporativa debe preguntarse si aumenta o degrada dicha confianza.</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 3: Filtros Multigeneracionales */}
      <ChapterSplash number="CAPÍTULO 3" title="Los 5 Filtros Multigeneracionales" anchor="cap3" />
      <Section>
        <Reveal>
          <div className="space-y-3 text-zinc-400 text-xs font-light leading-relaxed border-l-2 border-amber-400 pl-4">
            <p className="text-white">1. ¿Esta decisión fortalece la institución a largo plazo?</p>
            <p className="text-white">2. ¿Protege la propiedad intelectual inalienable?</p>
            <p className="text-white">3. ¿Aumenta la confianza del ecosistema?</p>
            <p className="text-white">4. ¿Reduce dependencias externas críticas?</p>
            <p className="text-white">5. ¿Si Pandoras existe en 2050, esta decisión seguirá teniendo sentido?</p>
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote text="Construimos infraestructura para décadas, no productos para temporadas." sub="Declaración Suprema" />

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Libro VIII · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/constitucion?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ↩ Constitución de Pandoras
          </a>
        </div>
      </section>
    </main>
  );
}

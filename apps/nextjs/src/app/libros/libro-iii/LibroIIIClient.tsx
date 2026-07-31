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
        <p className="text-[10px] uppercase tracking-[0.6em] text-purple-400/80 mb-4">{number}</p>
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
        {sub && <p className="mt-6 text-purple-400/80 text-xs font-light tracking-[0.3em] uppercase">{sub}</p>}
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

export default function LibroIIIClient({ token }: { token: string }) {
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
          <p className="text-xs uppercase tracking-[0.5em] text-purple-400/80 mb-4">Libro III</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-6">
            Institutional Treasury
          </h1>
          <p className="text-zinc-400 text-sm font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Gestión Patrimonial, Capital Allocation Framework & Strategic Capital Contribution (SCC)
          </p>
        </motion.div>
      </section>

      {/* Capítulo 1 */}
      <ChapterSplash number="CAPÍTULO 1" title="Principios Fundamentales de Tesorería" anchor="cap1" />
      <Section>
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.5em] text-purple-400 mb-6">Capítulo 1 — Filosofía Patrimonial</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-8">
            La liquidez mantiene viva la operación.<br />
            El patrimonio mantiene viva la institución.
          </p>
          <div className="space-y-4 text-zinc-400 text-sm font-light leading-relaxed">
            <p>
              La Tesorería Institucional trasciende la disponibilidad inmediata de efectivo. Su propósito no es construir una simple caja operativa, sino estructurar un Balance Sheet multigeneracional que garantice la independencia financiera de Pandoras Holdings.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 2 */}
      <ChapterSplash number="CAPÍTULO 2" title="Institutional Balance Architecture (IBA)" anchor="cap2" />
      <Section>
        <Reveal>
          <div className="space-y-4">
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-amber-400 mb-2">1. Foundational Capital</p>
              <p className="text-zinc-400 text-xs font-light">Propiedad Intelectual, Marcas, Growth OS, Capital Engine y Blueprint Institucional.</p>
            </div>
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-blue-400 mb-2">2. Operating Capital</p>
              <p className="text-zinc-400 text-xs font-light">Caja, bancos, USDC inmediato y cuentas por cobrar operativas.</p>
            </div>
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">3. Strategic Capital</p>
              <p className="text-zinc-400 text-xs font-light">Equity, participaciones en SPVs (ej. S'Narai), Revenue Share y certificados digitales.</p>
            </div>
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-emerald-400 mb-2">4. Productive Capital</p>
              <p className="text-zinc-400 text-xs font-light">Software SaaS, licencias territoriales de LLCs, regalías e inmuebles estratégicos.</p>
            </div>
            <div className="border border-white/[0.06] p-5 rounded-xl bg-white/[0.01]">
              <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">5. Reserve Capital</p>
              <p className="text-zinc-400 text-xs font-light">Fondo de reserva en stablecoins auditadas para contingencias y resiliencia.</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 3 */}
      <ChapterSplash number="CAPÍTULO 3" title="Strategic Capital Contribution (SCC)" anchor="cap3" />
      <Section>
        <Reveal>
          <div className="space-y-6 text-zinc-400 text-sm font-light leading-relaxed">
            <p>
              <strong className="text-white font-normal">Diferencia entre Ingreso y Contribución:</strong> Pandoras distingue formalmente entre el Ingreso Operativo (pago por servicios prestados) y la Contribución al Capital Estratégico (SCC), que representa la incorporación de valor patrimonial directo al Holding.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
              <div className="p-3 border border-white/[0.05] rounded-lg text-center bg-white/[0.01]">
                <p className="text-purple-400 text-xs font-mono">SCC-E</p>
                <p className="text-[10px] text-zinc-500 mt-1">Equity</p>
              </div>
              <div className="p-3 border border-white/[0.05] rounded-lg text-center bg-white/[0.01]">
                <p className="text-purple-400 text-xs font-mono">SCC-R</p>
                <p className="text-[10px] text-zinc-500 mt-1">Revenue Share</p>
              </div>
              <div className="p-3 border border-white/[0.05] rounded-lg text-center bg-white/[0.01]">
                <p className="text-purple-400 text-xs font-mono">SCC-IP</p>
                <p className="text-[10px] text-zinc-500 mt-1">Intellectual Prop.</p>
              </div>
              <div className="p-3 border border-white/[0.05] rounded-lg text-center bg-white/[0.01]">
                <p className="text-purple-400 text-xs font-mono">SCC-L</p>
                <p className="text-[10px] text-zinc-500 mt-1">Licensing</p>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote text="El crecimiento crea ingresos. La asignación inteligente de capital crea patrimonio." sub="Principio de Tesorería" />

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Libro III · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/libro-iv?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro IV: IP & Asset Register →
          </a>
        </div>
      </section>
    </main>
  );
}

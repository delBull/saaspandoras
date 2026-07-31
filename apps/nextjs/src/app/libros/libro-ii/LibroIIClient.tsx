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
    <section id={anchor} ref={ref} className="min-h-[45vh] flex flex-col items-center justify-center bg-[#060606] relative overflow-hidden my-12">
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="text-center px-6">
        <p className="text-[10px] uppercase tracking-[0.6em] text-emerald-400/80 mb-4">{number}</p>
        <h2 className="text-3xl md:text-5xl font-thin tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">{title}</h2>
      </motion.div>
    </section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-6 py-16 flex flex-col items-center bg-[#060606]">
      <div className="max-w-4xl w-full">{children}</div>
    </section>
  );
}

export default function LibroIIClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* Cover */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center relative overflow-hidden bg-[#060606] border-b border-white/[0.04]">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 text-center px-6">
          <p className="text-[10px] uppercase tracking-[0.7em] text-zinc-600 mb-12">Pandoras Holdings · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-emerald-400/80 mb-4">Libro II</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-6">
            Corporate Governance
          </h1>
          <p className="text-zinc-400 text-sm font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Matriz de Decisión, Reserved Matters, Criterios de Admisión de Proyectos & Ética Institucional
          </p>
        </motion.div>
      </section>

      {/* Capítulo 1 */}
      <ChapterSplash number="CAPÍTULO 1" title="Matriz de Decisión y Control" anchor="cap1" />
      <Section>
        <Reveal>
          <div className="space-y-6">
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-emerald-400 text-xs font-mono mb-2">Consejo Fundador (Holding)</p>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">
                Aprueba licencias territoriales, enmiendas constitucionales, emisión o recompra de capital del Holding y adición de activos al patrimonio estratégico.
              </p>
            </div>
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-emerald-400 text-xs font-mono mb-2">Directores Regionales (Operativas LLC)</p>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">
                Ejecutan ventas, marketing, relaciones bancarias regionales (SPEI/Wire) y operaciones comerciales locales dentro de su jurisdicción licenciada.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 2 */}
      <ChapterSplash number="CAPÍTULO 2" title="Reserved Matters (Materias Reservadas)" anchor="cap2" />
      <Section>
        <Reveal>
          <div className="border border-amber-500/20 bg-amber-500/[0.01] p-6 rounded-xl space-y-3">
            <p className="text-amber-400 text-xs font-mono uppercase tracking-widest">Prohibiciones Expresas para Filiales Operativas</p>
            <p className="text-zinc-300 text-xs font-light">1. Modificar la marca o identidad visual de Pandoras.</p>
            <p className="text-zinc-300 text-xs font-light">2. Vender, sublicenciar o modificar el código fuente de Growth OS.</p>
            <p className="text-zinc-300 text-xs font-light">3. Emitir capital o licenciar a terceros en territorios no asignados.</p>
            <p className="text-zinc-300 text-xs font-light">4. Asumir deudas u obligaciones a nombre de Pandoras Holdings.</p>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 3 */}
      <ChapterSplash number="CAPÍTULO 3" title="Criterios de Admisión de Proyectos" anchor="cap3" />
      <Section>
        <Reveal>
          <div className="space-y-4 text-zinc-400 text-xs font-light leading-relaxed">
            <p className="text-white font-normal text-sm">Se rechazarán categóricamente oportunidades que:</p>
            <p>• Prometan "retornos garantizados" o esquemas financieros inflexibles.</p>
            <p>• Carezcan de verificación KYC/AML o trazabilidad legal sólida.</p>
            <p>• Incurran en opacidad o pongan en riesgo el prestigio del Holding.</p>
          </div>
        </Reveal>
      </Section>

      {/* Footer */}
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

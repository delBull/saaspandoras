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

const ASSETS = [
  { name: 'Marca "Pandoras" & Logos', owner: 'Pandoras Holdings', type: 'Propiedad Industrial', protection: 'Registro de Marca', licensed: 'USA LLC, LATAM', ver: 'v2.0', status: 'Activo', lead: 'Holding Board' },
  { name: 'Pandoras Growth OS', owner: 'Pandoras Holdings', type: 'Software / Código', protection: 'Copyright / Safe-Keep', licensed: 'USA LLC, LATAM', ver: 'v15.5', status: 'Activo', lead: 'Core Tech Team' },
  { name: 'Capital Engine Protocol', owner: 'Pandoras Holdings', type: 'Algoritmo / Protocolo', protection: 'Secreto Industrial', licensed: 'USA LLC', ver: 'v3.0', status: 'Activo', lead: 'Financial Arch' },
  { name: 'Investor & Deal Data Assets', owner: 'Pandoras Holdings', type: 'Data Asset / Analytics', protection: 'Encriptación AES-256', licensed: 'USA LLC', ver: 'Live', status: 'Activo', lead: 'Data Lead' },
  { name: 'Institutional Operating Model', owner: 'Pandoras Holdings', type: 'Modelo Institucional', protection: 'Documento Invariable', licensed: 'Uso Corporativo', ver: 'v2.0', status: 'Activo', lead: 'Legal & Arch' },
  { name: 'Dominios (.finance, .group)', owner: 'Pandoras Holdings', type: 'Activo Digital', protection: 'Registrar Lock', licensed: 'Global', ver: 'v1.0', status: 'Activo', lead: 'Operations' },
];

export default function LibroIVClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606]">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 text-center px-6">
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Holdings · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-amber-500/80 mb-4">Libro IV</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            IP & Asset Register
          </h1>
          <p className="text-zinc-500 text-sm font-light max-w-md mx-auto mt-8">
            Registro Institucional de Activos Estratégicos y Matriz de Ciclo de Vida
          </p>
        </motion.div>
      </section>

      <ChapterSplash number="01" title="Registro Institucional de Activos" anchor="sec1" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">01 — Matriz de Activos del Grupo</p>
          <div className="border border-white/[0.06] rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="p-3 text-zinc-400 font-normal">Activo</th>
                  <th className="p-3 text-zinc-400 font-normal">Propietario</th>
                  <th className="p-3 text-zinc-400 font-normal">Clasificación</th>
                  <th className="p-3 text-zinc-400 font-normal">Protección</th>
                  <th className="p-3 text-zinc-400 font-normal">Licenciado A</th>
                  <th className="p-3 text-zinc-400 font-normal">Versión</th>
                  <th className="p-3 text-zinc-400 font-normal">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ASSETS.map((asset, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="p-3 text-zinc-200 font-light">{asset.name}</td>
                    <td className="p-3 text-zinc-500">{asset.owner}</td>
                    <td className="p-3 text-zinc-500">{asset.type}</td>
                    <td className="p-3 text-zinc-500">{asset.protection}</td>
                    <td className="p-3 text-zinc-500">{asset.licensed}</td>
                    <td className="p-3 text-zinc-500">{asset.ver}</td>
                    <td className="p-3 text-emerald-400/80">{asset.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Section>

      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Libro IV · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/libro-v?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro V: Licensing Framework →
          </a>
        </div>
      </section>
    </main>
  );
}

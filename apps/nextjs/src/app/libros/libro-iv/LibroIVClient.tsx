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
        <p className="text-[10px] uppercase tracking-[0.6em] text-rose-400/80 mb-4">{number}</p>
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
        {sub && <p className="mt-6 text-rose-400/80 text-xs font-light tracking-[0.3em] uppercase">{sub}</p>}
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

const ASSETS = [
  { id: 'PAND-MARK-00001', name: 'Marca "Pandoras" & Logos', owner: 'Pandoras IP Holding', type: 'Industrial Property', protection: 'Registro Marca USPTO/IMPI', licensed: 'USA LLC, LATAM Ops', status: 'Activo' },
  { id: 'PAND-IP-00001', name: 'Pandoras Growth OS (Kernel)', owner: 'Pandoras IP Holding', type: 'Copyright / Software', protection: 'Copyright / Safe-Keep', licensed: 'USA LLC, LATAM Ops', status: 'Activo' },
  { id: 'PAND-IP-00002', name: 'Capital Engine Protocol', owner: 'Pandoras IP Holding', type: 'Trade Secret / Algoritmo', protection: 'Secreto Industrial', licensed: 'USA LLC', status: 'Activo' },
  { id: 'PAND-DATA-00103', name: 'Investor & Deal Scoring Data', owner: 'Pandoras IP Holding', type: 'Data Asset', protection: 'Encriptación AES-256', licensed: 'USA LLC', status: 'Activo' },
  { id: 'PAND-INST-00001', name: 'Institutional Operating Model (IOM)', owner: 'Pandoras Group Holding', type: 'Institutional Asset', protection: 'Documento Invariable', licensed: 'Uso Corporativo Global', status: 'Activo' },
  { id: 'PAND-DIGI-00001', name: 'Dominios (.finance, .group)', owner: 'Pandoras IP Holding', type: 'Digital Asset', protection: 'Registrar Transfer Lock', licensed: 'Global', status: 'Activo' },
];

export default function LibroIVClient({ token }: { token: string }) {
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
          <p className="text-xs uppercase tracking-[0.5em] text-rose-400/80 mb-4">Libro IV</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-6">
            IP & Asset Register
          </h1>
          <p className="text-zinc-400 text-sm font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Registro Institucional de Propiedad Intelectual, Pandoras Asset Standard (PAS) & Evidence Provenance System (AEP)
          </p>
        </motion.div>
      </section>

      {/* Capítulo 1 */}
      <ChapterSplash number="CAPÍTULO 1" title="Principios Generales y Titularidad IP" anchor="cap1" />
      <Section>
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.5em] text-rose-400 mb-6">Capítulo 1 — Separación entre Propiedad y Explotación</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-8">
            Pandoras IP Holding es el titular inalienable de toda la IP.<br />
            Las empresas operativas como Pandoras USA Operations LLC explotan comercialmente bajo licencias multidimensionales.
          </p>
          <div className="space-y-4 text-zinc-400 text-sm font-light leading-relaxed">
            <p>
              Si mañana se vende la operativa Pandoras USA Operations LLC o un SPV regional, el 100% de la propiedad intelectual, código fuente y marcas permanece intacto e intocable dentro de la estructura de IP Holding.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 2: Asset Register */}
      <ChapterSplash number="CAPÍTULO 2" title="Registro Institucional PAS" anchor="cap2" />
      <Section>
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-600 mb-8">Matriz Oficial de Activos del Grupo</p>
          <div className="border border-white/[0.06] rounded-xl overflow-x-auto bg-white/[0.01]">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="p-3 text-rose-400 font-mono">ID PAS</th>
                  <th className="p-3 text-zinc-400 font-normal">Activo</th>
                  <th className="p-3 text-zinc-400 font-normal">Titular</th>
                  <th className="p-3 text-zinc-400 font-normal">Pilar IP</th>
                  <th className="p-3 text-zinc-400 font-normal">Mecanismo de Protección</th>
                  <th className="p-3 text-zinc-400 font-normal">Licenciado A</th>
                  <th className="p-3 text-zinc-400 font-normal">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ASSETS.map((asset, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="p-3 text-rose-400/90 font-mono text-[11px]">{asset.id}</td>
                    <td className="p-3 text-zinc-200 font-light">{asset.name}</td>
                    <td className="p-3 text-zinc-500">{asset.owner}</td>
                    <td className="p-3 text-zinc-500">{asset.type}</td>
                    <td className="p-3 text-zinc-500">{asset.protection}</td>
                    <td className="p-3 text-zinc-500">{asset.licensed}</td>
                    <td className="p-3 text-emerald-400/80">{asset.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Section>

      {/* Capítulo 3: Provenance System */}
      <ChapterSplash number="CAPÍTULO 3" title="Evidence & Provenance System (AEP)" anchor="cap3" />
      <Section>
        <Reveal>
          <div className="space-y-6 text-zinc-400 text-sm font-light leading-relaxed">
            <p>
              <strong className="text-white font-normal">Asset Evidence Package (AEP):</strong> Cada activo crítico cuenta con un expediente de prueba inmutable compuesto por: evidencia técnica (repositorio y commits), evidencia jurídica (registros IMPI/USPTO y convenios de cesión), y cadena de custodia digital de autoría.
            </p>
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote text="Las operaciones son reemplazables; la arquitectura institucional y la IP no lo son." sub="Principio del IOM" />

      {/* Footer */}
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

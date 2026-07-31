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

function VisualFlow({ nodes }: { nodes: { label: string; sub?: string }[] }) {
  return (
    <div className="flex flex-col items-center gap-0 w-full">
      {nodes.map((node, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="border border-white/[0.08] rounded-xl px-5 py-3 bg-white/[0.02] text-center min-w-[200px]">
            <p className="text-zinc-200 text-sm font-light">{node.label}</p>
            {node.sub && <p className="text-zinc-600 text-[10px] mt-1">{node.sub}</p>}
          </div>
          {i < nodes.length - 1 && (
            <div className="flex flex-col items-center h-8">
              <div className="w-px h-4 bg-white/10" />
              <span className="text-zinc-700 text-[10px]">↓</span>
              <div className="w-px h-4 bg-white/10" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-h-screen px-6 py-32 flex flex-col items-center bg-[#080808] ${className}`}>
      <div className="max-w-4xl w-full">{children}</div>
    </section>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-4 border-b border-white/[0.05]">
      <span className="text-zinc-600 text-xs font-light uppercase tracking-widest w-1/3">{label}</span>
      <span className="text-zinc-300 text-sm font-light text-right w-2/3">{value}</span>
    </div>
  );
}

export default function LibroIClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* ── Cover ─────────────────────────────────────────────────────── */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5 }}
          className="absolute inset-0 bg-gradient-radial from-white/[0.02] via-transparent to-transparent"
        />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center px-6"
        >
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">
            Pandoras Growth OS · Confidencial
          </p>
          <p className="text-xs uppercase tracking-[0.5em] text-zinc-600 mb-4">Libro I</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Institutional<br />Corporate<br />Architecture
          </h1>
          <p className="text-zinc-600 text-sm font-light max-w-md mx-auto mt-8">
            Holding · SPVs · Entidades · Propiedad Intelectual · Tesorería
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.2 }}
          className="absolute bottom-16 flex flex-col items-center gap-2"
        >
          <div className="w-px h-16 bg-gradient-to-b from-white/10 to-transparent" />
        </motion.div>
      </section>

      {/* ── Ch 01: Corporate Philosophy ─────────────────────────────── */}
      <ChapterSplash number="01" title="Corporate Philosophy" anchor="ch01" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">01 — Corporate Philosophy</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-10">
            Pandoras is not a startup.<br />
            Pandoras is not a crypto project.<br />
            Pandoras is institutional infrastructure.
          </p>
          <p className="text-zinc-500 font-light leading-relaxed max-w-2xl">
            From its inception, Pandoras was designed to operate at the intersection of institutional finance and digital asset infrastructure—without acting as a financial intermediary, custodian, or regulated entity in the traditional sense. This distinction is not a legal formality. It is the foundation of the entire business model.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'No es custodio', value: 'Nunca toca fondos de proyectos ni inversionistas directamente.' },
            { label: 'No es intermediario', value: 'Opera como SaaS puro de infraestructura financiera.' },
            { label: 'No es especulativo', value: 'Genera ingresos recurrentes por fees, equity y servicios.' },
          ].map((item, i) => (
            <div key={i} className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.01]">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2">{item.label}</p>
              <p className="text-zinc-300 text-sm font-light leading-relaxed">{item.value}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* ── Manifesto ───────────────────────────────────────────────── */}
      <ManifestoQuote
        text="Pandoras enables compliant capital formation without ever becoming a financial institution."
        sub="Core operating principle"
      />

      {/* ── Ch 02: Corporate Architecture ────────────────────────── */}
      <ChapterSplash number="02" title="Corporate Architecture" anchor="ch02" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">02 — Corporate Architecture</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            La arquitectura corporativa de Pandoras está diseñada para proteger la propiedad intelectual, aislar el riesgo operativo y permitir expansión internacional sin fricción regulatoria.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <VisualFlow nodes={[
            { label: 'Pandoras Group', sub: 'IP Holding / Jurisdicción a determinar (EE.UU. / Panamá)' },
            { label: 'Operational Entities', sub: 'Pandoras MX · Pandoras US · Pandoras International' },
            { label: 'Project SPVs', sub: 'Cada proyecto tokenizado en una entidad legal aislada' },
            { label: 'Investor Layer', sub: 'Titulares de certificados / tokens por proyecto' },
            { label: 'Treasury Layer', sub: 'Operational + Strategic + Reserve' },
          ]} />
        </Reveal>
      </Section>

      {/* ── Ch 03: IP Architecture ───────────────────────────────── */}
      <ChapterSplash number="03" title="Intellectual Property" anchor="ch03" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">03 — IP Architecture</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-12 max-w-2xl">
            Todos los activos intelectuales de Pandoras—código fuente, protocolos, marca, algoritmos y datos—son propiedad del Holding Group. Las entidades operativas obtienen licencias para usar dichos activos.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="space-y-0">
          {[
            { label: 'Código fuente', value: 'Growth OS, APIs, Smart Contracts, Dashboards' },
            { label: 'Marca', value: 'Pandoras · pandoras.finance · Logotipos y sistemas de diseño' },
            { label: 'Protocolos', value: 'Fee Engine, Settlement Protocol, OTC Layer' },
            { label: 'Datos', value: 'Historial transaccional, analytics, modelos de riesgo' },
            { label: 'Licenciamiento', value: 'Entidades operativas pagan royalty al Holding (deducible fiscal)' },
          ].map((row, i) => (
            <DataRow key={i} label={row.label} value={row.value} />
          ))}
        </Reveal>
      </Section>

      {/* ── Ch 04: Treasury Architecture ─────────────────────────── */}
      <ChapterSplash number="04" title="Treasury Architecture" anchor="ch04" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">04 — Treasury Architecture</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            La tesorería de Pandoras no es una sola cuenta. Es una arquitectura de tres capas diseñada para separar liquidez operativa, activos estratégicos y reservas de emergencia.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Operational Treasury',
              items: ['Infraestructura (AWS, Railway, Vercel)', 'Licencias (Thirdweb, Blokko, Neon)', 'Nómina y operaciones', 'Marketing y ventas'],
              accent: 'border-blue-500/20',
            },
            {
              title: 'Strategic Treasury',
              items: ['Tokens y certificados de proyectos', 'Participaciones en SPVs', 'RWAs estratégicos', 'BTC · USDC · Equity recibido como fee'],
              accent: 'border-purple-500/20',
            },
            {
              title: 'Reserve Treasury',
              items: ['Fondo de liquidez (3-6 meses opex)', 'Garantías contractuales', 'Buffer de emergencias', 'Stablecoins auditadas (USDC)'],
              accent: 'border-emerald-500/20',
            },
          ].map((t, i) => (
            <div key={i} className={`border ${t.accent} border-white/[0.04] rounded-xl p-5 bg-white/[0.01]`}>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">{t.title}</p>
              <ul className="space-y-2">
                {t.items.map((item, j) => (
                  <li key={j} className="text-zinc-500 text-sm font-light flex items-start gap-2">
                    <span className="text-zinc-700 mt-1">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* ── Ch 05: Asset Capitalization ──────────────────────────── */}
      <ChapterSplash number="05" title="Asset Capitalization" anchor="ch05" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">05 — Asset Capitalization</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-10">
            The objective is not tokenization itself.<br />
            The objective is institutional capitalization.
          </p>
          <p className="text-zinc-500 font-light leading-relaxed max-w-2xl">
            Pandoras allows real-world assets to become strategic balance-sheet contributors through legally structured participation vehicles. Each project tokenized on the platform contributes equity or revenue to the Pandoras Strategic Treasury, building an appreciating balance sheet backed by real assets.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="mt-16 space-y-0">
          {[
            { label: 'S\'Narai', value: '1.5% de certificados · Aportación al Strategic Treasury' },
            { label: 'Vista Horizonte', value: '2.0% del SPV · Participación directa' },
            { label: 'Proyectos Enterprise', value: 'Negociable · Equity, revenue share o flat fee' },
            { label: 'Freemium', value: 'Sin fee inicial · Pandoras obtiene 2% en fase de scaling' },
          ].map((row, i) => (
            <DataRow key={i} label={row.label} value={row.value} />
          ))}
        </Reveal>
      </Section>

      <ManifestoQuote
        text="Every project that scales on Pandoras makes Pandoras stronger."
        sub="Asset Capitalization Model"
      />

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Group · Libro I · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/libro-ii?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro II: Financial Engine →
          </a>
        </div>
      </section>
    </main>
  );
}

'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const chapters = [
  { number: '01', title: 'Executive Summary', anchor: 'ch01' },
  { number: '02', title: 'Nuestra Filosofía', anchor: 'ch02' },
  { number: '03', title: 'El Problema del Modelo Tradicional', anchor: 'ch03' },
  { number: '04', title: 'Nuestra Tesis', anchor: 'ch04' },
  { number: '05', title: 'Arquitectura Corporativa', anchor: 'ch05' },
  { number: '06', title: 'Institutional Reserve', anchor: 'ch06' },
  { number: '07', title: 'Capital Flow Architecture', anchor: 'ch07' },
  { number: '08', title: 'Institutional Trust Architecture', anchor: 'ch08' },
  { number: '09', title: 'Participant Architecture', anchor: 'ch09' },
  { number: '10', title: "Pandora's 2035", anchor: 'ch10' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function GridBg() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
      style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }}
    />
  );
}

// ── Chapter Splash ─────────────────────────────────────────────────────────────
// Full-screen black section between chapters — minimal, like Apple / Tesla
function ChapterSplash({ number, title, anchor }: { number: string; title: string; anchor: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section
      id={anchor}
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center bg-[#060606] scroll-mt-0 relative overflow-hidden"
    >
      {/* subtle line accent */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center px-6"
      >
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 mb-8">Capítulo {number}</p>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-thin tracking-tight text-white max-w-3xl mx-auto leading-[1.1]">
          {title}
        </h2>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute bottom-16 flex flex-col items-center gap-2"
      >
        <div className="w-px h-12 bg-gradient-to-b from-white/10 to-transparent" />
      </motion.div>
    </section>
  );
}

// ── Manifesto Quote ────────────────────────────────────────────────────────────
// Giant full-width quote page — every 3-4 chapters
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
        <p className="text-3xl md:text-5xl lg:text-6xl font-thin text-white leading-[1.15] tracking-tight">
          {text}
        </p>
        {sub && <p className="mt-8 text-zinc-600 text-sm font-light tracking-[0.2em] uppercase">{sub}</p>}
      </motion.div>
    </section>
  );
}

// ── Visual Flow Diagram ────────────────────────────────────────────────────────
function VisualFlow({ nodes, vertical = true }: { nodes: { label: string; sub?: string }[]; vertical?: boolean }) {
  return (
    <div className={`flex ${vertical ? 'flex-col' : 'flex-row flex-wrap'} items-center gap-0 w-full`}>
      {nodes.map((node, i) => (
        <div key={i} className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center`}>
          <div className="border border-white/[0.08] rounded-xl px-5 py-3 bg-white/[0.02] text-center min-w-[160px]">
            <p className="text-zinc-200 text-sm font-light">{node.label}</p>
            {node.sub && <p className="text-zinc-600 text-[10px] mt-1">{node.sub}</p>}
          </div>
          {i < nodes.length - 1 && (
            <div className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center justify-center ${vertical ? 'h-8' : 'w-8'}`}>
              <div className={`${vertical ? 'w-px h-4' : 'h-px w-4'} bg-white/10`} />
              <span className="text-zinc-700 text-[10px] leading-none">{vertical ? '↓' : '→'}</span>
              <div className={`${vertical ? 'w-px h-4' : 'h-px w-4'} bg-white/10`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Cycle Diagram ───────────────────────────────────────────────────────────
// Circular flow visualization
function CycleDiagram({ items, center }: { items: string[]; center: string }) {
  const positions = [
    { top: '0%', left: '50%', transform: 'translate(-50%, 0)' },
    { top: '25%', left: '90%', transform: 'translate(-50%, 0)' },
    { top: '70%', left: '75%', transform: 'translate(-50%, 0)' },
    { top: '70%', left: '25%', transform: 'translate(-50%, 0)' },
    { top: '25%', left: '10%', transform: 'translate(-50%, 0)' },
  ];
  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ paddingBottom: '100%' }}>
      {/* Center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-32 h-32 rounded-full border border-white/[0.06] bg-white/[0.01] flex items-center justify-center">
          <p className="text-zinc-300 text-xs font-light text-center px-2">{center}</p>
        </div>
      </div>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border border-white/[0.03]" style={{ margin: '10%' }} />
      {/* Nodes */}
      {items.slice(0, 5).map((item, i) => {
        const pos = positions[i];
        return (
          <div key={i} className="absolute" style={{ ...pos }}>
            <div className="border border-white/[0.08] rounded-xl px-3 py-2 bg-[#080808] text-center whitespace-nowrap">
              <p className="text-zinc-300 text-[11px] font-light">{item}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Entity Diagram ─────────────────────────────────────────────────────────────
function EntityDiagram() {
  return (
    <div className="w-full my-8">
      {/* Root */}
      <div className="flex justify-center mb-2">
        <div className="border border-white/20 rounded-2xl px-8 py-4 bg-white/[0.03]">
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 text-center mb-1">Ecosystem</p>
          <p className="text-white font-light text-sm text-center">Pandora's Growth OS</p>
        </div>
      </div>
      {/* Connector */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-white/10" />
      </div>
      {/* Children */}
      <div className="flex justify-center">
        <div className="w-2/3 border-t border-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-0">
        {[
          { name: "Pandora's LLC", loc: 'Wyoming', color: 'border-blue-500/20', items: ['IP · Marca', 'Software', 'Growth OS', 'Contratos Int.'] },
          { name: 'MXHUB S.A.', loc: 'México', color: 'border-emerald-500/20', items: ['Operación', 'Comercial', 'Facturación', 'Personal'] },
          { name: 'Aztecaz Hub', loc: 'SAPI', color: 'border-orange-500/20', items: ['SPV', 'Proyectos', 'Activos', 'Coinversiones'] },
        ].map((e) => (
          <div key={e.name} className={`border ${e.color} rounded-2xl p-4 bg-white/[0.01]`}>
            <div className="flex justify-center mb-1">
              <div className="w-px h-6 bg-white/10" />
            </div>
            <p className="text-zinc-200 text-[11px] font-light text-center mb-1">{e.name}</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 text-center mb-3">{e.loc}</p>
            {e.items.map((item) => (
              <p key={item} className="text-zinc-500 text-[10px] text-center py-0.5">{item}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SPV Tree ───────────────────────────────────────────────────────────────────
function SPVTree() {
  const spvs = ["S'Narai", 'Vista Horizonte', 'Hotel Boutique', 'Luxury Villas', 'Asset Reserve', 'Hospitality'];
  return (
    <div className="w-full my-4">
      <div className="flex justify-center mb-2">
        <div className="border border-orange-500/20 rounded-xl px-6 py-3 bg-white/[0.01]">
          <p className="text-zinc-300 text-sm font-light">Aztecaz Hub SAPI</p>
        </div>
      </div>
      <div className="flex justify-center"><div className="w-px h-6 bg-white/10" /></div>
      <div className="relative flex justify-center">
        <div className="w-4/5 border-t border-white/10" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-0">
        {spvs.map((spv) => (
          <div key={spv} className="flex flex-col items-center">
            <div className="w-px h-4 bg-white/10" />
            <div className="border border-white/[0.06] rounded-lg px-3 py-2 bg-white/[0.01] w-full text-center">
              <p className="text-zinc-400 text-[10px] font-light">SPV {spv}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trust Layers ───────────────────────────────────────────────────────────────
function TrustStack() {
  const layers = [
    { layer: '07', label: 'Transparency', color: 'from-white/5 to-white/[0.02]' },
    { layer: '06', label: 'Asset Architecture', color: 'from-white/[0.04] to-white/[0.01]' },
    { layer: '05', label: 'Documentation', color: 'from-white/[0.03] to-white/[0.01]' },
    { layer: '04', label: 'Technology', color: 'from-white/[0.03] to-white/[0.01]' },
    { layer: '03', label: 'Operations', color: 'from-white/[0.02] to-transparent' },
    { layer: '02', label: 'Governance', color: 'from-white/[0.02] to-transparent' },
    { layer: '01', label: 'Legal Architecture', color: 'from-white/[0.02] to-transparent' },
  ];
  return (
    <div className="w-full space-y-1 my-6">
      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4 text-center">Institutional Trust Stack</p>
      {layers.map((l, i) => (
        <motion.div
          key={l.layer}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
          className={`flex items-center gap-4 px-5 py-3 rounded-xl bg-gradient-to-r ${l.color} border border-white/[0.05]`}
        >
          <span className="text-[9px] text-zinc-700 w-4">{l.layer}</span>
          <div className="flex-1 h-px bg-white/[0.04]" />
          <span className="text-zinc-300 text-sm font-light">{l.label}</span>
          <div className="flex-1 h-px bg-white/[0.04]" />
          <div className="w-2 h-2 rounded-full bg-white/10" />
        </motion.div>
      ))}
      <div className="flex justify-center pt-4">
        <div className="border border-white/10 rounded-xl px-6 py-3 bg-white/[0.02]">
          <p className="text-zinc-200 text-sm font-light text-center">Institution</p>
        </div>
      </div>
    </div>
  );
}

// ── Capital Stages ─────────────────────────────────────────────────────────────
function CapitalStages() {
  const stages = [
    { n: '01', label: 'Captación', color: 'border-blue-500/20' },
    { n: '02', label: 'Desarrollo', color: 'border-indigo-500/20' },
    { n: '03', label: 'Estabilización', color: 'border-violet-500/20' },
    { n: '04', label: 'Distribución', color: 'border-purple-500/20' },
    { n: '05', label: 'Reserve', color: 'border-emerald-500/20' },
  ];
  return (
    <div className="flex flex-col md:flex-row items-center gap-0 w-full my-8">
      {stages.map((s, i) => (
        <div key={s.n} className="flex flex-col md:flex-row items-center flex-1">
          <div className={`border ${s.color} rounded-2xl p-5 bg-white/[0.01] text-center w-full`}>
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-2">Etapa {s.n}</p>
            <p className="text-zinc-200 text-sm font-light">{s.label}</p>
          </div>
          {i < stages.length - 1 && (
            <div className="flex items-center justify-center py-3 md:py-0 md:px-3">
              <span className="text-zinc-700 text-lg rotate-90 md:rotate-0">→</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Reserve Table ──────────────────────────────────────────────────────────────
function ReserveTable() {
  const rows = [
    { label: 'Real Estate (actual)', value: '$450K', status: 'active' },
    { label: 'Hospitality Assets', value: '$3.8M', status: 'future' },
    { label: 'Residential Assets', value: '$6.2M', status: 'future' },
    { label: 'Strategic Land', value: '$2.1M', status: 'future' },
    { label: 'Technology Assets', value: '$1.5M', status: 'future' },
    { label: 'Corporate Equity', value: '$4.3M', status: 'future' },
  ];
  return (
    <div className="border border-white/[0.06] rounded-2xl overflow-hidden my-8">
      <div className="px-6 py-4 border-b border-white/[0.04] bg-white/[0.02]">
        <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Institutional Reserve · Proyección</p>
      </div>
      {rows.map((row, i) => (
        <div key={row.label} className={`flex items-center justify-between px-6 py-4 border-b border-white/[0.03] ${row.status === 'active' ? 'bg-emerald-500/[0.03]' : ''}`}>
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${row.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
            <span className="text-zinc-400 text-sm font-light">{row.label}</span>
          </div>
          <span className={`text-sm font-light ${row.status === 'active' ? 'text-white' : 'text-zinc-500'}`}>{row.value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between px-6 py-5 bg-white/[0.02]">
        <span className="text-zinc-400 text-xs uppercase tracking-[0.2em]">Total Institutional Reserve</span>
        <span className="text-white text-lg font-thin">$17.9M</span>
      </div>
    </div>
  );
}

// ── Table of Contents ──────────────────────────────────────────────────────────
function TableOfContents() {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-20 z-30 mb-16">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <span>Índice</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 border border-white/[0.06] rounded-2xl bg-[#0a0a0a]/98 backdrop-blur-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {chapters.map((ch) => (
            <a
              key={ch.anchor}
              href={`#${ch.anchor}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-4 px-3 py-2 rounded-xl hover:bg-white/[0.04] transition-colors group"
            >
              <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 transition-colors w-5">{ch.number}</span>
              <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 transition-colors">{ch.title}</span>
            </a>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function QuoteBlock({ text }: { text: string }) {
  return (
    <blockquote className="border-l-2 border-white/20 pl-6 py-2 my-8">
      <p className="text-zinc-300 text-base md:text-lg font-thin leading-relaxed italic" dangerouslySetInnerHTML={{ __html: text }} />
    </blockquote>
  );
}

function Pill({ text }: { text: string }) {
  return <span className="inline-block px-3 py-1 rounded-full border border-white/10 text-[9px] uppercase tracking-[0.25em] text-zinc-500">{text}</span>;
}

function PrincipleCard({ number, text }: { number: string; text: string }) {
  return (
    <div className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-3">Principio {number}</p>
      <p className="text-zinc-200 text-sm font-light leading-relaxed">{text}</p>
    </div>
  );
}

function Divider() {
  return <div className="w-full h-px bg-white/[0.04] my-12" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstitutionalBookPage() {
  return (
    <main className="min-h-screen bg-[#080808] text-white relative">
      <GridBg />

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/[0.04] bg-[#080808]/90 backdrop-blur-xl">
        <Link href="/v3" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase tracking-[0.3em]">Pandoras</span>
        </Link>
        <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600">Institutional Book · v1.0</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
          <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Confidencial</span>
        </div>
      </header>

      {/* ═══ COVER ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 pt-32 pb-0 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <div className="mb-24 md:mb-32">
            <Pill text="Pandora's Growth OS" />
            <h1 className="mt-8 text-5xl md:text-7xl font-thin tracking-tight leading-[1.05] text-white">
              Institutional<br />
              <span className="text-zinc-500">Capital</span><br />
              Architecture
            </h1>
            <p className="mt-8 text-zinc-500 text-sm font-light max-w-md leading-relaxed">
              Cómo construir una institución respaldada por activos reales.
            </p>
            <div className="mt-10 flex flex-wrap gap-6 text-[9px] uppercase tracking-[0.3em] text-zinc-700">
              <span>Versión 1.0</span><span>·</span><span>Documento Estratégico</span><span>·</span><span>Uso Interno</span><span>·</span><span>Confidencial</span>
            </div>
          </div>
        </Reveal>
        <Divider />
        <Reveal><TableOfContents /></Reveal>
      </div>

      {/* ═══ MANIFESTO QUOTE 0 ════════════════════════════════════════════════ */}
      <ManifestoQuote text="Institutions are built before they are financed." sub="Pandora's Institutional Book" />

      {/* ═══ CHAPTER 01 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="01" title="Executive Summary" anchor="ch01" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-8">Esta es probablemente la página más importante. Responde una sola pregunta:</p>
          <p className="text-white text-2xl md:text-3xl font-thin leading-relaxed mb-10">¿Qué estamos construyendo?</p>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-6">Pandora's no está construyendo únicamente proyectos inmobiliarios.</p>
          <p className="text-white text-lg font-light leading-relaxed mb-6">Está construyendo una institución.</p>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-10">Una institución cuya fortaleza no depende únicamente de los ingresos operativos, sino de la acumulación progresiva de activos estratégicos que fortalecen permanentemente su patrimonio.</p>
        </Reveal>
        <Reveal delay={0.1}>
          {/* Visual: three pillars */}
          <div className="grid grid-cols-3 gap-4 my-10">
            {[
              { label: 'Cada proyecto', value: 'incrementa el valor del ecosistema', icon: '▲' },
              { label: 'Cada activo', value: 'fortalece el balance', icon: '◆' },
              { label: 'Cada flujo', value: 'financia nuevos proyectos', icon: '●' },
            ].map((item) => (
              <div key={item.label} className="border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01] flex flex-col gap-3">
                <span className="text-zinc-700 text-xs">{item.icon}</span>
                <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-600">{item.label}</p>
                <p className="text-zinc-300 text-xs font-light leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-400 text-sm font-light leading-relaxed">
            La visión consiste en construir una plataforma institucional respaldada por activos reales, tecnología propia y una arquitectura financiera diseñada para permanecer durante décadas.
          </p>
        </Reveal>
      </div>

      {/* ═══ CHAPTER 02 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="02" title="Nuestra Filosofía" anchor="ch02" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="border border-white/[0.04] rounded-2xl p-8 bg-white/[0.01]">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4">Modelo tradicional</p>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">Vive de <strong className="text-zinc-300 font-light">vender</strong> constantemente para sobrevivir.</p>
            </div>
            <div className="border border-zinc-700/40 rounded-2xl p-8 bg-white/[0.02]">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-4">Pandora's</p>
              <p className="text-zinc-200 text-sm font-light leading-relaxed">Vive de <strong className="text-white font-light">poseer</strong>. Construye patrimonio que genera flujo que financia nuevos activos.</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Principios Institucionales</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PrincipleCard number="1" text="Los activos sobreviven más que los ingresos." />
            <PrincipleCard number="2" text="El patrimonio es más importante que la utilidad anual." />
            <PrincipleCard number="3" text="Cada proyecto debe fortalecer el Balance Sheet. Nunca debilitarlo." />
            <PrincipleCard number="4" text="La liquidez debe construirse sobre activos reales. Nunca sobre deuda innecesaria." />
            <PrincipleCard number="5" text="La confianza institucional nace del patrimonio. No del marketing." />
          </div>
        </Reveal>
      </div>

      {/* ═══ CHAPTER 03 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="03" title="El Problema del Modelo Tradicional" anchor="ch03" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <p className="text-zinc-500 text-sm font-light leading-relaxed mb-12 italic">Una crítica elegante. Sin ataques. Solo explicación.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Cómo funciona normalmente</p>
              <VisualFlow nodes={[
                { label: 'Empresa' },
                { label: 'Construye proyecto' },
                { label: 'Vende' },
                { label: 'Reparte utilidad' },
                { label: 'Empieza desde cero', sub: 'Otra vez.' },
              ]} />
              <p className="mt-6 text-zinc-600 text-xs font-light leading-relaxed">El patrimonio prácticamente desaparece. No existe crecimiento compuesto.</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-6">Nuestro modelo</p>
              <VisualFlow nodes={[
                { label: 'Proyecto' },
                { label: 'Genera utilidad' },
                { label: 'Fortalece reservas' },
                { label: 'Balance Sheet crece' },
                { label: 'Nuevos proyectos', sub: 'Patrimonio permanente' },
              ]} />
              <p className="mt-6 text-zinc-300 text-xs font-light leading-relaxed">Crecimiento institucional compuesto.</p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ═══ MANIFESTO QUOTE 1 ════════════════════════════════════════════════ */}
      <ManifestoQuote text="Trust compounds faster than capital." sub="Pandora's Capital Architecture" />

      {/* ═══ CHAPTER 04 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="04" title="Nuestra Tesis" anchor="ch04" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <QuoteBlock text="No desarrollamos únicamente proyectos.<br/>Construimos una institución capaz de desarrollar proyectos <em>durante generaciones</em>." />
          <div className="flex flex-wrap gap-3 my-10">
            {['Capacidad financiera', 'Credibilidad', 'Liquidez', 'Acceso a capital', 'Estabilidad', 'Resiliencia'].map((item) => (
              <span key={item} className="px-4 py-2 border border-white/[0.08] rounded-full text-[11px] text-zinc-300 font-light">{item}</span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">El ciclo completo</p>
          <VisualFlow nodes={[
            { label: 'Proyecto' },
            { label: 'Utilidad' },
            { label: 'Institutional Reserve' },
            { label: 'Balance Sheet' },
            { label: 'Mayor capacidad financiera' },
            { label: 'Nuevos proyectos' },
            { label: 'Mayor patrimonio' },
            { label: 'Mayor confianza' },
            { label: 'Mayor escala' },
          ]} />
        </Reveal>
        <Reveal delay={0.2}>
          <QuoteBlock text="Las empresas crean ingresos.<br/>Las instituciones crean patrimonio.<br/><strong class='not-italic font-light text-white'>Pandora's está diseñada para construir patrimonio.</strong>" />
        </Reveal>
      </div>

      {/* ═══ CHAPTER 05 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="05" title="Arquitectura Corporativa" anchor="ch05" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-4">Una arquitectura diseñada para permanecer.</p>
          <p className="text-zinc-500 text-sm font-light leading-relaxed mb-10">No existe una empresa. Existe un ecosistema de entidades especializadas.</p>
          <EntityDiagram />
        </Reveal>
        <Reveal delay={0.1}>
          <QuoteBlock text="No concentramos el riesgo. Lo distribuimos.<br/>No concentramos los activos. Los organizamos." />
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4 mt-10">Vehículos futuros (SPV)</p>
          <SPVTree />
          <p className="mt-4 text-zinc-600 text-xs font-light italic">No estamos creando empresas. Estamos creando vehículos.</p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4 mt-12">Cuando un activo madura — cuatro opciones</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'A', text: 'Mantener', sub: 'Flujo permanente' },
              { label: 'B', text: 'Refinanciar', sub: 'Liberar capital, conservar activo' },
              { label: 'C', text: 'Garantía', sub: 'Apalancar nuevos proyectos' },
              { label: 'D', text: 'Capitalizar', sub: 'Sin perder el control' },
            ].map((opt) => (
              <div key={opt.label} className="border border-white/[0.06] rounded-xl p-4 text-center">
                <p className="text-zinc-700 text-xs mb-2">Opción {opt.label}</p>
                <p className="text-zinc-200 text-sm font-light mb-1">{opt.text}</p>
                <p className="text-zinc-600 text-[10px] font-light">{opt.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-zinc-600 text-xs font-light italic text-center">Vender no aparece como primera opción.</p>
        </Reveal>
      </div>

      {/* ═══ MANIFESTO QUOTE 2 ════════════════════════════════════════════════ */}
      <ManifestoQuote text="Every asset begins as a decision." sub="Institutional Capital Architecture" />

      {/* ═══ CHAPTER 06 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="06" title="Institutional Reserve" anchor="ch06" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <p className="text-white text-2xl font-thin mb-2">No acumulamos efectivo.</p>
          <p className="text-zinc-400 text-sm font-light mb-2">Acumulamos activos productivos.</p>
          <p className="text-zinc-600 text-xs font-light mb-12">Porque el efectivo pierde valor. Los activos bien administrados generan valor.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { cat: 'Real Estate', items: ['Departamentos', 'Hoteles', 'Terrenos', 'Edificios'] },
              { cat: 'Participaciones', items: ['SPV', 'Joint Ventures', 'Strategic Equity'] },
              { cat: 'Infraestructura', items: ['Plataformas tech', 'Software', 'IP'] },
              { cat: 'Financieros', items: ['Bonos (futuro)', 'Instrumentos inst.', 'Reservas'] },
            ].map((cat) => (
              <div key={cat.cat} className="border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01]">
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-3">{cat.cat}</p>
                {cat.items.map((item) => <p key={item} className="text-zinc-400 text-xs font-light py-0.5">{item}</p>)}
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <QuoteBlock text="Institutional Reserve no busca especular.<br/><strong class='not-italic font-light text-white'>Busca permanecer.</strong>" />
          <ReserveTable />
        </Reveal>
        <Reveal delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { num: '1', title: 'Fortalecer el Balance Sheet', desc: 'Cada nuevo activo incrementa el patrimonio institucional.' },
              { num: '2', title: 'Incrementar la confianza', desc: 'Los inversionistas observan activos reales. No únicamente promesas.' },
              { num: '3', title: 'Expandir la capacidad', desc: 'Cada activo incrementa la capacidad para nuevos proyectos.' },
            ].map((obj) => (
              <div key={obj.num} className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01]">
                <p className="text-3xl font-thin text-zinc-700 mb-4">{obj.num}</p>
                <p className="text-zinc-300 text-sm font-light mb-2">{obj.title}</p>
                <p className="text-zinc-600 text-xs font-light leading-relaxed">{obj.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ═══ CHAPTER 07 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="07" title="Capital Flow Architecture" anchor="ch07" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <QuoteBlock text="El capital no termina cuando entra.<br/>Comienza un nuevo ciclo." />
          <CapitalStages />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
            <div className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01]">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4">Capital Appreciation</p>
              <p className="text-zinc-300 text-sm font-light leading-relaxed">Incremento del valor patrimonial del activo conforme madura.</p>
            </div>
            <div className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01]">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4">Operating Cash Flow</p>
              <p className="text-zinc-300 text-sm font-light leading-relaxed">Ingresos de la operación: Airbnb, Hotel, Rentas, Hospitality.</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Capital Recursion</p>
          <VisualFlow nodes={[
            { label: 'Capital' },
            { label: 'Activo' },
            { label: 'Flujo' },
            { label: 'Nuevo Activo' },
            { label: 'Más Patrimonio' },
            { label: 'Mayor Balance Sheet' },
            { label: 'Mayor Capacidad' },
            { label: 'Capital nuevamente' },
          ]} />
          <QuoteBlock text="El verdadero activo de Pandora's no es un edificio.<br/><strong class='not-italic font-light text-white'>Es la capacidad de convertir capital en patrimonio de forma repetible durante décadas.</strong>" />
        </Reveal>
      </div>

      {/* ═══ MANIFESTO QUOTE 3 ════════════════════════════════════════════════ */}
      <ManifestoQuote text="The architecture of trust is invisible until you need it." sub="Institutional Trust Architecture" />

      {/* ═══ CHAPTER 08 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="08" title="Institutional Trust Architecture" anchor="ch08" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <QuoteBlock text="La confianza no depende de las personas.<br/>Depende del sistema." />
          <TrustStack />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-10">
            {[
              { layer: 'Capa 1 · Legal', desc: 'Separación de responsabilidades entre entidades. Riesgos distribuidos.' },
              { layer: 'Capa 2 · Governance', desc: 'Reglas, contratos y procesos. Decisiones que no dependen de una sola persona.' },
              { layer: 'Capa 3 · Operations', desc: 'Growth OS: documentación, procesos, reporting. Todo queda registrado.' },
              { layer: 'Capa 4 · Technology', desc: 'Blockchain como infraestructura. Trazabilidad e integridad.' },
              { layer: 'Capa 5 · Documentation', desc: 'La institución no depende de conversaciones. Depende de evidencia.' },
              { layer: 'Capa 6 · Assets', desc: 'Cada activo fortalece la institución. Patrimonio verificable.' },
              { layer: 'Capa 7 · Transparency', desc: 'Todo inversionista puede revisar contratos, estructura y reportes.' },
            ].map((l) => (
              <div key={l.layer} className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.01]">
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-2">{l.layer}</p>
                <p className="text-zinc-400 text-xs font-light leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
          <div className="border border-white/10 rounded-2xl p-8 bg-white/[0.01]">
            <p className="text-zinc-300 text-sm font-light leading-relaxed mb-4">Toda nueva capa del ecosistema debe incrementar una de estas variables:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Transparencia', 'Gobernanza', 'Patrimonio', 'Escalabilidad'].map((v) => (
                <div key={v} className="border border-white/[0.08] rounded-xl px-4 py-3 text-center">
                  <span className="text-zinc-300 text-xs font-light">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <QuoteBlock text="La confianza no es un documento. No es una promesa.<br/><strong class='not-italic font-light text-white'>Es el resultado natural de una arquitectura diseñada para permanecer durante décadas.</strong>" />
        </Reveal>
      </div>

      {/* ═══ CHAPTER 09 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="09" title="Participant Architecture" anchor="ch09" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <QuoteBlock text="Participar no significa únicamente aportar capital.<br/>Significa formar parte de una infraestructura patrimonial." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {[
              { type: 'Capital Participants', desc: 'Construyen patrimonio mediante activos productivos. Acompañan el crecimiento.' },
              { type: 'Developers', desc: 'Aportan activos: terrenos, hoteles, infraestructura, IP, negocios.' },
              { type: 'Growth Partners', desc: 'No venden productos. Construyen confianza, educan, conectan oportunidades.' },
              { type: 'Service Providers', desc: 'Arquitectos, abogados, ingenieros, operadores. Todos fortalecen el ecosistema.' },
              { type: 'Institutional Partners', desc: 'Fondos, OTC, proveedores tecnológicos, aliados estratégicos.' },
            ].map((p) => (
              <div key={p.type} className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01]">
                <p className="text-zinc-200 text-sm font-light mb-2">{p.type}</p>
                <p className="text-zinc-500 text-[11px] font-light leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4">Evolución de un participante</p>
          <VisualFlow vertical={false} nodes={[
            { label: 'Participant' },
            { label: 'Investor' },
            { label: 'Growth Partner' },
            { label: 'Developer' },
            { label: 'Institutional' },
          ]} />
          <QuoteBlock text="Un cliente realiza una transacción.<br/><strong class='not-italic font-light text-white'>Un participante construye una institución.</strong>" />
        </Reveal>
      </div>

      {/* ═══ MANIFESTO QUOTE 4 ════════════════════════════════════════════════ */}
      <ManifestoQuote text="The greatest institutions are not remembered for what they built — but for what they left standing." sub="Pandora's 2035" />

      {/* ═══ CHAPTER 10 ══════════════════════════════════════════════════════ */}
      <ChapterSplash number="10" title="Pandora's 2035" anchor="ch10" />
      <div className="relative z-10 py-24 px-6 md:px-12 max-w-3xl mx-auto">
        <Reveal>
          <div className="my-10 border border-white/[0.06] rounded-3xl p-10 bg-white/[0.01]">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6 text-center">Nuestra Visión</p>
            <p className="text-zinc-200 text-base md:text-lg font-thin leading-relaxed text-center max-w-xl mx-auto">
              Convertirnos en la infraestructura patrimonial que permita transformar activos reales en oportunidades de participación institucional accesibles, transparentes y escalables.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mb-12">
            {['Desarrollos inmobiliarios', 'Hoteles boutique', 'Propiedades vacacionales', 'Tierra estratégica', 'Infraestructura productiva', 'Proyectos tecnológicos', 'Propiedad intelectual', 'Empresas privadas'].map((item) => (
              <span key={item} className="px-3 py-1.5 border border-white/[0.06] rounded-full text-[10px] text-zinc-400 font-light">{item}</span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">El efecto compuesto</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-12">
            {[
              { label: 'Proyecto exitoso', note: 'fortalece →' },
              { label: 'Reputación', note: 'construye →' },
              { label: 'Comunidad', note: 'financia →' },
              { label: 'Siguiente proyecto', note: '' },
            ].map((item, i) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="border border-white/[0.06] rounded-xl p-4 text-center bg-white/[0.01]">
                  <p className="text-zinc-300 text-xs font-light">{item.label}</p>
                </div>
                {item.note && <p className="text-zinc-700 text-[10px] text-center">{item.note}</p>}
              </div>
            ))}
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Principios Permanentes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-16">
            {[
              'Transparencia antes que complejidad.',
              'Patrimonio antes que especulación.',
              'Arquitectura antes que improvisación.',
              'Instituciones antes que individuos.',
              'Largo plazo antes que resultados inmediatos.',
            ].map((p) => (
              <div key={p} className="flex items-center gap-3 border border-white/[0.04] rounded-xl px-4 py-3">
                <div className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                <p className="text-zinc-400 text-xs font-light">{p}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* ═══ FINAL PAGE ══════════════════════════════════════════════════════ */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-white/[0.02]" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-white/[0.02]" />
          <div className="absolute w-[200px] h-[200px] rounded-full border border-white/[0.02]" />
        </div>
        <Reveal className="relative z-10">
          <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-700 mb-10">Pandora's Growth OS</p>
          <h2 className="text-4xl md:text-6xl font-thin tracking-tight text-white mb-4">
            Building Institutional Infrastructure
          </h2>
          <p className="text-zinc-500 text-lg md:text-xl font-thin mb-16">for the Next Generation.</p>
          <div className="max-w-md mx-auto border border-white/[0.04] rounded-2xl p-8 bg-white/[0.01] mb-12">
            <p className="text-zinc-500 text-sm font-thin leading-relaxed italic">
              "Las oportunidades pueden aparecer y desaparecer.<br />
              Los mercados cambian. La tecnología evoluciona.<br />
              Pero las instituciones capaces de adaptarse y permanecer<br />
              son las que terminan definiendo una generación."
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/v3" className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-full text-[10px] uppercase tracking-[0.25em] text-zinc-400 hover:text-white hover:border-white/30 transition-all">
              <ArrowLeft className="w-3 h-3" />
              Volver al inicio
            </Link>
            <Link href="https://dash.pandoras.finance/access" className="flex items-center gap-2 px-6 py-3 bg-white rounded-full text-[10px] uppercase tracking-[0.25em] text-black hover:bg-zinc-200 transition-all">
              Acceder a Pandoras
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

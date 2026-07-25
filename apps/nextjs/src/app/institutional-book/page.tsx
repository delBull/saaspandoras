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
  { number: '10', title: 'Pandora\'s 2035', anchor: 'ch10' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
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
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }}
    />
  );
}

function Divider() {
  return <div className="w-full h-px bg-white/[0.05] my-16 md:my-24" />;
}

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full border border-white/10 text-[9px] uppercase tracking-[0.25em] text-zinc-500">
      {text}
    </span>
  );
}

function FlowDiagram({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-col items-start gap-0 pl-4 border-l border-white/10">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-start">
          <span className="text-sm text-zinc-200 py-2 font-light">{step}</span>
          {i < steps.length - 1 && (
            <span className="text-zinc-700 text-xs pl-1">↓</span>
          )}
        </div>
      ))}
    </div>
  );
}

function PrincipleCard({ number, text }: { number: string; text: string }) {
  return (
    <div className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
      <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-3">Principio {number}</p>
      <p className="text-zinc-200 text-sm font-light leading-relaxed">{text}</p>
    </div>
  );
}

function QuoteBlock({ text }: { text: string }) {
  return (
    <blockquote className="border-l-2 border-white/20 pl-6 py-2 my-8">
      <p className="text-zinc-300 text-lg md:text-xl font-thin leading-relaxed italic"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </blockquote>
  );
}

function ChapterHeader({ number, title, anchor }: { number: string; title: string; anchor: string }) {
  return (
    <div id={anchor} className="mb-12 scroll-mt-24">
      <p className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 mb-4">Capítulo {number}</p>
      <h2 className="text-3xl md:text-4xl font-thin tracking-tight text-white">{title}</h2>
    </div>
  );
}

// ─── Table of Contents ────────────────────────────────────────────────────────

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
          className="mt-4 border border-white/[0.06] rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-2"
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

      {/* Content */}
      <div className="relative z-10 pt-32 pb-32 px-6 md:px-12 max-w-3xl mx-auto">

        {/* ── Cover ── */}
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
              <span>Versión 1.0</span>
              <span>·</span>
              <span>Documento Estratégico</span>
              <span>·</span>
              <span>Uso Interno</span>
              <span>·</span>
              <span>Confidencial</span>
            </div>
          </div>
        </Reveal>

        <Divider />

        {/* ── Table of Contents ── */}
        <Reveal>
          <TableOfContents />
        </Reveal>

        <Divider />

        {/* ── Chapter 01 ── */}
        <Reveal>
          <ChapterHeader number="01" title="Executive Summary" anchor="ch01" />
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-8">
            Esta es probablemente la página más importante. Responde una sola pregunta:
          </p>
          <p className="text-zinc-200 text-2xl md:text-3xl font-thin leading-relaxed mb-10">
            ¿Qué estamos construyendo?
          </p>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-6">
            Pandora's no está construyendo únicamente proyectos inmobiliarios.
          </p>
          <p className="text-white text-base font-light leading-relaxed mb-6">
            Está construyendo una institución.
          </p>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-6">
            Una institución cuya fortaleza no depende únicamente de los ingresos operativos, sino de la acumulación progresiva de activos estratégicos que fortalecen permanentemente su patrimonio.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-10">
            {[
              { label: 'Cada proyecto', value: 'incrementa el valor del ecosistema' },
              { label: 'Cada activo', value: 'fortalece el balance' },
              { label: 'Cada flujo', value: 'financia nuevos proyectos' },
            ].map((item) => (
              <div key={item.label} className="border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01]">
                <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-600 mb-2">{item.label}</p>
                <p className="text-zinc-300 text-sm font-light">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-zinc-400 text-sm font-light leading-relaxed">
            La visión consiste en construir una plataforma institucional respaldada por activos reales, tecnología propia y una arquitectura financiera diseñada para permanecer durante décadas.
          </p>
        </Reveal>

        <Divider />

        {/* ── Chapter 02 ── */}
        <Reveal>
          <ChapterHeader number="02" title="Nuestra Filosofía" anchor="ch02" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="border border-white/[0.04] rounded-2xl p-8 bg-white/[0.01]">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4">Modelo tradicional</p>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">Vive de vender constantemente para sobrevivir.</p>
            </div>
            <div className="border border-zinc-700/40 rounded-2xl p-8 bg-white/[0.02]">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-4">Pandora's</p>
              <p className="text-zinc-200 text-sm font-light leading-relaxed">Vive de poseer. Construye patrimonio que genera flujo que financia nuevos activos.</p>
            </div>
          </div>

          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-12">
            Pandora's pretende convertirse en una institución patrimonial, no únicamente en una empresa tecnológica.
          </p>

          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Principios Institucionales</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PrincipleCard number="1" text="Los activos sobreviven más que los ingresos." />
            <PrincipleCard number="2" text="El patrimonio es más importante que la utilidad anual." />
            <PrincipleCard number="3" text="Cada proyecto debe fortalecer el Balance Sheet. Nunca debilitarlo." />
            <PrincipleCard number="4" text="La liquidez debe construirse sobre activos reales. Nunca sobre deuda innecesaria." />
            <PrincipleCard number="5" text="La confianza institucional nace del patrimonio. No del marketing." />
          </div>
        </Reveal>

        <Divider />

        {/* ── Chapter 03 ── */}
        <Reveal>
          <ChapterHeader number="03" title="El Problema del Modelo Tradicional" anchor="ch03" />
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-10 italic">
            Una crítica elegante. Sin ataques. Solo explicación.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Cómo funciona normalmente</p>
              <FlowDiagram steps={['Empresa', 'Construye proyecto', 'Vende', 'Reparte utilidad', 'Empieza desde cero', 'Otra vez.']} />
              <p className="mt-6 text-zinc-600 text-xs font-light leading-relaxed">
                Cada proyecto termina. El patrimonio prácticamente desaparece. No existe crecimiento compuesto.
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-6">Nuestro modelo</p>
              <FlowDiagram steps={['Proyecto', 'Genera utilidad', 'Fortalece reservas', 'Balance Sheet crece', 'Nuevos proyectos', 'Patrimonio permanente']} />
              <p className="mt-6 text-zinc-300 text-xs font-light leading-relaxed">
                Ahora ya existe crecimiento institucional compuesto.
              </p>
            </div>
          </div>
        </Reveal>

        <Divider />

        {/* ── Chapter 04 ── */}
        <Reveal>
          <ChapterHeader number="04" title="Nuestra Tesis" anchor="ch04" />
          <QuoteBlock text="No desarrollamos únicamente proyectos.<br/>Construimos una institución capaz de desarrollar proyectos <em>durante generaciones</em>." />

          <p className="text-zinc-500 text-sm font-light mb-6">Cada activo incorporado incrementa:</p>
          <div className="flex flex-wrap gap-3 mb-12">
            {['Capacidad financiera', 'Credibilidad', 'Liquidez', 'Acceso a capital', 'Estabilidad', 'Resiliencia'].map((item) => (
              <span key={item} className="px-4 py-2 border border-white/[0.08] rounded-full text-[11px] text-zinc-300 font-light">
                {item}
              </span>
            ))}
          </div>

          <div className="border border-white/[0.06] rounded-2xl p-8 bg-white/[0.01]">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">El ciclo completo</p>
            <FlowDiagram steps={['Proyecto', 'Utilidad', 'Institutional Reserve', 'Balance Sheet', 'Mayor capacidad financiera', 'Nuevos proyectos', 'Mayor patrimonio', 'Mayor confianza', 'Mayor escala']} />
          </div>

          <QuoteBlock text="Las empresas crean ingresos.<br/>Las instituciones crean patrimonio.<br/><strong class='not-italic font-light text-white'>Pandora's está diseñada para construir patrimonio.</strong>" />
        </Reveal>

        <Divider />

        {/* ── Chapter 05 ── */}
        <Reveal>
          <ChapterHeader number="05" title="Arquitectura Corporativa" anchor="ch05" />
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-4">
            Una arquitectura diseñada para permanecer.
          </p>
          <p className="text-zinc-500 text-sm font-light leading-relaxed mb-12">
            Pandora's fue diseñada con una filosofía diferente. No existe una empresa. Existe un ecosistema de entidades especializadas. Cada una tiene una función muy específica.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              { name: "Pandora's LLC", location: 'Wyoming', role: 'Tecnología · IP · Marca · Contratos · Growth OS' },
              { name: 'MXHUB S.A.', location: 'México', role: 'Operación · Comercial · Desarrollo · Servicios' },
              { name: 'Aztecaz Hub SAPI', location: 'Real Estate', role: 'SPV · Proyectos · Activos · Coinversiones' },
            ].map((entity) => (
              <div key={entity.name} className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                <p className="text-white text-sm font-light mb-1">{entity.name}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-4">{entity.location}</p>
                <p className="text-zinc-500 text-xs font-light leading-relaxed">{entity.role}</p>
              </div>
            ))}
          </div>

          <QuoteBlock text="No concentramos el riesgo. Lo distribuimos.<br/>No concentramos los activos. Los organizamos." />

          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">¿Qué es un SPV?</p>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-6">
            Un SPV (Special Purpose Vehicle) es una entidad creada exclusivamente para contener un activo o proyecto específico. Su propósito principal consiste en aislar riesgos. Cada SPV tiene sus propios activos, contratos, ingresos, gastos y contabilidad.
          </p>

          <div className="border border-white/[0.06] rounded-2xl p-8 bg-white/[0.01]">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Vehículos futuros</p>
            <div className="flex flex-wrap gap-2">
              {["SPV S'Narai", 'SPV Vista Horizonte', 'SPV Hotel Boutique', 'SPV Luxury Villas', 'SPV Asset Reserve', 'SPV Hospitality', 'SPV Commercial Assets'].map((spv) => (
                <span key={spv} className="px-3 py-1.5 border border-white/[0.06] rounded-full text-[10px] text-zinc-400 font-light">{spv}</span>
              ))}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Opción A', text: 'Mantenerlo. Flujo permanente.' },
              { label: 'Opción B', text: 'Refinanciarlo. Liberar capital, conservar activo.' },
              { label: 'Opción C', text: 'Usarlo como garantía. Apalancar nuevos proyectos.' },
              { label: 'Opción D', text: 'Capitalizarlo. Sin perder el control.' },
            ].map((opt) => (
              <div key={opt.label} className="border border-white/[0.06] rounded-xl p-4">
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-2">{opt.label}</p>
                <p className="text-zinc-400 text-xs font-light leading-relaxed">{opt.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-zinc-600 text-xs font-light italic">Observa que vender no aparece como primera opción.</p>
        </Reveal>

        <Divider />

        {/* ── Chapter 06 ── */}
        <Reveal>
          <ChapterHeader number="06" title="Institutional Reserve" anchor="ch06" />
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-10">
            El patrimonio que sostiene el ecosistema.
          </p>

          <p className="text-white text-2xl font-thin mb-2">No acumulamos efectivo.</p>
          <p className="text-zinc-400 text-sm font-light mb-2">Acumulamos activos productivos.</p>
          <p className="text-zinc-600 text-xs font-light mb-12">Porque el efectivo pierde valor. Los activos bien administrados generan valor.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { cat: 'Activos Inmobiliarios', items: ['Departamentos', 'Hoteles', 'Terrenos', 'Edificios'] },
              { cat: 'Participaciones', items: ['SPV', 'Joint Ventures', 'Strategic Equity'] },
              { cat: 'Infraestructura', items: ['Plataformas tech', 'Software', 'Propiedad intelectual'] },
              { cat: 'Activos Financieros', items: ['Bonos (futuro)', 'Instrumentos inst.', 'Reservas'] },
            ].map((cat) => (
              <div key={cat.cat} className="border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01]">
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-3">{cat.cat}</p>
                {cat.items.map((item) => (
                  <p key={item} className="text-zinc-400 text-xs font-light py-0.5">{item}</p>
                ))}
              </div>
            ))}
          </div>

          <QuoteBlock text="Institutional Reserve no busca especular.<br/><strong class='not-italic font-light text-white'>Busca permanecer.</strong>" />

          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Tres objetivos</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
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

          <div className="border border-white/[0.06] rounded-2xl p-8 bg-white/[0.01]">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4">El primer activo</p>
            <p className="text-zinc-300 text-sm font-light leading-relaxed mb-4">
              Un departamento frente al mar ubicado en la Riviera Nayarit. Activo estabilizado con ingresos mediante renta vacacional.
            </p>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-thin text-white">USD 450,000</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">Valor inicial</span>
            </div>
          </div>

          <div className="mt-8 border border-white/[0.06] rounded-2xl p-8">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Visión futura del Reserve</p>
            <div className="space-y-2">
              {[
                { label: 'Hospitality Assets', value: '$3.8M' },
                { label: 'Residential Assets', value: '$6.2M' },
                { label: 'Strategic Land', value: '$2.1M' },
                { label: 'Technology Assets', value: '$1.5M' },
                { label: 'Corporate Equity', value: '$4.3M' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/[0.04]">
                  <span className="text-zinc-500 text-xs font-light">{row.label}</span>
                  <span className="text-zinc-300 text-sm font-light">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4">
                <span className="text-zinc-400 text-xs uppercase tracking-[0.2em]">Total Institutional Reserve</span>
                <span className="text-white text-base font-thin">$17.9M</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Divider />

        {/* ── Chapter 07 ── */}
        <Reveal>
          <ChapterHeader number="07" title="Capital Flow Architecture" anchor="ch07" />
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-10">
            Cómo circula el capital dentro del ecosistema.
          </p>

          <QuoteBlock text="El capital no termina cuando entra.<br/>Comienza un nuevo ciclo." />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-12">
            {[
              { stage: '01', label: 'Captación', desc: 'Capital entra a un proyecto específico. Siempre con contratos y estructura propios.' },
              { stage: '02', label: 'Desarrollo', desc: 'El capital financia exclusivamente el proyecto correspondiente.' },
              { stage: '03', label: 'Estabilización', desc: 'El proyecto deja de consumir capital. Comienza a producirlo.' },
              { stage: '04', label: 'Distribución', desc: 'Flujo distribuido conforme a las reglas definidas para cada vehículo.' },
              { stage: '05', label: 'Reserve', desc: 'Una parte fortalece el patrimonio institucional permanentemente.' },
            ].map((stage, i) => (
              <div key={stage.stage} className="flex flex-col">
                <div className="border border-white/[0.06] rounded-2xl p-5 bg-white/[0.01] flex-1">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-2">Etapa {stage.stage}</p>
                  <p className="text-zinc-200 text-sm font-light mb-3">{stage.label}</p>
                  <p className="text-zinc-500 text-[11px] font-light leading-relaxed">{stage.desc}</p>
                </div>
                {i < 4 && <div className="hidden md:flex justify-center items-center text-zinc-700 text-xs py-2">→</div>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01]">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4">Capital Appreciation</p>
              <p className="text-zinc-300 text-sm font-light leading-relaxed">Incremento del valor patrimonial del activo conforme madura.</p>
            </div>
            <div className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01]">
              <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-4">Operating Cash Flow</p>
              <p className="text-zinc-300 text-sm font-light leading-relaxed">Ingresos derivados de la operación: Airbnb, Hotel, Rentas, Hospitality.</p>
            </div>
          </div>

          <QuoteBlock text="Cada proyecto exitoso hace más fuerte al siguiente." />

          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Capital Recursion</p>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-8">
            El capital deja de comportarse como un recurso finito. Se convierte en un activo capaz de generar nuevos activos. Ese comportamiento produce un crecimiento acumulativo. No lineal.
          </p>

          <QuoteBlock text="El verdadero activo de Pandora's no es un edificio.<br/>No es un software. No es un proyecto.<br/><strong class='not-italic font-light text-white'>Es la capacidad de convertir capital en patrimonio de forma repetible durante décadas.</strong>" />
        </Reveal>

        <Divider />

        {/* ── Chapter 08 ── */}
        <Reveal>
          <ChapterHeader number="08" title="Institutional Trust Architecture" anchor="ch08" />
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-10">
            Cómo diseñamos la confianza desde el origen.
          </p>

          <QuoteBlock text="La confianza no depende de las personas.<br/>Depende del sistema." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {[
              { layer: 'Capa 1', title: 'Legal Architecture', desc: 'Separación de responsabilidades entre entidades. Cada vehículo cumple una función específica. Riesgos distribuidos.' },
              { layer: 'Capa 2', title: 'Governance Architecture', desc: 'Reglas, documentación, contratos y procesos. Decisiones que no dependen de una sola persona.' },
              { layer: 'Capa 3', title: 'Operational Architecture', desc: 'Growth OS administra documentación, procesos, relaciones, proyectos y reporting. Todo queda registrado.' },
              { layer: 'Capa 4', title: 'Technology Architecture', desc: 'Blockchain como infraestructura, no como argumento comercial. Trazabilidad, integridad y automatización.' },
              { layer: 'Capa 5', title: 'Documentation Architecture', desc: 'Cada decisión importante posee documentación. La institución no depende de conversaciones. Depende de evidencia.' },
              { layer: 'Capa 6', title: 'Asset Architecture', desc: 'Cada activo fortalece la institución. Incrementa confianza. Patrimonio verificable documentalmente.' },
              { layer: 'Capa 7', title: 'Transparency Architecture', desc: 'Todo inversionista puede revisar contratos, estructura, procesos, reportes, activos y cronología.' },
            ].map((layer) => (
              <div key={layer.layer} className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 mb-1">{layer.layer}</p>
                <p className="text-zinc-200 text-sm font-light mb-3">{layer.title}</p>
                <p className="text-zinc-500 text-[11px] font-light leading-relaxed">{layer.desc}</p>
              </div>
            ))}
          </div>

          <div className="border border-white/10 rounded-2xl p-8 bg-white/[0.01]">
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Nuestro principio</p>
            <p className="text-zinc-300 text-sm font-light leading-relaxed mb-6">Toda nueva capa del ecosistema debe incrementar una de estas cuatro variables:</p>
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

        <Divider />

        {/* ── Chapter 09 ── */}
        <Reveal>
          <ChapterHeader number="09" title="Participant Architecture" anchor="ch09" />
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-10">
            El papel del participante dentro del ecosistema Pandora's.
          </p>

          <QuoteBlock text="Participar no significa únicamente aportar capital.<br/>Significa formar parte de una infraestructura patrimonial." />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {[
              { type: 'Capital Participants', desc: 'Personas o instituciones que participan en proyectos específicos. Construyen patrimonio mediante activos productivos.' },
              { type: 'Developers', desc: 'Quienes aportan activos: terrenos, hoteles, infraestructura, propiedad intelectual, negocios.' },
              { type: 'Growth Partners', desc: 'No venden productos. Construyen confianza, educan, acompañan y conectan oportunidades.' },
              { type: 'Service Providers', desc: 'Arquitectos, abogados, ingenieros, operadores, administradores. Todos fortalecen el ecosistema.' },
              { type: 'Institutional Partners', desc: 'Empresas, fondos, OTC, proveedores tecnológicos, infraestructura financiera y aliados estratégicos.' },
            ].map((p) => (
              <div key={p.type} className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.01]">
                <p className="text-zinc-200 text-sm font-light mb-2">{p.type}</p>
                <p className="text-zinc-500 text-[11px] font-light leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">Reputation como infraestructura</p>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-12">
            En Pandora's la reputación no es un elemento social. Es infraestructura. Una reputación sólida permite acceder a mejores oportunidades, mayores responsabilidades y programas especiales.
          </p>

          <QuoteBlock text="Un cliente realiza una transacción.<br/><strong class='not-italic font-light text-white'>Un participante construye una institución.</strong>" />
        </Reveal>

        <Divider />

        {/* ── Chapter 10 ── */}
        <Reveal>
          <ChapterHeader number="10" title="Pandora's 2035" anchor="ch10" />
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-4">
            Construyendo la infraestructura patrimonial de la siguiente generación.
          </p>

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

          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-6">El efecto compuesto</p>
          <p className="text-zinc-400 text-sm font-light leading-relaxed mb-4">No solamente existe interés compuesto. También existe confianza compuesta.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Proyecto exitoso', arrow: 'fortalece la' },
              { label: 'Reputación', arrow: 'que fortalece la' },
              { label: 'Comunidad', arrow: 'que financia el' },
              { label: 'Siguiente proyecto', arrow: '' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center gap-2">
                <div className="border border-white/[0.06] rounded-xl p-4 w-full">
                  <p className="text-zinc-300 text-xs font-light">{item.label}</p>
                </div>
                {item.arrow && <p className="text-zinc-700 text-[10px]">{item.arrow} ↓</p>}
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

        {/* ── Final Page ── */}
        <Reveal>
          <div className="mt-16 mb-8 text-center py-24 border-t border-white/[0.04]">
            <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-600 mb-8">Pandora's Growth OS</p>
            <h2 className="text-3xl md:text-4xl font-thin tracking-tight text-white mb-4">
              Building Institutional Infrastructure
            </h2>
            <p className="text-zinc-500 text-base font-thin">for the Next Generation.</p>

            <div className="mt-16 max-w-md mx-auto border border-white/[0.04] rounded-2xl p-8 bg-white/[0.01]">
              <p className="text-zinc-500 text-sm font-thin leading-relaxed italic">
                "Las oportunidades pueden aparecer y desaparecer.<br />
                Los mercados cambian. La tecnología evoluciona.<br />
                Pero las instituciones capaces de adaptarse y permanecer<br />
                son las que terminan definiendo una generación."
              </p>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/v3"
                className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-full text-[10px] uppercase tracking-[0.25em] text-zinc-400 hover:text-white hover:border-white/30 transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                Volver al inicio
              </Link>
              <Link
                href="https://dash.pandoras.finance/access"
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-full text-[10px] uppercase tracking-[0.25em] text-black hover:bg-zinc-200 transition-all"
              >
                Acceder a Pandoras
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Reveal>

      </div>
    </main>
  );
}

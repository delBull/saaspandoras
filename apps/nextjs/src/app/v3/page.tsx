'use client';

import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, ChevronDown, CheckCircle } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dash.pandoras.finance';

const ACCESS_URL = `${DASHBOARD_URL}/accessv2`;

// Pioneer project: S'Narai (slug: snarai)
const PIONEER_PROJECT = {
  slug: 'snarai',
  name: "S'Narai",
  category: 'Inversión Inmobiliaria',
  location: 'Huatulco, México',
  minInvestment: '$500 USD',
  status: 'active' as const,
  phase: 'Fase 1',
  badge: 'PIONEER',
  href: `${DASHBOARD_URL}/accessv2?project=snarai`,
};

const LOCKED_PROJECTS = [
  {
    id: 'protocol-02',
    label: 'PROTOCOLO 02',
    category: 'Rendimientos en Activos Reales',
    timeline: 'Q3 2025',
    hint: 'Solo para miembros activos de la plataforma',
  },
  {
    id: 'protocol-03',
    label: 'PROTOCOLO 03',
    category: 'Fondo de Acceso Temprano',
    timeline: 'Q4 2025',
    hint: 'Acceso por historial acumulado',
  },
];

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Solicita tu lugar',
    description:
      'Conecta tu identidad y accede a los proyectos disponibles en la plataforma. Tu perfil determina las oportunidades más relevantes para ti.',
  },
  {
    number: '02',
    title: 'Elige tu protocolo',
    description:
      'Cada proyecto abre fases de entrada. Quienes llegan antes obtienen condiciones que no volverán a estar disponibles en fases posteriores.',
  },
  {
    number: '03',
    title: 'Participa y acumula ventajas',
    description:
      'Tu historial dentro de Pandoras define tu acceso futuro. Más temprano entres en cada proyecto, mejor posición tienes en el siguiente.',
  },
];

const DIFFERENTIATORS = [
  {
    label: 'Curaduría',
    text: 'No listamos cualquier proyecto. Cada protocolo pasa por un proceso de validación interno antes de abrirse a los inversores de la plataforma.',
  },
  {
    label: 'Timing',
    text: 'El momento de entrada importa más que el monto. Los primeros en cada fase obtienen condiciones que no están disponibles en el mercado abierto.',
  },
  {
    label: 'Acumulación',
    text: 'Cada participación suma. Tu historial en Pandoras te posiciona automáticamente en las oportunidades que vienen después.',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

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

function GridBackground() {
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

function LiveActivity() {
  const [items, setItems] = useState<any[]>([]);
  const [visible, setVisible] = useState(true);

  const walletPool = [
    '0x4f...a2', '0x1c...e9', '0x9a...f4', '0x3d...b1', '0x7e...c5',
    '0x2b...d8', '0x8f...e3', '0x5a...f7', '0x6c...a9', '0x11...b2',
    '0xaa...11', '0xbb...22', '0xcc...33', '0xdd...44', '0xee...55',
    '0xff...66', '0x12...34', '0x56...78', '0x90...ab', '0xcd...ef'
  ];

  const actions = ['solicitó acceso', 'entró en S\'Narai', 'verificó identidad', 'minteó acceso'];

  useEffect(() => {
    const generateItems = () => {
      const shuffled = [...walletPool].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3).map((wallet, i) => ({
        id: Math.random(),
        user: wallet,
        action: actions[Math.floor(Math.random() * actions.length)],
        time: `hace ${Math.floor(Math.random() * 30) + 1}m`
      }));
      setItems(selected);
    };

    generateItems();
    
    // Hide after 15 seconds to clear the landing
    const hideTimer = setTimeout(() => setVisible(false), 15000);
    
    // Rotate every 30 seconds (show again briefly)
    const rotateInterval = setInterval(() => {
      setVisible(true);
      generateItems();
      setTimeout(() => setVisible(false), 8000);
    }, 30000);

    return () => {
      clearTimeout(hideTimer);
      clearInterval(rotateInterval);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed bottom-6 left-6 z-50 hidden sm:block">
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.4, duration: 0.8 }}
                className="flex items-center gap-3 px-4 py-2 border border-white/[0.05] bg-[#080808]/80 backdrop-blur-md rounded-full"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-none">
                  {item.user}
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none">
                  {item.action}
                </span>
                <span className="text-[8px] text-zinc-700 leading-none">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TopBar() {

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 border-b border-white/[0.04] bg-[#080808]/90 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="text-white font-bold tracking-widest text-sm uppercase">
          Pandoras
        </span>
        <span className="text-[8px] text-zinc-600 uppercase tracking-widest hidden sm:block">
          Finance
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        <a
          href="#projects"
          className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          Proyectos
        </a>
        <a
          href="#process"
          className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          Cómo funciona
        </a>
        <a
          href="#why"
          className="text-[11px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
        >
          Por qué Pandoras
        </a>
      </nav>

      <Link
        href={ACCESS_URL}
        className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
      >
        Acceder
        <ArrowRight className="w-3 h-3" />
      </Link>
    </header>
  );
}

function PioneerCard() {
  return (
    <Reveal className="w-full max-w-sm">
      <Link href={PIONEER_PROJECT.href} className="block group">
        <div className="relative border border-zinc-700/60 bg-zinc-950/80 backdrop-blur-sm rounded-2xl p-7 hover:border-white/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.04)]">
          {/* Status bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                Activo — {PIONEER_PROJECT.phase}
              </span>
            </div>
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest border border-zinc-800 px-2 py-0.5 rounded">
              {PIONEER_PROJECT.badge}
            </span>
          </div>

          {/* Project info */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">
              {PIONEER_PROJECT.name}
            </h3>
            <p className="text-zinc-400 text-sm font-medium">
              Activos Reales · Huatulco
            </p>
            <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
              Posición pionera en el primer protocolo inmobiliario tokenizado de la red.
            </p>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between pt-5 border-t border-zinc-800">
            <div>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">
                Inversión desde
              </p>
              <p className="text-white font-bold text-base">
                {PIONEER_PROJECT.minInvestment}
              </p>
            </div>
            <div className="flex items-center gap-2 text-white text-xs font-bold group-hover:gap-3 transition-all">
              <span>Acceder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

function LockedCard({ project }: { project: (typeof LOCKED_PROJECTS)[0] }) {
  return (
    <Reveal className="w-full max-w-sm">
      <div className="relative border border-zinc-800/40 bg-zinc-950/40 rounded-2xl p-7 opacity-70 cursor-default select-none">
        {/* Lock icon */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-zinc-600" />
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
              Próximamente
            </span>
          </div>
          <span className="text-[8px] text-zinc-700 uppercase tracking-widest">
            {project.timeline}
          </span>
        </div>

        {/* Project info */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-zinc-600 mb-1 tracking-tight">
            {project.label}
          </h3>
          <p className="text-zinc-700 text-sm">{project.category}</p>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between pt-5 border-t border-zinc-800/40">
          <p className="text-[10px] text-zinc-700 italic leading-relaxed">
            {project.hint}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.04] py-14 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-white uppercase tracking-widest">
            Pandoras Finance
          </span>
          <span className="text-[9px] text-zinc-600">
            © {new Date().getFullYear()} Pandoras Finance. Todos los derechos reservados.
          </span>
        </div>
        <div className="flex items-center gap-8">
          <Link
            href="/v2/legal/terms"
            className="text-[9px] text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-widest"
          >
            Términos
          </Link>
          <Link
            href="/v2/legal/privacy"
            className="text-[9px] text-zinc-600 hover:text-zinc-300 transition-colors uppercase tracking-widest"
          >
            Privacidad
          </Link>
          <Link
            href={ACCESS_URL}
            className="text-[9px] text-zinc-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            Acceder →
          </Link>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-10 pt-8 border-t border-white/[0.04]">
        <p className="text-[8px] text-zinc-700 leading-relaxed">
          AVISO LEGAL: La información contenida en este sitio es de carácter informativo y no
          constituye asesoramiento financiero, legal o de inversión. La participación en cualquier
          protocolo conlleva riesgos. Pandoras Finance no garantiza rendimientos ni resultados
          específicos. El acceso a ciertas funciones puede estar restringido en determinadas
          jurisdicciones.
        </p>
      </div>
    </footer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function V3Home() {
  return (
    <main className="relative min-h-screen bg-[#080808] text-white overflow-hidden">
      <GridBackground />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-indigo-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-white/[0.015] blur-[140px]" />
      </div>

      <LiveActivity />
      <TopBar />


      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 max-w-4xl"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] tracking-[0.8em] text-zinc-600 uppercase"
          >
            Investment Access Platform
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2.4rem,6vw,5.5rem)] font-bold tracking-tight leading-[1.05] text-white"
          >
            Los mejores proyectos
            <br />
            <span className="text-zinc-400 font-light">no esperan a que los encuentres.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-zinc-400 text-lg max-w-xl mx-auto leading-relaxed font-light"
          >
            Pandoras conecta inversores con oportunidades en activos reales y
            proyectos curados — antes de que lleguen al mercado público.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="#projects"
              className="flex items-center gap-3 px-8 py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors group"
            >
              Ver proyectos disponibles
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#process"
              className="px-8 py-4 border border-zinc-800 text-zinc-400 text-[11px] font-bold uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-all"
            >
              ¿Cómo funciona?
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ delay: 2.5, duration: 2.5, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <ChevronDown className="w-4 h-4 text-zinc-700" />
        </motion.div>
      </section>

      {/* ── PROJECTS ─────────────────────────────────────────────────────────── */}
      <section
        id="projects"
        className="relative z-10 py-32 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase mb-4">
              Protocolos Activos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Lo que hay adentro
            </h2>
            <p className="mt-4 text-zinc-500 max-w-lg mx-auto font-light leading-relaxed">
              Cada proyecto que llega a Pandoras pasa por un proceso de validación
              antes de abrirse a los inversores de la plataforma.
            </p>
          </Reveal>

          {/* Cards grid */}
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-5">
            <PioneerCard />
            {LOCKED_PROJECTS.map((p) => (
              <LockedCard key={p.id} project={p} />
            ))}
          </div>

          <Reveal delay={0.3} className="text-center mt-12">
            <p className="text-[10px] text-zinc-700 uppercase tracking-widest">
              Nuevos protocolos se incorporan trimestralmente.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── PROCESS ──────────────────────────────────────────────────────────── */}
      <section
        id="process"
        className="relative z-10 py-32 px-6 border-t border-white/[0.04]"
      >
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-20">
            <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase mb-4">
              El Proceso
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Cómo funciona
            </h2>
          </Reveal>

          <div className="space-y-12">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.number} delay={i * 0.1}>
                <div className="flex gap-8 items-start group">
                  <div className="shrink-0 w-12 h-12 border border-zinc-800 flex items-center justify-center rounded-xl group-hover:border-zinc-600 transition-colors">
                    <span className="text-[11px] font-black text-zinc-600 tracking-widest">
                      {step.number}
                    </span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-zinc-500 leading-relaxed font-light">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4} className="mt-16 text-center">
            <Link
              href={ACCESS_URL}
              className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors group"
            >
              Solicitar mi lugar
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="mt-4 text-[9px] text-zinc-700 uppercase tracking-widest">
              Los primeros no solo entran antes. Acumulan más.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── WHY PANDORAS ─────────────────────────────────────────────────────── */}
      <section
        id="why"
        className="relative z-10 py-32 px-6 border-t border-white/[0.04]"
      >
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase mb-4">
              Por qué Pandoras
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              No es otra plataforma de inversión.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {DIFFERENTIATORS.map((item, i) => (
              <Reveal key={item.label} delay={i * 0.12}>
                <div className="border border-zinc-800/60 bg-zinc-950/50 rounded-2xl p-8 h-full hover:border-zinc-700 transition-colors duration-500">
                  <div className="flex items-center gap-3 mb-5">
                    <CheckCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed font-light">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-32 px-6 border-t border-white/[0.04]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.018),transparent_70%)] pointer-events-none" />
        <Reveal className="max-w-2xl mx-auto text-center">
          <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase mb-8">
            Decide de qué lado estás
          </p>
          <h2 className="text-[clamp(2rem,5vw,4rem)] font-bold text-white tracking-tight leading-tight mb-6">
            El acceso temprano siempre fue la ventaja.
            <br />
            <span className="text-zinc-500 font-light">
              Ahora tiene una plataforma.
            </span>
          </h2>
          <p className="text-zinc-500 mb-12 font-light leading-relaxed">
            Algunos entran cuando ya es tarde.
            <br />
            Otros entran ahora.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ACCESS_URL}
              className="flex items-center gap-3 px-10 py-5 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-zinc-100 transition-colors group"
            >
              Solicitar mi acceso
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href={`${ACCESS_URL}?returning=true`}
              className="px-8 py-5 border border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest hover:border-zinc-600 hover:text-white transition-all"
            >
              Ya tengo acceso →
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}

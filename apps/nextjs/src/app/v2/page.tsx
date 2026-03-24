'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';

// ── Reusable reveal animation ─────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Scanline overlay ───────────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.4) 1px, rgba(255,255,255,0.4) 2px)',
        backgroundSize: '100% 4px',
      }}
    />
  );
}

// ── Section divider ────────────────────────────────────────────────────────────
function Divider() {
  return <div className="w-px h-16 bg-gradient-to-b from-transparent via-zinc-700 to-transparent mx-auto my-2" />;
}

// ── CTA Button ─────────────────────────────────────────────────────────────────
function CTAButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.04, backgroundColor: '#a3e635', color: '#000' }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="mt-14 px-12 py-5 text-[10px] tracking-[0.5em] uppercase border border-white/30 bg-transparent text-white transition-all duration-300 font-bold"
        style={{ letterSpacing: '0.45em' }}
      >
        {label}
      </motion.button>
    </Link>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="relative z-10 border-t border-zinc-900 py-16 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] tracking-[0.6em] text-zinc-600 uppercase">Pandora&apos;s Protocol</span>
          <span className="text-[9px] tracking-[0.3em] text-zinc-700">© {new Date().getFullYear()} Pandora&apos;s Finance. Todos los derechos reservados.</span>
        </div>

        {/* Legal links */}
        <div className="flex flex-col gap-2 text-right">
          <Link
            href="/v2/legal/terms"
            className="text-[9px] tracking-[0.3em] text-zinc-600 hover:text-zinc-300 transition-colors uppercase"
          >
            Términos y Condiciones
          </Link>
          <Link
            href="/v2/legal/privacy"
            className="text-[9px] tracking-[0.3em] text-zinc-600 hover:text-zinc-300 transition-colors uppercase"
          >
            Política de Privacidad
          </Link>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-5xl mx-auto mt-10 pt-8 border-t border-zinc-900">
        <p className="text-[8px] tracking-wider text-zinc-700 leading-relaxed">
          AVISO LEGAL: La información contenida en este sitio es de carácter informativo y no constituye asesoramiento financiero, legal o de inversión. 
          La participación en cualquier protocolo conlleva riesgos. Pandora&apos;s Finance no garantiza rendimientos ni resultados específicos. 
          El acceso a ciertas funciones puede estar restringido en determinadas jurisdicciones. 
          Al continuar navegando acepta nuestros términos de uso y política de privacidad.
        </p>
      </div>
    </footer>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function V2Home() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <Scanlines />

      {/* Global glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-lime-400/3 blur-[160px]" />
      </div>

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="text-[9px] tracking-[1em] text-zinc-600 uppercase mb-10"
        >
          Pandora&apos;s Protocol
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.3 }}
          className="text-[clamp(3rem,10vw,8rem)] font-thin tracking-[0.15em] uppercase leading-none text-white"
        >
          No es para<br />todos.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-10 text-zinc-500 max-w-lg leading-relaxed text-base font-light"
        >
          Pandora&apos;s no es una plataforma.
          <br />
          Es un sistema donde el acceso define quién entra primero —
          y quién captura el retorno.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <CTAButton href="/v2/waitlist" label="Intentar Entrar" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-5 text-[8px] tracking-[0.5em] text-zinc-700 uppercase"
        >
          Acceso limitado. No garantizado.
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ delay: 3, duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-zinc-700" />
          <span className="text-[7px] tracking-[0.4em] text-zinc-700">SCROLL</span>
        </motion.div>
      </section>

      {/* ── 2. TENSIÓN ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 text-center px-6 max-w-3xl mx-auto">
        <Reveal>
          <p className="text-[clamp(1.8rem,4vw,3rem)] font-thin tracking-wide text-white/80">
            La mayoría entra cuando ya es tarde.
          </p>
        </Reveal>

        <Divider />

        <Reveal delay={0.2}>
          <div className="space-y-3 text-zinc-500 text-lg leading-loose font-light">
            <p>Cuando el capital ya fue asignado.</p>
            <p>Cuando el deal ya cerró.</p>
            <p>Cuando el upside ya fue capturado.</p>
          </div>
        </Reveal>

        <Divider />

        <Reveal delay={0.4}>
          <p className="text-white text-xl font-light tracking-wide">
            Esto existe para cambiar eso.
          </p>
        </Reveal>
      </section>

      {/* ── 3. QUÉ ES ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 text-center px-6 max-w-2xl mx-auto">
        <Reveal>
          <div className="border border-zinc-800 bg-zinc-950/60 backdrop-blur-xl rounded-3xl p-12 space-y-6">
            <p className="text-[9px] tracking-[0.6em] text-zinc-600 uppercase">Definición del sistema</p>
            <div className="space-y-4 text-zinc-400 font-light text-base leading-relaxed">
              <p>No es un dashboard.</p>
              <div className="w-16 h-px bg-zinc-800 mx-auto" />
              <p>No es un marketplace.</p>
              <div className="w-16 h-px bg-zinc-800 mx-auto" />
              <p>No es público.</p>
            </div>
            <div className="pt-4 border-t border-zinc-800 text-zinc-500 text-sm leading-loose">
              <p>Es una capa de acceso que:</p>
              <div className="mt-4 space-y-2 text-zinc-400 text-sm">
                <p>— registra cuándo entraste</p>
                <p>— define tu posición</p>
                <p>— y determina a qué puedes acceder</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── 4. GENESIS ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 text-center px-6 max-w-2xl mx-auto">
        {/* Glow accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

        <Reveal>
          <p className="text-[9px] tracking-[0.6em] text-zinc-600 uppercase mb-8">Genesis</p>
          <p className="text-[clamp(2rem,5vw,3.5rem)] font-thin tracking-wide text-white/90">
            Algunos usuarios<br />no entran.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-6 text-zinc-500 text-lg font-light">Aparecen temprano.</p>
        </Reveal>

        <Divider />

        <Reveal delay={0.5}>
          <p className="text-zinc-400 font-light leading-relaxed">
            El sistema los reconoce.
            <br />
            Y les da acceso antes de que exista competencia.
          </p>
          <p className="mt-8 text-white text-xl font-light">Eso cambia todo.</p>
        </Reveal>
      </section>

      {/* ── 5. LO QUE PASA ADENTRO ──────────────────────────────────────────── */}
      <section className="relative z-10 py-40 px-6 max-w-4xl mx-auto">
        <Reveal>
          <p className="text-[9px] tracking-[0.6em] text-zinc-600 uppercase text-center mb-16">Dentro del sistema</p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'Capital', text: 'Puedes asignar capital al pool interno con reglas claras.' },
            { label: 'Acceso', text: 'Participas en oportunidades privadas no disponibles externamente.' },
            { label: 'Automatizado', text: 'O dejas que el sistema opere por ti de forma controlada.' },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 0.15}>
              <div className="border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm rounded-2xl p-8 h-full hover:border-zinc-600 transition-colors duration-500">
                <p className="text-[9px] tracking-[0.4em] text-zinc-600 uppercase mb-4">— {item.label}</p>
                <p className="text-zinc-400 text-sm leading-relaxed font-light">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.5}>
          <div className="mt-16 text-center space-y-3 text-zinc-600 font-light">
            <p>No todos verán lo mismo.</p>
            <p>No todos obtendrán lo mismo.</p>
          </div>
        </Reveal>
      </section>

      {/* ── 6. FILTRO FINAL / CTA ────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 text-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04),transparent_70%)] pointer-events-none" />

        <Reveal>
          <p className="text-[9px] tracking-[0.6em] text-zinc-700 uppercase">Acceso</p>
          <p className="mt-6 text-4xl md:text-5xl font-thin tracking-wide text-zinc-400">
            No está abierto.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-8 text-2xl font-thin text-white tracking-wide">
            Pero puedes intentar entrar.
          </p>
          <CTAButton href="/v2/waitlist" label="Solicitar Acceso" />
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}

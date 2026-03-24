'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';

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

function Divider() {
  return <div className="w-px h-16 bg-gradient-to-b from-transparent via-zinc-700 to-transparent mx-auto my-2" />;
}

function CTAButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <motion.button
        whileHover={{ scale: 1.04, backgroundColor: '#a3e635', color: '#000' }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="mt-14 px-12 py-5 text-[10px] tracking-[0.5em] uppercase border border-white/30 bg-transparent text-white transition-all duration-300 font-bold"
      >
        {label}
      </motion.button>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-zinc-900 py-16 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] tracking-[0.6em] text-zinc-600 uppercase">Pandora&apos;s Protocol</span>
          <span className="text-[9px] tracking-[0.3em] text-zinc-700">© {new Date().getFullYear()} Pandora&apos;s Finance. Todos los derechos reservados.</span>
        </div>
        <div className="flex flex-col gap-2 text-right">
          <Link href="/v2/legal/terms" className="text-[9px] tracking-[0.3em] text-zinc-600 hover:text-zinc-300 transition-colors uppercase">Términos y Condiciones</Link>
          <Link href="/v2/legal/privacy" className="text-[9px] tracking-[0.3em] text-zinc-600 hover:text-zinc-300 transition-colors uppercase">Política de Privacidad</Link>
        </div>
      </div>
      <div className="max-w-5xl mx-auto mt-10 pt-8 border-t border-zinc-900">
        <p className="text-[8px] tracking-wider text-zinc-700 leading-relaxed">
          AVISO LEGAL: La información contenida en este sitio es de carácter informativo y no constituye asesoramiento financiero, legal o de inversión.
          La participación en cualquier protocolo conlleva riesgos. Pandora&apos;s Finance no garantiza rendimientos ni resultados específicos.
          El acceso a ciertas funciones puede estar restringido en determinadas jurisdicciones.
        </p>
      </div>
    </footer>
  );
}

export default function V2Home() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      <Scanlines />
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
          className="text-[clamp(2.2rem,7vw,6rem)] font-thin tracking-[0.12em] uppercase leading-tight text-white max-w-4xl"
        >
          Capital que entra temprano,<br />decide todo.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-8 text-zinc-400 max-w-xl leading-relaxed text-base font-light"
        >
          Pandora&apos;s no es una plataforma.
          <br />
          Es donde se estructura quién entra primero.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mt-4 text-zinc-500 max-w-lg leading-relaxed text-sm font-light"
        >
          Accede antes que el resto a estructuras reales:
          protocolos, activos y oportunidades que no llegan al público.
          <br />
          <span className="text-zinc-600">Tu acceso está sujeto a revisión.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="flex flex-col items-center"
        >
          <CTAButton href="/v2/waitlist" label="Solicitar Acceso Anticipado" />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-4 text-[8px] tracking-[0.5em] text-zinc-700 uppercase"
          >
            No es registro. Es filtrado.
          </motion.p>
        </motion.div>

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
          <p className="text-white text-xl font-light tracking-wide">Esto existe para cambiar eso.</p>
        </Reveal>
      </section>

      {/* ── 3. ESTRUCTURAS ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 text-center px-6 max-w-2xl mx-auto">
        <Reveal>
          <div className="border border-zinc-800 bg-zinc-950/60 backdrop-blur-xl rounded-3xl p-12 space-y-6">
            <p className="text-[9px] tracking-[0.6em] text-zinc-600 uppercase">Lo que hay adentro</p>
            <p className="text-zinc-300 text-xl font-thin leading-relaxed">
              No estás invirtiendo en productos.
              <br />
              Estás entrando en estructuras.
            </p>
            <div className="pt-4 border-t border-zinc-800 text-zinc-500 text-sm leading-loose space-y-2">
              <p>— Pool interno con ventajas de permanencia</p>
              <p>— Acceso directo a protocolos privados</p>
              <p>— Participación en distribuciones tempranas</p>
            </div>
            <p className="text-zinc-700 text-xs tracking-widest uppercase">Esto no se explica afuera.</p>
          </div>
        </Reveal>
      </section>

      {/* ── 4. GENESIS ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 text-center px-6 max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />
        <Reveal>
          <p className="text-[9px] tracking-[0.6em] text-zinc-600 uppercase mb-8">Genesis</p>
          <p className="text-[clamp(2rem,5vw,3.5rem)] font-thin tracking-wide text-white/90">
            Algunos no entran.<br />Aparecen temprano.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="mt-8 text-zinc-500 text-base font-light leading-relaxed">
            El sistema los reconoce y les da acceso<br />antes de que exista competencia.
          </p>
          <p className="mt-8 text-white text-xl font-light">Eso cambia todo.</p>
        </Reveal>
      </section>

      {/* ── 5. DENTRO ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 px-6 max-w-4xl mx-auto">
        <Reveal>
          <p className="text-[9px] tracking-[0.6em] text-zinc-600 uppercase text-center mb-16">Dentro del sistema</p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: 'Capital', text: 'Asigna capital al pool interno con reglas claras y ventajas de timing.' },
            { label: 'Acceso', text: 'Participa en oportunidades privadas no disponibles externamente.' },
            { label: 'Automatizado', text: 'O deja que el sistema opere por ti de forma controlada.' },
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

      {/* ── 6. CIERRE ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-40 text-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04),transparent_70%)] pointer-events-none" />
        <Reveal>
          <p className="text-2xl md:text-3xl font-thin text-zinc-400 leading-loose">
            Algunos entran.<br />
            Otros observan cuando ya es tarde.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="mt-6 text-xl font-thin text-white tracking-wide">
            Decide de qué lado estás.
          </p>
          <CTAButton href="/v2/waitlist" label="Solicitar Acceso Anticipado" />
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}

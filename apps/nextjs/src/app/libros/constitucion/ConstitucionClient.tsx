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
    <section id={anchor} ref={ref} className="min-h-[50vh] flex flex-col items-center justify-center bg-[#060606] relative overflow-hidden my-12">
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center px-6"
      >
        <p className="text-[10px] uppercase tracking-[0.6em] text-amber-500/70 mb-4">{number}</p>
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
        {sub && <p className="mt-6 text-amber-400/80 text-xs font-light tracking-[0.3em] uppercase">{sub}</p>}
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

export default function ConstitucionClient({ token }: { token: string }) {
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
          <p className="text-[10px] uppercase tracking-[0.7em] text-zinc-600 mb-12">Pandoras Holdings · Institutional Operating Model</p>
          <p className="text-xs uppercase tracking-[0.5em] text-amber-500/90 mb-4">Libro 0</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-6">
            Constitución de Pandoras
          </h1>
          <p className="text-zinc-400 text-sm font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Marco Institucional Invariable, Glosario Constitucional, Reglas de Identidad & Access as a Service (AaaS)
          </p>
        </motion.div>
      </section>

      {/* Preambulo */}
      <Section>
        <Reveal>
          <p className="text-[10px] uppercase tracking-[0.5em] text-amber-500 mb-6">Preámbulo Institucional</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-8">
            Pandoras no fue concebida como una startup, una plataforma tecnológica o un vehículo de inversión.<br />
            Pandoras fue concebida como una institución diseñada para perdurar durante generaciones.
          </p>
          <div className="space-y-4 text-zinc-400 font-light leading-relaxed text-sm">
            <p>
              Su propósito es desarrollar la infraestructura que permita a personas, empresas e instituciones acceder, estructurar, administrar y escalar activos, capital y oportunidades mediante un modelo abierto, modular y tecnológicamente neutral.
            </p>
            <p>
              La presente Constitución constituye la máxima autoridad intelectual del grupo Pandoras. Ninguna política, contrato, producto, sociedad, subsidiaria, licenciatario o decisión estratégica podrá contradecir los principios aquí establecidos.
            </p>
            <p className="text-white font-normal">
              Cuando exista conflicto entre un objetivo de corto plazo y esta Constitución, prevalecerá siempre esta Constitución.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Glosario */}
      <ChapterSplash number="GLOSARIO" title="Glosario Constitucional" anchor="glosario" />
      <Section>
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-amber-400 text-xs font-mono mb-2">Access (Acceso)</p>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">
                Capacidad institucional de permitir que una persona, empresa o institución participe legítimamente en una oportunidad económica mediante la infraestructura de Pandoras.
              </p>
            </div>
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-amber-400 text-xs font-mono mb-2">Strategic Capital (Capital Estratégico)</p>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">
                Conjunto de activos intangibles y tangibles (IP, Código Fuente, Datos, Marcas, Tesorería, Participaciones, Relaciones y Reputación) que concentran el valor del grupo.
              </p>
            </div>
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-amber-400 text-xs font-mono mb-2">Pandoras Holdings</p>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">
                Entidad matriz titular y administradora exclusiva del Patrimonio Estratégico y del sistema de licenciamiento global.
              </p>
            </div>
            <div className="border border-white/[0.06] p-6 rounded-xl bg-white/[0.01]">
              <p className="text-amber-400 text-xs font-mono mb-2">Operating Companies (Compañías Operativas LLC)</p>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">
                Entidades regionales constituidas para ejecutar comercialmente las operaciones bajo Licencia Territorial Exclusiva concedida por el Holding.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Capitulo I */}
      <ChapterSplash number="CAPÍTULO I" title="Identidad, Misión y Visión" anchor="cap1" />
      <Section>
        <Reveal>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg text-white font-normal mb-2">Artículo 1.1 — Naturaleza</h3>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                Pandoras es un Institutional Operating Model (IOM) para la Economía del Acceso. No es una institución financiera, no es un banco, no es un custodio, no es un fondo de inversión ni una desarrolladora inmobiliaria. Pandoras diseña, desarrolla y opera infraestructura tecnológica, jurídica y operativa.
              </p>
            </div>
            <div>
              <h3 className="text-lg text-white font-normal mb-2">Artículo 1.2 — Propósito y Misión</h3>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                El propósito permanente de Pandoras consiste en reducir las barreras históricas que impiden el acceso eficiente al capital, a los activos reales y a las oportunidades de inversión mediante una arquitectura modular, transparente y escalable.
              </p>
            </div>
            <div>
              <h3 className="text-lg text-white font-normal mb-2">Artículo 1.3 — Visión 2035</h3>
              <p className="text-zinc-400 text-sm font-light leading-relaxed">
                Convertirse en la infraestructura institucional de referencia para la Economía del Acceso en América Latina y mercados emergentes, habilitando la tokenización y estructuración de más de $5B USD en activos reales con el estándar de oro de gobernanza.
              </p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Capitulo II */}
      <ChapterSplash number="CAPÍTULO II" title="Access Economy (AaaS)" anchor="cap2" />
      <Section>
        <Reveal>
          <div className="space-y-6 text-zinc-400 text-sm font-light leading-relaxed">
            <p>
              <strong className="text-white font-normal">Artículo 2.1 — La Economía del Acceso:</strong> Pandoras reconoce que la evolución económica contemporánea no depende únicamente de la propiedad de los activos, sino de la capacidad de acceder a ellos de manera eficiente.
            </p>
            <p>
              <strong className="text-white font-normal">Artículo 2.2 — Access as Infrastructure:</strong> Por ello, Pandoras desarrolla modelos denominados Access as a Service (AaaS), mediante los cuales la infraestructura tecnológica y jurídica facilita el acceso programable a oportunidades previamente reservadas para mercados privados.
            </p>
            <p>
              <strong className="text-white font-normal">Artículo 2.3 — Neutralidad Tecnológica:</strong> Pandoras no favorece una tecnología específica. Blockchain, smart contracts, bases de datos tradicionales e inteligencia artificial son herramientas; la arquitectura permanece neutral e independiente.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Capitulo III */}
      <ChapterSplash number="CAPÍTULO III" title="Principios Constitucionales Permanentes" anchor="cap3" />
      <Section>
        <Reveal>
          <div className="space-y-4">
            <div className="p-4 border-l-2 border-amber-500 bg-white/[0.01]">
              <p className="text-white text-sm font-medium">Principio I — Arquitectura sobre Oportunidad</p>
              <p className="text-zinc-400 text-xs font-light mt-1">Nunca se aceptará una oportunidad de negocio que comprometa la arquitectura institucional del grupo.</p>
            </div>
            <div className="p-4 border-l-2 border-amber-500 bg-white/[0.01]">
              <p className="text-white text-sm font-medium">Principio II — Separación de Riesgos</p>
              <p className="text-zinc-400 text-xs font-light mt-1">Los riesgos operativos, jurídicos y comerciales permanecerán separados mediante entidades independientes.</p>
            </div>
            <div className="p-4 border-l-2 border-amber-500 bg-white/[0.01]">
              <p className="text-white text-sm font-medium">Principio III — Titularidad Patrimonial Corporativa</p>
              <p className="text-zinc-400 text-xs font-light mt-1">Pandoras Holdings actúa como la entidad titular y administradora de los activos estratégicos del grupo (IP, marcas, software, tesorería, participaciones, datos).</p>
            </div>
            <div className="p-4 border-l-2 border-amber-500 bg-white/[0.01]">
              <p className="text-white text-sm font-medium">Principio IV — Non-Custodial by Architecture</p>
              <p className="text-zinc-400 text-xs font-light mt-1">Pandoras nunca custodia fondos de clientes ni de inversionistas. El dinero fluye directamente entre emisores e inversionistas.</p>
            </div>
            <div className="p-4 border-l-2 border-amber-500 bg-white/[0.01]">
              <p className="text-white text-sm font-medium">Principio V — Transparencia Cero-Sorpresas</p>
              <p className="text-zinc-400 text-xs font-light mt-1">Todos los costos, comisiones y estructuras legales son explícitos e inmutables antes del checkout.</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Capitulo IV */}
      <ChapterSplash number="CAPÍTULO IV" title="Lo que Pandoras NUNCA Será" anchor="cap4" />
      <Section>
        <Reveal>
          <div className="border border-red-500/20 bg-red-500/[0.02] p-6 rounded-xl space-y-3">
            <p className="text-red-400 text-xs uppercase tracking-widest font-mono">Prohibiciones Permanentes</p>
            <p className="text-zinc-300 text-xs font-light">1. Un custodio de fondos de clientes sin entidad regulada dedicada.</p>
            <p className="text-zinc-300 text-xs font-light">2. Un esquema de captación pública fuera del marco legal aplicable.</p>
            <p className="text-zinc-300 text-xs font-light">3. Una plataforma cuyo valor dependa exclusivamente de la especulación sobre activos digitales.</p>
            <p className="text-zinc-300 text-xs font-light">4. Un intermediario financiero que asuma riesgos crediticios propios.</p>
            <p className="text-zinc-300 text-xs font-light">5. Una organización dependiente de un único proyecto, cliente, jurisdicción o socio.</p>
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote text="Pandoras Holdings acts as the sole owner and manager of the group's strategic assets." sub="Constitutional Principle" />

      {/* Cláusula de Legado */}
      <Section>
        <Reveal>
          <div className="text-center py-12 border-t border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-[0.5em] text-amber-400 mb-4">Cláusula de Legado</p>
            <p className="text-zinc-400 text-xs font-light max-w-2xl mx-auto leading-relaxed italic">
              Pandoras reconoce que toda institución verdaderamente trascendente supera la vida profesional de quienes la fundaron. Cada generación tendrá la obligación de fortalecer aquello que recibió, preservar aquello que no le pertenece individualmente y transmitir una organización más sólida a las futuras generaciones.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Libro 0 · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Galería de Libros
          </a>
          <a href={`/libros/libro-i?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro I: Corporate Charter →
          </a>
        </div>
      </section>
    </main>
  );
}

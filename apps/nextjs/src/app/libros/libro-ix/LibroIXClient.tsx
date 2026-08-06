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
        <p className="text-[10px] uppercase tracking-[0.6em] text-purple-400/80 mb-4">{number}</p>
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
        {sub && <p className="mt-6 text-purple-400/80 text-xs font-light tracking-[0.3em] uppercase">{sub}</p>}
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

export default function LibroIXClient({ token }: { token: string }) {
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
          <p className="text-xs uppercase tracking-[0.5em] text-purple-400/80 mb-4">Libro IX</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-6">
            Hermes Agent OS & Kernel Architecture
          </h1>
          <p className="text-zinc-400 text-sm font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Arquitectura Institucional Cognitiva, Capability Fabric y Edge Artifacts
          </p>
        </motion.div>
      </section>

      <ManifestoQuote
        text="Ningún Runtime de Hermes consume código fuente ni bases de datos transaccionales. Todos los Runtimes consumen únicamente Artefactos Compilados e inmutables."
        sub="Primer Principio de Hermes"
      />

      <ChapterSplash number="01" title="La Arquitectura del Microkernel" anchor="kernel" />
      
      <Section>
        <Reveal>
          <div className="space-y-6 text-zinc-400 font-light leading-relaxed">
            <p>
              El corazón de Hermes no es un LLM. Hermes no es un modelo que genera texto, es un <strong className="text-white">Sistema Operativo Cognitivo</strong> que orquesta decisiones. La arquitectura central es un Microkernel agnóstico y declarativo.
            </p>
            <p>
              A diferencia de arquitecturas tradicionales monolíticas o SDKs estrechamente acoplados a un proveedor de IA (como OpenAI o Anthropic), el Kernel de Hermes fue diseñado bajo el principio de <strong>Capability Fabric</strong>. 
            </p>
            <p>
              El Kernel no sabe <em>cómo</em> hacer las cosas. Solo sabe qué se necesita hacer, buscar en el Capability Registry quién tiene esa capacidad asignada, delegarle la tarea y recibir la decisión.
            </p>
          </div>
        </Reveal>
      </Section>

      <ChapterSplash number="02" title="Capability Fabric & Providers" anchor="fabric" />
      
      <Section>
        <Reveal>
          <div className="space-y-6 text-zinc-400 font-light leading-relaxed">
            <p>
              En lugar de construir SDKs de plugins (donde Hermes dependería del plugin), invertimos el control: Hermes expone <strong className="text-white">Capabilities</strong>. 
            </p>
            <p>
              Una Capability es un contrato estricto: entradas y salidas. Los Providers (Ollama, Claude, Sofía, Pandora's Media) implementan este contrato. El Kernel busca el <code>CapabilityBinding</code> en tiempo de ejecución para saber a quién llamar.
            </p>
            
            <h3 className="text-xl text-white font-thin mt-12 mb-4 tracking-tight">Guía Técnica: ¿Cómo construir un Provider?</h3>
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg font-mono text-sm text-zinc-300">
              <ol className="list-decimal pl-4 space-y-4">
                <li>Define la Capability en el Registry (ej. <code>language.generate</code>).</li>
                <li>Crea un Provider que extienda la clase Base e implemente <code>supports(capability)</code>.</li>
                <li>Implementa <code>execute(input)</code> devolviendo el esquema pactado.</li>
                <li>Registra el Binding (JsonBindingRepository o PostgresBindingRepository) asociando el TenantID a tu Provider.</li>
              </ol>
            </div>
          </div>
        </Reveal>
      </Section>

      <ChapterSplash number="03" title="Artifact Store & Runtime Compiler" anchor="artifacts" />
      
      <Section>
        <Reveal>
          <div className="space-y-6 text-zinc-400 font-light leading-relaxed">
            <p>
              El RuntimeCompiler compila las políticas, configuraciones y bindings de PostgreSQL o JSON hacia <strong className="text-white">Artefactos Inmutables</strong>. 
            </p>
            <p>
              Estos artefactos se almacenan en el <code>ArtifactStore</code>. Cuando llega un Webhook de Telegram al Edge (Vercel Edge Functions), el Kernel se instancia en menos de 5ms consumiendo únicamente el artefacto estático (CompiledRuntimeConfig, CompiledMeshManifest, CompiledContentAST).
            </p>
            <p>
              Esta separación permite que el Dashboard y el Runtime Edge vivan en ecosistemas diferentes sin impactar el rendimiento de inferencia, garantizando un Cold Start casi nulo.
            </p>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}

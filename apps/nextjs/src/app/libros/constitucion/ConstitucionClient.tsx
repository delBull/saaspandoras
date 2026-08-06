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
    <section id={anchor} ref={ref} className="min-h-[30vh] flex flex-col items-center justify-center bg-[#060606] relative overflow-hidden my-12 border-y border-white/[0.04]">
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

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`px-6 py-12 flex flex-col items-center bg-[#060606] ${className}`}>
      <div className="max-w-4xl w-full">{children}</div>
    </section>
  );
}

function Pre({ text }: { text: string }) {
  return (
    <pre className="p-6 bg-[#0a0a0a] border border-white/[0.05] rounded-xl text-zinc-400 font-mono text-xs overflow-x-auto my-6 whitespace-pre">
      {text}
    </pre>
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
          <p className="text-[10px] uppercase tracking-[0.7em] text-zinc-600 mb-12">Pandoras Holdings · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-amber-500/90 mb-4">Version 1.0 (Private)</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-5xl mx-auto leading-[1.05] mb-6">
            Pandora's Institutional Architecture
          </h1>
          <p className="text-zinc-400 text-sm font-light max-w-xl mx-auto mt-6 leading-relaxed">
            Internal Architecture Constitution
          </p>
        </motion.div>
      </section>

      <ChapterSplash number="01" title="Principios Institucionales" anchor="cap1" />
      <Section>
        <Reveal>
          <div className="space-y-4 text-zinc-400 font-light leading-relaxed text-sm">
            <p>Pandora's no es un producto.</p>
            <p>Pandora's es una <strong>Enterprise Infrastructure Platform</strong> diseñada para construir, operar y escalar organizaciones cognitivas.</p>
            <p>Toda la plataforma se divide en capas con responsabilidades únicas. Los principios fundamentales son:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Cada dominio posee una única responsabilidad.</li>
              <li>El Kernel permanece agnóstico.</li>
              <li>Toda integración ocurre mediante contratos estables.</li>
              <li>Los proveedores evolucionan independientemente del Kernel.</li>
              <li>Ninguna aplicación conoce la implementación interna de otra.</li>
              <li>Toda organización es un Tenant.</li>
              <li>Todo comportamiento operativo es Runtime.</li>
              <li>Toda identidad es compilable.</li>
              <li>Todo conocimiento es un Artifact.</li>
              <li>Todo canal es un Adapter.</li>
            </ul>
          </div>
        </Reveal>
      </Section>

      <ChapterSplash number="02" title="Arquitectura Institucional" anchor="cap2" />
      <Section>
        <Reveal>
          <Pre text={`Pandora's Holding
│
├── Governance
├── IP
├── Licensing
├── Treasury
├── Protocols
└── Strategic Management`} />
          <p className="text-zinc-400 font-light text-sm mt-4">La Holding nunca participa en la ejecución. Su responsabilidad es únicamente institucional.</p>
        </Reveal>
      </Section>

      <ChapterSplash number="03" title="Plataformas Estratégicas" anchor="cap3" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Pandora's se divide en plataformas. Cada plataforma posee autonomía.</p>
          <Pre text={`Pandora's
├── Growth OS
├── Media Co
├── Capital
├── Identity Platform (futuro)
├── Marketplace (futuro)
└── Shared Platform`} />
        </Reveal>
      </Section>

      <ChapterSplash number="04" title="Growth OS" anchor="cap4" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Growth OS es la infraestructura comercial. No genera contenido. No tokeniza activos. No administra campañas. Su responsabilidad es proporcionar la infraestructura empresarial.</p>
          <Pre text={`Growth OS
├── Dashboard
├── Organizations
├── Billing
├── Identity
├── Marketplace
├── Installed Products
└── Hermes OS`} />
        </Reveal>
      </Section>

      <ChapterSplash number="05" title="Hermes OS" anchor="cap5" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Hermes constituye el Sistema Operativo Cognitivo. Hermes nunca implementa lógica de negocio. Hermes únicamente: interpreta, decide, orquesta y ejecuta.</p>
          <Pre text={`Hermes OS
Kernel
↓
Control Plane
↓
Workbench
↓
Unified Execution API
↓
Execution Engine
↓
Capability Fabric
↓
Service Registry
↓
Capability Registry
↓
Binding Registry
↓
Artifact Store
↓
Identity Runtime
↓
Intelligence Engine
↓
Legacy Adapter Layer
↓
Channel Adapters`} />
        </Reveal>
      </Section>

      <ChapterSplash number="06" title="Pandora's Media Co" anchor="cap6" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Media Co es una fábrica. No es parte del Kernel. No es parte del Workbench. Media Co es un <strong>Service Provider</strong>. Hermes jamás conoce esta complejidad, únicamente consume sus capacidades.</p>
          <Pre text={`Media Co
Sofía (Chief of Staff)
↓
Research (Minerva)
↓
Creative (Pixel)
↓
Strategy (Atlas)
↓
Campaign Engine
↓
Distribution Engine
↓
Analytics`} />
        </Reveal>
      </Section>

      <ChapterSplash number="07" title="Capital Platform" anchor="cap7" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Capital es la plataforma patrimonial (ej. S'Narai, Vista Horizonte, futuros RWA).</p>
          <Pre text={`Capital
Tokenization
↓
Treasury
↓
Governance
↓
DAO
↓
Payments
↓
Certificates
↓
Holdings
↓
Projects`} />
        </Reveal>
      </Section>

      <ChapterSplash number="08" title="Shared Platform" anchor="cap8" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Aquí viven todos los servicios compartidos. Todas las plataformas utilizan esta capa. Ninguna la implementa nuevamente.</p>
          <Pre text={`Shared Platform
Identity
Organizations
Billing
Provisioning
Notifications
Storage
Marketplace
Licensing
Authentication
Authorization
Secrets
Audit
Telemetry`} />
        </Reveal>
      </Section>

      <ChapterSplash number="09" title="Organizaciones (Multi-Tenant)" anchor="cap9" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Toda organización es un Tenant. Nunca existen configuraciones globales. Todo vive dentro del Runtime del Tenant.</p>
          <Pre text={`Organization
↓
Installed Products
↓
Runtime Manifest
↓
Identity Runtime
↓
Knowledge Runtime
↓
Policy Runtime
↓
Channel Runtime`} />
        </Reveal>
      </Section>

      <ChapterSplash number="10" title="Runtime Manifest" anchor="cap10" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">El Runtime deja de ser únicamente configuración. Es la compilación operativa de un Tenant.</p>
          <Pre text={`Runtime Manifest
Identity Pack
Knowledge Pack
Persona Pack
Behavior Pack
Policy Pack
Tool Pack
Workflow Pack
Skill Pack
Channel Pack
Brand Pack
Voice Pack
Security Pack`} />
        </Reveal>
      </Section>

      <ChapterSplash number="11" title="Service Provider Model" anchor="cap11" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Todo proveedor externo (ej. Pandora's Media Co, OpenAI, Stripe, Adobe Firefly) cumple exactamente la misma arquitectura.</p>
          <Pre text={`Service Provider
↓
Identity
↓
Capability Catalog
↓
Contracts
↓
Execution API
↓
Telemetry
↓
Health
↓
Discovery`} />
        </Reveal>
      </Section>

      <ChapterSplash number="12" title="Capability Fabric" anchor="cap12" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Hermes nunca conoce proveedores. Hermes conoce capacidades. Otro tenant podría resolver exactamente la misma capacidad utilizando otro proveedor.</p>
          <Pre text={`Capability
↓
Binding Resolver
↓
Provider
↓
Execution
↓
Artifact`} />
        </Reveal>
      </Section>

      <ChapterSplash number="13" title="Unified Execution Model" anchor="cap13" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Toda ejecución entra exactamente por el mismo punto. Después de esto todo ocurre dentro del Kernel. No existen caminos especiales.</p>
          <Pre text={`Hermes.execute({
  tenant,
  requester,
  capability,
  context,
  constraints,
  priority
})`} />
        </Reveal>
      </Section>

      <ChapterSplash number="14" title="Channel Architecture" anchor="cap14" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Los canales son completamente "tontos". No contienen lógica. No toman decisiones. No conocen Journeys. Solo traducen I/O.</p>
          <Pre text={`Telegram
↓
WhatsApp
↓
Discord
↓
Voice
↓
Web Widget
↓
Unified Execution API`} />
        </Reveal>
      </Section>

      <ChapterSplash number="15" title="Cognitive Execution Pipeline" anchor="cap15" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">La ejecución completa ocurre siempre igual.</p>
          <Pre text={`Interaction
↓
Intent Resolution
↓
Policy Engine
↓
Memory Resolution
↓
Goal Resolution
↓
Strategy Selection
↓
Capability Resolution
↓
Binding Resolution
↓
Execution
↓
Artifacts
↓
Telemetry
↓
Scheduler
↓
Response`} />
        </Reveal>
      </Section>

      <ChapterSplash number="16" title="Marketplace (Visión v2)" anchor="cap16" />
      <Section>
        <Reveal>
          <p className="text-zinc-400 font-light text-sm mb-4">Pandora's Marketplace con múltiples tipos de recursos. Hermes únicamente instala Packs. Nunca modifica el Kernel.</p>
          <Pre text={`Marketplace
Service Providers
Capability Packs
Knowledge Packs
Persona Packs
Workflow Packs
Tool Packs
Policy Packs`} />
        </Reveal>
      </Section>

      <ChapterSplash number="17" title="Evolución Estratégica" anchor="cap17" />
      <Section>
        <Reveal>
          <Pre text={`Level 1 - Pandora's Holding
↓
Level 2 - Enterprise Platforms
↓
Level 3 - Hermes Cognitive OS
↓
Level 4 - Business Applications
↓
Level 5 - Marketplace Ecosystem`} />
        </Reveal>
      </Section>

      {/* Cláusula de Legado */}
      <Section>
        <Reveal>
          <div className="text-center py-12 border-t border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-[0.5em] text-amber-400 mb-4">ADR-000.5</p>
            <p className="text-zinc-400 text-xs font-light max-w-2xl mx-auto leading-relaxed italic">
              El Kernel de Hermes debe permanecer pequeño, estable, agnóstico e inmutable. Toda evolución funcional del ecosistema debe producirse mediante contratos, proveedores, runtimes y packs instalables, nunca mediante modificaciones al núcleo.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Holdings · Institutional Architecture · {new Date().getFullYear()}
        </p>
      </section>
    </main>
  );
}

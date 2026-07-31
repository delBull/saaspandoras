'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function GridBg() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.018]"
      style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
  );
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
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
      <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} className="text-center px-6">
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
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }} className="text-center max-w-4xl mx-auto">
        <p className="text-3xl md:text-5xl lg:text-6xl font-thin text-white leading-[1.15] tracking-tight">{text}</p>
        {sub && <p className="mt-8 text-zinc-600 text-sm font-light tracking-[0.2em] uppercase">{sub}</p>}
      </motion.div>
    </section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen px-6 py-32 flex flex-col items-center bg-[#080808]">
      <div className="max-w-4xl w-full">{children}</div>
    </section>
  );
}

function Principle({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="flex gap-6 py-8 border-b border-white/[0.05]">
      <p className="text-zinc-800 font-thin text-3xl w-12 flex-shrink-0">{number}</p>
      <div>
        <p className="text-zinc-300 text-sm font-light mb-2">{title}</p>
        <p className="text-zinc-600 text-xs font-light leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function LibroIVClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* Cover */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606]">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 text-center px-6">
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Growth OS · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-zinc-600 mb-4">Libro IV</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Governance
          </h1>
          <p className="text-zinc-600 text-sm font-light max-w-md mx-auto mt-8">
            Riesgos · Auditorías · Controles · Operating Principles · Compliance
          </p>
        </motion.div>
      </section>

      {/* Ch 01: Operating Principles */}
      <ChapterSplash number="01" title="Operating Principles" anchor="ch01" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">01 — Operating Principles</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            Los principios operativos de Pandoras no son aspiracionales. Son restricciones de diseño que guían cada decisión técnica, financiera y legal.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <Principle
            number="01"
            title="Non-Custodial by Design"
            body="Pandoras nunca toca fondos de proyectos ni de inversionistas. No actúa como banco, intermediario financiero ni custodio. Los fondos fluyen directamente entre las partes. Pandoras facilita y documenta, nunca custodia."
          />
          <Principle
            number="02"
            title="Transparency First"
            body="Todos los fees, condiciones y estructuras se muestran de forma explícita antes de cada transacción. No hay cargos ocultos, no hay tarifas sorpresa. El inversionista siempre sabe exactamente qué está pagando."
          />
          <Principle
            number="03"
            title="Compliance by Architecture"
            body="El cumplimiento regulatorio no es un proceso post-facto. Está integrado en la arquitectura del sistema. Ninguna operación puede ejecutarse sin pasar por los controles de validación."
          />
          <Principle
            number="04"
            title="Security is Not Optional"
            body="Cada endpoint, cada ruta, cada API key tiene un propietario. El acceso no autorizado es imposible por diseño, no solo por política. Los backdoors de desarrollo son removidos antes de cualquier despliegue."
          />
          <Principle
            number="05"
            title="Ecosystem Alignment"
            body="Pandoras gana cuando el ecosistema gana. El modelo de Treasury Equity asegura que los incentivos de la plataforma estén perfectamente alineados con el éxito de los proyectos y los inversionistas."
          />
        </Reveal>
      </Section>

      <ManifestoQuote
        text="Trust is not declared. It is designed into the system."
        sub="Governance Philosophy"
      />

      {/* Ch 02: Risk Framework */}
      <ChapterSplash number="02" title="Risk Framework" anchor="ch02" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">02 — Risk Framework</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            Pandoras opera bajo un framework de riesgos con tres vectores principales: riesgo regulatorio, riesgo operacional y riesgo de mercado.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Riesgo Regulatorio',
              color: 'border-amber-500/20',
              items: [
                'Clasificación como SaaS (no IFPE)', 'No captar fondos del público (CNBV)', 'Documentar el modelo non-custodial', 'Asesoría legal en expansión por jurisdicción', 'SAT: estructura de royalties desde Holding',
              ],
            },
            {
              title: 'Riesgo Operacional',
              color: 'border-red-500/20',
              items: [
                'Dependen de RPC de Thirdweb y Blokko', 'Cold start de NeonDB en Vercel', 'Pérdida de acceso a wallet del Project Owner', 'Vulnerabilidades en dependencias (Strix CI)', 'Continuidad operativa con 99.9% SLA objetivo',
              ],
            },
            {
              title: 'Riesgo de Mercado',
              color: 'border-blue-500/20',
              items: [
                'Volatilidad USDC/MXN durante settlement', 'Competidores entrando al segmento RWA', 'Cambios en regulación blockchain México', 'Adopción lenta del inversionista retail', 'Liquidez en mercado secundario (OTC)',
              ],
            },
          ].map((risk, i) => (
            <div key={i} className={`border ${risk.color} border-white/[0.03] rounded-xl p-5 bg-white/[0.01]`}>
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-4">{risk.title}</p>
              <ul className="space-y-2">
                {risk.items.map((item, j) => (
                  <li key={j} className="text-zinc-600 text-xs flex gap-2"><span className="text-zinc-700">·</span>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* Ch 03: Audit & Controls */}
      <ChapterSplash number="03" title="Audit & Controls" anchor="ch03" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">03 — Audit & Controls</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            El sistema de auditoría de Pandoras opera en dos capas: auditoría automatizada continua y revisión manual periódica.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="space-y-4">
            {[
              {
                label: 'Seguridad Continua',
                items: ['Strix security scanner en cada push a main/staging', 'Telegram alerts en tiempo real por hash mismatch', 'Rate limiting con logs de intentos', 'pnpm audit en CI/CD pipeline'],
              },
              {
                label: 'Auditoría de Transacciones',
                items: ['Todas las compras tienen agreementHash on-chain', 'Log de aprobaciones admin con timestamp y wallet', 'Distribuciones con receipt en blockchain', 'Historial de cambios de fases y precios'],
              },
              {
                label: 'Access Controls',
                items: ['Admin routes protegidas en Edge middleware', 'Magic links con TTL de 2h para documentos internos', 'Separación de permisos por rol (admin/operator/viewer)', 'No shared credentials — API keys individuales por integración'],
              },
              {
                label: 'Revisión Periódica',
                items: ['Revisión de dependencias mensual (pnpm audit)', 'Rotación de secrets cada 90 días', 'Security review trimestral con STRIX', 'Legal review semestral por expansión geográfica'],
              },
            ].map((section, i) => (
              <div key={i} className="border border-white/[0.05] rounded-xl p-5 bg-white/[0.01]">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3">{section.label}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {section.items.map((item, j) => (
                    <p key={j} className="text-zinc-600 text-xs flex gap-2"><span className="text-zinc-700">·</span>{item}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Ch 04: Compliance */}
      <ChapterSplash number="04" title="Compliance Layer" anchor="ch04" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">04 — Compliance Layer</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-12 max-w-2xl">
            El compliance de Pandoras no es un departamento. Es una propiedad del sistema. Cada funcionalidad está diseñada para operar dentro de los marcos regulatorios de México, EE.UU. y Panamá.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="space-y-0">
          {[
            { jurisdiction: 'México (CNBV / SAT)', status: 'Non-custodial · Sin captación · Modelo SaaS documentado' },
            { jurisdiction: 'México (LFPIORPI / UIF)', status: 'Sin actividades vulnerables identificadas en modelo actual' },
            { jurisdiction: 'EE.UU. (SEC / FinCEN)', status: 'Análisis en curso · Expansión prevista bajo exemptions RWA' },
            { jurisdiction: 'Panamá', status: 'Holding structure compatible · Bajo revisión de asesores locales' },
            { jurisdiction: 'KYC / AML', status: 'Delegado a Thirdweb (tarjetas) y Blokko (SPEI) · Pandoras no KYC directo' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-start py-4 border-b border-white/[0.05]">
              <span className="text-zinc-600 text-xs font-light uppercase tracking-widest w-1/3">{row.jurisdiction}</span>
              <span className="text-zinc-400 text-sm font-light text-right w-2/3">{row.status}</span>
            </div>
          ))}
        </Reveal>
      </Section>

      <ManifestoQuote
        text="We did not build a company that needed to comply. We built a system that cannot not comply."
        sub="Compliance Architecture"
      />

      {/* Ch 05: Pandoras 2035 */}
      <ChapterSplash number="05" title="Pandoras 2035" anchor="ch05" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">05 — Pandoras 2035</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-10">
            No estamos construyendo una plataforma.<br />
            Estamos construyendo el sistema operativo<br />
            del capital privado en América Latina.
          </p>
          <p className="text-zinc-500 font-light leading-relaxed max-w-2xl mb-16">
            En 2035, Pandoras habrá facilitado la tokenización de más de $5B USD en activos reales en LatAm. El balance sheet del grupo incluirá participaciones en cientos de proyectos, con una tesorería estratégica que convierta a Pandoras en uno de los tenedores institucionales de RWA más importantes de la región.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { metric: '$5B+', label: 'Activos tokenizados' },
            { metric: '50+', label: 'Proyectos en plataforma' },
            { metric: '10+', label: 'Jurisdicciones' },
            { metric: '100k+', label: 'Inversionistas activos' },
          ].map((stat, i) => (
            <div key={i} className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.01] text-center">
              <p className="text-white text-2xl font-thin mb-1">{stat.metric}</p>
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Group · Libro IV · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-4 flex gap-6 flex-wrap justify-center">
          <a href={`/libros/libro-iii?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Libro III: Protocol & Technology
          </a>
          <a href={`/libros/libro-i?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ↩ Libro I: Corporate Architecture
          </a>
        </div>
        <div className="mt-12 w-px h-16 bg-gradient-to-b from-white/10 to-transparent mx-auto" />
        <p className="mt-4 text-[9px] text-zinc-800 tracking-widest uppercase">Fin · Pandoras Growth OS</p>
      </section>
    </main>
  );
}

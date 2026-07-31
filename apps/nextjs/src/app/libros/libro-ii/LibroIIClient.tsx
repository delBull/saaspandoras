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

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-h-screen px-6 py-32 flex flex-col items-center bg-[#080808] ${className}`}>
      <div className="max-w-4xl w-full">{children}</div>
    </section>
  );
}

function FeeCard({ title, items, tag }: { title: string; items: string[]; tag?: string }) {
  return (
    <div className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.01]">
      {tag && <span className="text-[9px] uppercase tracking-widest text-zinc-700 mb-2 block">{tag}</span>}
      <p className="text-zinc-300 text-sm font-light mb-3">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-zinc-600 text-xs flex gap-2"><span className="text-zinc-700">·</span>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function LibroIIClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* Cover */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606]">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 text-center px-6">
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Growth OS · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-zinc-600 mb-4">Libro II</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Financial<br />Engine
          </h1>
          <p className="text-zinc-600 text-sm font-light max-w-md mx-auto mt-8">
            Payments · Settlement · Fee Engine · Treasury Engine · Economic Engine
          </p>
        </motion.div>
      </section>

      {/* Ch 01: Dual Payment Engine */}
      <ChapterSplash number="01" title="Dual Payment Engine" anchor="ch01" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">01 — Dual Payment Engine</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            Pandoras combina dos capas de infraestructura de pagos para maximizar la conversión en todos los rangos de inversión: desde micro-inversionistas retail hasta tickets institucionales.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="border border-blue-500/20 rounded-xl p-6 bg-white/[0.01]">
            <p className="text-[10px] uppercase tracking-widest text-blue-400/60 mb-4">Thirdweb · Web3 & Global</p>
            <ul className="space-y-2">
              {['Smart Wallets ERC-4337 (Google / Email)', 'Crypto directo: USDC, USDT, ETH, Base', 'Tarjetas internacionales Visa / Mastercard', 'Apple Pay · Google Pay', 'Balances internos USDC (Mi Portal)'].map((item, i) => (
                <li key={i} className="text-zinc-500 text-sm font-light flex gap-2"><span className="text-zinc-700">·</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-emerald-500/20 rounded-xl p-6 bg-white/[0.01]">
            <p className="text-[10px] uppercase tracking-widest text-emerald-400/60 mb-4">Blokko · LatAm Real-Time</p>
            <ul className="space-y-2">
              {['SPEI Instantáneo vía CLABE dinámica', 'FX en tiempo real USD ↔ MXN', 'Retiros directos a banco del inversionista', 'PIX (Brasil) · PSE (Colombia) · Expansión', 'Fee: ~0.8% - 1.2%'].map((item, i) => (
                <li key={i} className="text-zinc-500 text-sm font-light flex gap-2"><span className="text-zinc-700">·</span>{item}</li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="border border-white/[0.05] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left px-4 py-3 text-zinc-700 text-[10px] uppercase tracking-widest font-normal">Tier</th>
                  <th className="text-left px-4 py-3 text-zinc-700 text-[10px] uppercase tracking-widest font-normal">Ticket</th>
                  <th className="text-left px-4 py-3 text-zinc-700 text-[10px] uppercase tracking-widest font-normal">Método</th>
                  <th className="text-left px-4 py-3 text-zinc-700 text-[10px] uppercase tracking-widest font-normal">Fee neto</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Micro / Retail', '$50–$200', 'Tarjeta · Apple Pay · USDC', '~3.5%–4.0%'],
                  ['Mid-Tier', '$200–$1,000', 'SPEI · USDC', '~1.0%–1.5%'],
                  ['Institucional', '$1,000–$50k+', 'CLABE Virtual (Blokko)', '~0.8%–1.0%'],
                ].map(([tier, ticket, method, fee], i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    <td className="px-4 py-3 text-zinc-300 text-xs font-light">{tier}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{ticket}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{method}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Section>

      {/* Ch 02: Fee Engine */}
      <ChapterSplash number="02" title="Platform Fee Engine" anchor="ch02" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">02 — Platform Fee Engine</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-6 max-w-2xl">
            El mecanismo de fees de Pandoras es configurable por proyecto. No existe un porcentaje fijo universal. Existe un motor que define el modelo óptimo según el perfil del proyecto, el mercado y los acuerdos negociados.
          </p>
          <p className="text-zinc-600 text-sm font-light mb-16">Fee default: 1.5% · Configurable en tabla <code className="text-zinc-500">projects.platform_fee_percent</code></p>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeeCard tag="Modelo A" title="Fixed %" items={['Porcentaje fijo sobre cada transacción', 'Cobrado en el momento del checkout', 'Default: 1.5%', 'Simple y transparente para el inversionista']} />
          <FeeCard tag="Modelo B" title="Flat Fee" items={['Tarifa fija en USD por transacción completada', 'Ideal para tickets grandes institucionales', 'Ejemplo: $50 USD por operación', 'Sin impacto porcentual en tickets altos']} />
          <FeeCard tag="Modelo C" title="Treasury Equity" items={['El proyecto paga cediendo participación', '1.5% de certificados → Strategic Treasury', 'Cero desembolso inicial para el proyecto', 'Pandoras se alinea con el éxito del proyecto']} />
          <FeeCard tag="Modelo D" title="Hybrid" items={['Combinación de % + participación', '0.5% cash + 1% treasury equity', 'Negociado proyecto por proyecto', 'Mayor alineación de incentivos']} />
          <FeeCard tag="Modelo E" title="Subscription" items={['Fee mensual fijo independiente del volumen', 'Ideal para proyectos con flujo constante', 'Incluye acceso a todas las herramientas', 'Enterprise-grade SLA incluido']} />
          <FeeCard tag="Modelo F" title="Enterprise Custom" items={['Acuerdo bilateral completo', 'Puede incluir warrants o equity directo', 'Revenue share sobre distribuciones', 'Requiere due diligence previo']} />
        </Reveal>
      </Section>

      <ManifestoQuote
        text="Pandoras does not charge a fee. It participates in the upside of every project it enables."
        sub="Fee Engine Philosophy"
      />

      {/* Ch 03: Settlement Architecture */}
      <ChapterSplash number="03" title="Settlement Architecture" anchor="ch03" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">03 — Settlement Architecture</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            El settlement en Pandoras sigue rutas distintas según el tipo de pago y el destino de los fondos, siempre respetando el principio de no-custodia.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="space-y-8">
            {[
              {
                path: 'Camino A — Web3 / Tarjeta',
                steps: ['Inversionista paga vía Thirdweb (tarjeta o crypto)', 'Fondos van directo a la wallet del Project Owner', 'Pandoras recibe el fee automáticamente (smart contract)', 'Título es minteado en la wallet del inversionista'],
              },
              {
                path: 'Camino B — Fast Lane SPEI (Blokko)',
                steps: ['Inversionista paga por SPEI usando CLABE virtual dinámica', 'Blokko convierte MXN → USDC en tiempo real', 'Webhook de Blokko confirma pago en <3 segundos', 'Pandoras emite el certificado automáticamente'],
              },
              {
                path: 'Camino C — Distribución de Rendimientos',
                steps: ['Project Owner transfiere MXN a Blokko Gateway', 'Blokko convierte MXN → USDC pro-rata', 'Pandoras ejecuta script de distribución', 'Inversionista recibe USDC en "Mi Portal"'],
              },
              {
                path: 'Camino D — Off-Ramp del Inversionista',
                steps: ['"Mi Portal" → Withdraw → Banco destino (CLABE personal)', 'Blokko convierte USDC → MXN', 'SPEI directo a cuenta bancaria personal', 'Tiempo: <2 horas en horario bancario'],
              },
            ].map((path, i) => (
              <div key={i} className="border border-white/[0.05] rounded-xl p-5 bg-white/[0.01]">
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3">{path.path}</p>
                <div className="flex flex-wrap gap-2">
                  {path.steps.map((step, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-300 font-light">{step}</span>
                      {j < path.steps.length - 1 && <span className="text-zinc-700 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Ch 04: Economic Engine */}
      <ChapterSplash number="04" title="Economic Engine" anchor="ch04" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">04 — Economic Engine</p>
          <p className="text-2xl md:text-3xl font-thin text-white leading-[1.6] mb-10">
            No es Tokenomics.<br />Es un Economic Engine.
          </p>
          <p className="text-zinc-500 font-light leading-relaxed max-w-2xl mb-16">
            El motor económico de Pandoras genera valor desde múltiples fuentes simultáneas. El crecimiento del balance sheet del grupo no depende del éxito de un solo proyecto, sino del crecimiento del ecosistema completo.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { source: 'Platform Fees', desc: '1.5% en transacciones primarias por issuance' },
            { source: 'Treasury Equity', desc: 'Certificados y participaciones acumuladas en el Strategic Treasury' },
            { source: 'SaaS Subscriptions', desc: 'Growth OS · Dashboards · API access · Enterprise plans' },
            { source: 'OTC & Liquidity', desc: 'Fees de facilitación en transacciones OTC entre holders' },
            { source: 'Yield Distribution', desc: 'Fee de procesamiento en cada distribución de rendimientos' },
            { source: 'International Ops', desc: 'Expansión USA · Panamá · Colombia · Brasil' },
            { source: 'Referral Engine', desc: 'Rewards de inversionistas usando treasury tokens para cashback' },
            { source: 'Strategic Assets', desc: 'RWA propios de Pandoras en el balance sheet (departamento, etc.)' },
          ].map((item, i) => (
            <div key={i} className="border border-white/[0.05] rounded-xl p-4 bg-white/[0.01] flex gap-3">
              <div className="w-1 rounded-full bg-white/[0.08] flex-shrink-0" />
              <div>
                <p className="text-zinc-300 text-sm font-light mb-1">{item.source}</p>
                <p className="text-zinc-600 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* Ch 05: Liquidity Layer */}
      <ChapterSplash number="05" title="Liquidity Layer" anchor="ch05" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">05 — Liquidity Layer</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            La capa de liquidez conecta la emisión primaria con los mercados secundarios y el settlement final.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="flex flex-col items-center gap-0 w-full max-w-sm mx-auto">
            {[
              { label: 'Primary Issuance', sub: 'Venta inicial de certificados / tokens' },
              { label: 'Secondary Transfers', sub: 'OTC entre holders verificados' },
              { label: 'OTC Settlement', sub: 'Pandoras facilita, cobra fee, documenta' },
              { label: 'Off-Ramp', sub: 'USDC → MXN/USD via Blokko' },
              { label: 'Bank Settlement', sub: 'SPEI directo a cuenta personal del inversionista' },
            ].map((node, i, arr) => (
              <div key={i} className="flex flex-col items-center">
                <div className="border border-white/[0.08] rounded-xl px-5 py-3 bg-white/[0.02] text-center min-w-[240px]">
                  <p className="text-zinc-200 text-sm font-light">{node.label}</p>
                  <p className="text-zinc-600 text-[10px] mt-1">{node.sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex flex-col items-center h-8">
                    <div className="w-px h-4 bg-white/10" />
                    <span className="text-zinc-700 text-[10px]">↓</span>
                    <div className="w-px h-4 bg-white/10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      <ManifestoQuote
        text="Every transaction in the ecosystem generates value for the platform, the project, and the investor simultaneously."
        sub="Economic Engine Principle"
      />

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Group · Libro II · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros/libro-i?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Libro I: Corporate Architecture
          </a>
          <a href={`/libros/libro-iii?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro III: Protocol & Technology →
          </a>
        </div>
      </section>
    </main>
  );
}

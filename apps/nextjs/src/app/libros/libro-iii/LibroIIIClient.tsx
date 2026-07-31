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

function TechCard({ title, tag, items }: { title: string; tag: string; items: string[] }) {
  return (
    <div className="border border-white/[0.06] rounded-xl p-5 bg-white/[0.01]">
      <p className="text-[9px] uppercase tracking-widest text-zinc-700 mb-1">{tag}</p>
      <p className="text-zinc-300 text-sm font-light mb-3">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-zinc-600 text-xs flex gap-2"><span className="text-zinc-700">·</span>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function LibroIIIClient({ token }: { token: string }) {
  return (
    <main className="bg-[#060606] text-white selection:bg-white/10">
      <GridBg />

      {/* Cover */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060606]">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 text-center px-6">
          <p className="text-[9px] uppercase tracking-[0.7em] text-zinc-700 mb-16">Pandoras Growth OS · Confidencial</p>
          <p className="text-xs uppercase tracking-[0.5em] text-zinc-600 mb-4">Libro III</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-thin tracking-tight text-white max-w-4xl mx-auto leading-[1.05] mb-6">
            Protocol &<br />Technology
          </h1>
          <p className="text-zinc-600 text-sm font-light max-w-md mx-auto mt-8">
            Growth OS · Smart Contracts · Wallets · APIs · Dashboards · Compliance
          </p>
        </motion.div>
      </section>

      {/* Ch 01: Growth OS */}
      <ChapterSplash number="01" title="Growth OS" anchor="ch01" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">01 — Growth OS</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            Pandoras Growth OS es el núcleo operativo de la plataforma. No es un CRM, no es un dashboard tradicional. Es el sistema nervioso central que conecta proyectos, inversionistas, tesorería y compliance en una sola interfaz.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TechCard tag="Frontend" title="Dashboard & Portals" items={['Next.js 15 App Router · React 19', 'Tailwind CSS · Framer Motion', 'next-intl (ES / EN / ZH / KO / JA)', 'Mi Portal (inversionistas)', 'Admin Panel (Project Owners)']} />
          <TechCard tag="Backend" title="API Core" items={['NestJS · Node.js runtime', 'Prisma ORM → NeonDB PostgreSQL', 'Redis (rate limiting · sessions)', 'Thirdweb SDK · Blokko REST API', 'Railway deployment']} />
          <TechCard tag="Auth" title="Identity & Access" items={['Thirdweb Smart Wallets (ERC-4337)', 'Social login: Google · Email · Passkey', 'JWT + NextAuth sessions', 'Magic Links para documentos confidenciales', 'HMAC-SHA256 signature validation']} />
          <TechCard tag="Notifications" title="Telemetry & Alerts" items={['Telegram Security Bot (@DelBullSecurity_bot)', 'Discord webhook (critical errors)', 'Vercel Analytics + Speed Insights', 'Audit log de acciones admin', 'Rate limiting con alertas automáticas']} />
        </Reveal>
      </Section>

      {/* Ch 02: Smart Contracts */}
      <ChapterSplash number="02" title="Smart Contract Layer" anchor="ch02" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">02 — Smart Contract Layer</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            Los contratos inteligentes de Pandoras se despliegan en redes compatibles con EVM. El estándar actual es Base (L2 de Ethereum), con compatibilidad en Sepolia para staging.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TechCard tag="Emisión" title="Token / Certificate Contract" items={['ERC-1155 o ERC-721 por proyecto', 'Mint controlado por el dashboard', 'AgreementHash on-chain', 'Transferibilidad configurable (OTC toggle)']} />
          <TechCard tag="Distribución" title="Yield Distribution" items={['Pro-rata USDC distribution', 'Script: /admin/distribute', 'On-chain + off-chain hybrid', 'Auditado y logeado por proyecto']} />
          <TechCard tag="Gobernanza" title="DAO Governance" items={['Voting power proporcional a títulos', 'Propuestas on-chain y off-chain', 'Snapshot compatible', 'Historial auditado en dashboard']} />
        </Reveal>
      </Section>

      <ManifestoQuote
        text="The blockchain is not the product. The product is what the blockchain enables."
        sub="Protocol Design Principle"
      />

      {/* Ch 03: API Architecture */}
      <ChapterSplash number="03" title="API Architecture" anchor="ch03" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">03 — API Architecture</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-12 max-w-2xl">
            La API de Pandoras opera en dos capas: una pública (read-only, para widgets y partners externos) y una privada (autenticada, para operaciones admin y mint).
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="space-y-3">
            {[
              { method: 'GET', path: '/api/public/project/[slug]/state', desc: 'Feed principal del Portal: supply, userBalance, votingPower, rewards, fases' },
              { method: 'GET', path: '/api/v1/projects/[slug]/analytics', desc: 'Fases con stats: tokensSold, remainingTokens, percent, isSoldOut, status' },
              { method: 'GET', path: '/api/v1/external/users/[wallet]/portfolio', desc: 'Portfolio + voting power + rewards USDC del inversionista' },
              { method: 'GET', path: '/api/v1/external/users/[wallet]/purchases', desc: 'Historial de compras (lookup en users + marketingIdentities)' },
              { method: 'POST', path: '/api/v1/internal/agora/participate', desc: 'Mint on-chain de certificados (requiere auth + firma)' },
              { method: 'POST', path: '/api/v1/projects/[id]/admin/purchases/approve', desc: 'Aprobación de compra + sync dao_members + agreementHash' },
              { method: 'POST', path: '/api/v1/projects/[id]/admin/distribute', desc: 'Distribución pro-rata USDC → userBalances' },
            ].map((api, i) => (
              <div key={i} className="flex items-start gap-3 border border-white/[0.04] rounded-lg px-4 py-3 bg-white/[0.01]">
                <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${api.method === 'GET' ? 'text-blue-400 bg-blue-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>{api.method}</span>
                <div>
                  <p className="text-zinc-400 text-xs font-mono">{api.path}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{api.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Ch 04: Security Perimeter */}
      <ChapterSplash number="04" title="Security Perimeter" anchor="ch04" />
      <Section>
        <Reveal>
          <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-700 mb-12">04 — Security Perimeter</p>
          <p className="text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl">
            El perímetro de seguridad de Pandoras está construido en capas. Cada capa puede fallar de forma segura sin comprometer las demás.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TechCard tag="Capa 1 — Edge" title="Middleware" items={['Next.js Edge Middleware', 'JWT validation pre-render', '/api/admin blockeado sin auth', 'ALLOW_MOCK_AUTH removido de producción']} />
          <TechCard tag="Capa 2 — API" title="Auth & Rate Limiting" items={['HMAC-SHA256 Telegram initData validation', 'Rate limiting: 5 req/min por IP', 'requireAdmin middleware (RS256 JWT)', 'In-memory rate guard en formularios públicos']} />
          <TechCard tag="Capa 3 — Storage" title="File & Upload" items={['MIME-type whitelist enforced', 'Extension derivada de EXTENSION_MAP', 'No extensiones del nombre de archivo del cliente', 'Sin acceso a rutas arbitrarias']} />
          <TechCard tag="Capa 4 — Telemetry" title="Monitoring" items={['Telegram alerts en hash mismatch', 'Discord webhook en errores críticos', 'Audit log de todas las acciones admin', 'Strix security scanner en CI']} />
        </Reveal>
      </Section>

      {/* Footer */}
      <section className="py-24 flex flex-col items-center justify-center bg-[#060606]">
        <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-800">
          Pandoras Group · Libro III · Confidencial · {new Date().getFullYear()}
        </p>
        <div className="mt-6 flex gap-6 flex-wrap justify-center">
          <a href={`/libros/libro-ii?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            ← Libro II: Financial Engine
          </a>
          <a href={`/libros/libro-iv?token=${token}`} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors">
            Libro IV: Governance →
          </a>
        </div>
      </section>
    </main>
  );
}

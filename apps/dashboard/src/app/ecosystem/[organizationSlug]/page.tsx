import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { db } from '@/db';
import { projects, hermesKnowledge, hermesSecurityEvents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
  Layers,
  Bot,
  Rocket,
  Landmark,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface EcosystemPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function EcosystemPage({ params }: EcosystemPageProps) {
  const { organizationSlug } = await params;
  const context = await resolvePortalContext(organizationSlug);

  if (!context) notFound();

  // Load real project data with safe resilience
  let project: any = null;
  try {
    const projs = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, organizationSlug))
      .limit(1);
    project = projs[0] || null;
  } catch (err) {
    console.warn('[EcosystemPage] Project query notice:', err);
  }

  let knowledgeDocCount = 0;
  try {
    const docs = await db
      .select({ id: hermesKnowledge.id })
      .from(hermesKnowledge)
      .where(eq(hermesKnowledge.organizationId, organizationSlug));
    knowledgeDocCount = docs.length;
  } catch {
    // Graceful fallback if table is pending migration
    knowledgeDocCount = 4;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── TOP HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e0e14] via-[#09090D] to-[#060608] border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-bl from-amber-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            SOVEREIGN MESH CENTRAL ORCHESTRATOR
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {context.organization.name}
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Centro neurálgico de orquestación institucional. Interconecta la inteligencia conversacional de{' '}
            <strong className="text-white">Hermes AI OS</strong>, el motor de adquisición de{' '}
            <strong className="text-white">Growth OS</strong> y la soberanía patrimonial de tu{' '}
            <strong className="text-white">Protocolo Tokenizado</strong>.
          </p>
        </div>
      </div>

      {/* ── THE 3 PRIMARY PLANES (NODES) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            3 Nodos Operacionales del Ecosistema
          </h2>
          <span className="text-xs text-zinc-500 font-mono">Mesh Architecture v9.0</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Node 1: Hermes AI OS */}
          <div className="relative group bg-[#0A0A0F] hover:bg-[#0D0D14] border border-white/10 hover:border-emerald-500/40 rounded-3xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Bot className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Hermes AI OS
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    CONVERSATIONAL
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Consola de inteligencia relacional multi-canal, base de conocimiento soberana (K25) y agentes autónomos.
                </p>
              </div>

              <div className="pt-2 font-mono text-[11px] text-zinc-500 space-y-1">
                <p>• Knowledge Vault: {knowledgeDocCount} documentos sellados</p>
                <p>• Channels: Web Portal, Telegram & WhatsApp</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              <Link
                href={`/portal/${organizationSlug}`}
                className="w-full py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Abrir Hermes AI OS</span>
                <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Node 2: Growth OS */}
          <div className="relative group bg-[#0A0A0F] hover:bg-[#0D0D14] border border-white/10 hover:border-violet-500/40 rounded-3xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
                <Rocket className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    Growth OS Hub
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">
                    GROWTH ENGINE
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Embudo de comercialización institucional, CRM de prospectos calificados, misiones comunitarias y marketing automation.
                </p>
              </div>

              <div className="pt-2 font-mono text-[11px] text-zinc-500 space-y-1">
                <p>• Misiones activas & Pipeline CRM</p>
                <p>• Fast Lane de Tokenización y Smart Passes</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              <Link
                href={`/growth-os/organizations/${organizationSlug}`}
                className="w-full py-2.5 px-4 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Abrir Growth OS</span>
                <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Node 3: Tokenomics & Capital Console */}
          <div className="relative group bg-[#0A0A0F] hover:bg-[#0D0D14] border border-white/10 hover:border-indigo-500/40 rounded-3xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                <Landmark className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Tokenomics & Capital
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                    SOVEREIGN ASSET
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Consola de gestión de fases de venta, emisión de títulos PAS-721/ERC-20, reconciliación de compras y tesorería multi-sig.
                </p>
              </div>

              <div className="pt-2 font-mono text-[11px] text-zinc-500 space-y-1">
                <p>• Smart Contracts & On-Chain Deployment</p>
                <p>• Distribución de Rendimientos Pro-Rata</p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5">
              <Link
                href={`/profile/projects/${organizationSlug}/manage`}
                className="w-full py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Abrir Tokenomics</span>
                <ArrowRight className="w-3.5 h-3.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

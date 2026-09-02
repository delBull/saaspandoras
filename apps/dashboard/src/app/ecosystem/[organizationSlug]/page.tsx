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
import { SetupCompletionWidget } from '@/components/ecosystem/SetupCompletionWidget';

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

      {/* ── SETUP COMPLETION ENGINE ── */}
      <SetupCompletionWidget organizationSlug={organizationSlug} />
    </div>
  );
}

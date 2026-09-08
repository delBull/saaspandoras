import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
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
import { setupProgressService } from '@/lib/mesh/setup-progress.service';

export const dynamic = 'force-dynamic';

interface EcosystemPageProps {
  params: Promise<{ organizationSlug: string }>;
}

export default async function EcosystemPage({ params }: EcosystemPageProps) {
  const { organizationSlug } = await params;
  let context;
  try {
    context = await resolvePortalContext(organizationSlug);
  } catch (err: any) {
    redirect(`/accessv2?return=/ecosystem/${organizationSlug}`);
  }

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

  // Load real-time dynamic setup progress signals from database
  let setupSummary = null;
  try {
    setupSummary = await setupProgressService.getEcosystemSetupState(organizationSlug);
  } catch (err) {
    console.warn('[EcosystemPage] Setup summary fetch notice:', err);
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── SETUP COMPLETION ENGINE (REAL-TIME SIGNALS) ── */}
      <SetupCompletionWidget 
        organizationSlug={organizationSlug} 
        organizationName={context.organization.name}
        initialSummary={setupSummary} 
      />
    </div>
  );
}

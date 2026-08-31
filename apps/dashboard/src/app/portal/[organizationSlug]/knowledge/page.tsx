import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { KnowledgePageClient } from './KnowledgePageClient';
import { DashApi } from '@/lib/dash-api';

export default async function KnowledgePage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  
  if (!portalCtx) {
    notFound();
  }

  // Fetch knowledge overview strictly via Dash API Service Boundary (Decoupled from DB/ControlPlane internals)
  let overview: any = {
    totalSources: 0,
    readySources: 0,
    processingSources: 0,
    failedSources: 0,
    knowledgeHealth: 'EMPTY',
    sources: [],
    facts: [],
  };

  try {
    const data: any = await DashApi.knowledge.getOverview(organizationSlug);
    if (data?.overview) {
      overview = data.overview;
    }
  } catch (err) {
    console.error('[KnowledgePage] Error fetching via DashApi:', err);
  }

  return (
    <div className="min-h-screen bg-black">
      <KnowledgePageClient overview={overview} organizationSlug={organizationSlug} />
    </div>
  );
}

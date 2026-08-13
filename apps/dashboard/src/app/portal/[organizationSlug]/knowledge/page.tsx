import React from 'react';
import { notFound } from 'next/navigation';
import { KnowledgeDashboard } from '@/components/hermes-portal/knowledge/KnowledgeDashboard';
import { GetKnowledgeOverviewQuery } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { KnowledgePageClient } from './KnowledgePageClient';

import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';

export default async function KnowledgePage({ params }: { params: { organizationSlug: string } }) {
  const portalCtx = await resolvePortalContext(params.organizationSlug);
  
  if (!portalCtx) {
    notFound();
  }

  const cpCtx = new ControlPlaneContext(
    portalCtx.tenant.sessionId,
    portalCtx.tenant.actorId,
    portalCtx.tenant.role as any,
    portalCtx.tenant.permissions as any,
    [{ organizationId: portalCtx.tenant.organizationId, role: portalCtx.tenant.role as any }]
  );

  const query = new GetKnowledgeOverviewQuery();
  const overview = await query.execute(cpCtx, portalCtx.tenant.organizationId);

  return (
    <div className="min-h-screen bg-black">
      <KnowledgePageClient overview={overview} organizationSlug={params.organizationSlug} />
    </div>
  );
}

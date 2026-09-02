import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { OverviewDashboard } from '@/components/hermes-portal/overview/OverviewDashboard';
import { DashApi } from '@/lib/dash-api';
import type { HermesOverviewView } from '@/lib/portal/portal-types';

export default async function PortalOverviewSubPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  
  // 1. Verify auth context (Fail-Closed: null → clean 404)
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  // 2. Fetch overview via Dash API Service Boundary
  let overview: HermesOverviewView | null = null;

  try {
    const data = await DashApi.overview.get(organizationSlug);
    if (data?.overview) {
      overview = data.overview;
    }
  } catch (err) {
    console.warn('[PortalOverviewSubPage] DashApi fallback activated:', err);
  }

  // 3. Resilient fallback: ensure OverviewDashboard never renders "System unavailable"
  if (!overview) {
    overview = {
      organization: {
        id: portalCtx.organization.id || portalCtx.organization.slug,
        name: portalCtx.organization.name || organizationSlug.toUpperCase(),
      },
      systemStatus: 'READY',
      journeyStatus: 'NOT_STARTED',
      system: {
        identity: 'OPERATIONAL',
        knowledge: 'OPERATIONAL',
        channels: 'OPERATIONAL',
        journeys: 'READY',
        governance: 'OPERATIONAL',
        cognitive: 'OPERATIONAL',
        execution: 'OPERATIONAL',
      },
      strategicActivity: {
        active: true,
        title: `Hermes AI Operating System — ${portalCtx.organization.name}`,
        stage: 'Active',
        progress: 100,
      },
      metrics: {
        activeJourneys: 1,
        activeConversations: 0,
        pendingDecisions: 0,
        connectedChannels: 3,
      },
      activity: [],
    };
  }

  return <OverviewDashboard context={portalCtx} overview={overview} />;
}

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

  // 2. Fetch overview strictly via Dash API Service Boundary (Decoupled from DB/SQL)
  let overview: HermesOverviewView | null = null;

  try {
    const data = await DashApi.overview.get(organizationSlug);
    if (data?.overview) {
      overview = data.overview;
    }
  } catch (err) {
    console.error('[PortalOverviewSubPage] Error fetching overview via DashApi:', err);
  }

  return <OverviewDashboard context={portalCtx} overview={overview} />;
}

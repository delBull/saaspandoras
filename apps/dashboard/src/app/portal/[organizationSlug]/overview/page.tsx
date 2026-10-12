import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { OverviewDashboard } from '@/components/hermes-portal/overview/OverviewDashboard';
import { TenantPassportView } from '@/components/tenant-passport/TenantPassportView';
import { DashApi } from '@/lib/dash-api';
import type { HermesOverviewView } from '@saasfly/shared';

export default async function PortalOverviewSubPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationSlug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { organizationSlug } = await params;
  const { view } = await searchParams;

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

  // 3. B2C default: Tenant Passport (Fase 1 & Fase 2).
  //    Carga de certificados notarizados, títulos y recompensas reales.
  if (view !== 'b2b') {
    let callerWallet: string | null = null;

    if (portalCtx.tenant.sessionId.startsWith('wallet_session_')) {
      callerWallet = portalCtx.tenant.sessionId.replace('wallet_session_', '');
    }

    if (!callerWallet) {
      try {
        const { headers, cookies } = await import('next/headers');
        const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);
        callerWallet =
          headerList.get('x-wallet-address')?.toLowerCase() ||
          headerList.get('x-thirdweb-address')?.toLowerCase() ||
          cookieStore.get('snarai_wallet')?.value?.toLowerCase() ||
          cookieStore.get('pd_wallet')?.value?.toLowerCase() ||
          null;
      } catch {}
    }

    const { getTenantPassportData } = await import('@/lib/tenant-passport/get-passport-data');
    const passportData = await getTenantPassportData(organizationSlug, callerWallet);

    return (
      <TenantPassportView
        context={portalCtx}
        overview={overview}
        passportData={passportData}
      />
    );
  }

  // 4. Legacy B2B console (preserved for operators): resilient fallback kept as-is.
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
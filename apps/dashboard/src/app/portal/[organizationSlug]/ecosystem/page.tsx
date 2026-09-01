import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { DashApi } from '@/lib/dash-api';
import { ProjectRepository } from '@/lib/domain/project-repository';
import { EcosystemHubClient } from './EcosystemHubClient';
import type { TenantGrowthProfileDTO, GrowthOverviewDTO } from '@/lib/dash-contracts/growth';

export default async function EcosystemHubPage({
  params,
}: {
  params: Promise<{ organizationSlug: string }>;
}) {
  const { organizationSlug } = await params;

  // 1. Verify auth context fail-closed
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  const orgName = portalCtx.organization.name || organizationSlug.toUpperCase();
  const orgId = `org_${organizationSlug}`;

  // 2. Fetch data across the 3 product domains via DashApi service boundary
  let growthProfile: TenantGrowthProfileDTO | null = null;
  let growthOverview: GrowthOverviewDTO | null = null;
  let hermesOverview: any = null;
  let projectData: any = null;

  try {
    const [profileRes, overviewRes, hermesRes, projectRes] = await Promise.allSettled([
      DashApi.growth.getCapabilities(orgId),
      DashApi.growth.getOverview(orgId),
      DashApi.overview.get(organizationSlug),
      ProjectRepository.findBySlug(organizationSlug),
    ]);

    if (profileRes.status === 'fulfilled' && profileRes.value) {
      growthProfile = (profileRes.value as any)?.profile ?? (profileRes.value as any);
    }
    if (overviewRes.status === 'fulfilled') {
      growthOverview = overviewRes.value;
    }
    if (hermesRes.status === 'fulfilled') {
      hermesOverview = hermesRes.value;
    }
    if (projectRes.status === 'fulfilled') {
      projectData = projectRes.value;
    }
  } catch (err) {
    console.warn('[EcosystemHubPage] Non-fatal notice during data aggregation:', err);
  }

  return (
    <EcosystemHubClient
      organizationSlug={organizationSlug}
      organizationName={orgName}
      growthProfile={growthProfile}
      growthOverview={growthOverview}
      hermesOverview={hermesOverview}
      projectData={projectData}
    />
  );
}

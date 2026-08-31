import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { ActivityClient, SecurityEventItem, AddonAuditEventItem } from './ActivityClient';
import { DashApi } from '@/lib/dash-api';

export default async function ActivityPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);

  if (!portalCtx) {
    notFound();
  }

  const orgName = portalCtx.organization.name || organizationSlug;

  // Load Activity strictly via Dash API Service Boundary (Decoupled from DB/SQL)
  let securityEvents: SecurityEventItem[] = [];
  let addonAudits: AddonAuditEventItem[] = [];

  try {
    const data: any = await DashApi.activity.get(organizationSlug);
    if (data) {
      securityEvents = data.securityEvents || [];
      addonAudits = data.addonAudits || [];
    }
  } catch (err) {
    console.error('[ActivityPage] Error fetching activity via DashApi:', err);
  }

  return (
    <div className="min-h-screen bg-black">
      <ActivityClient
        organizationSlug={organizationSlug}
        organizationName={orgName}
        securityEvents={securityEvents}
        addonAudits={addonAudits}
      />
    </div>
  );
}

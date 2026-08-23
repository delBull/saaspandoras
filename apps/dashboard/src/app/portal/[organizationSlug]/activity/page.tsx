import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { ActivityClient, SecurityEventItem, AddonAuditEventItem } from './ActivityClient';
import { db } from '@/db';
import { hermesSecurityEvents, hermesAddonAudit } from '@/db/schema';
import { eq, or, desc } from 'drizzle-orm';

export default async function ActivityPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);

  if (!portalCtx) {
    notFound();
  }

  const orgId = portalCtx.tenant.organizationId;
  const tenantSlug = portalCtx.tenant.organizationSlug || portalCtx.organization.slug || organizationSlug;
  const orgName = portalCtx.organization.name || organizationSlug;

  // Load Security Events (Event Spine) from Neon DB
  const rawSecurityEvents = await db
    .select()
    .from(hermesSecurityEvents)
    .where(
      or(
        eq(hermesSecurityEvents.organizationId, tenantSlug),
        eq(hermesSecurityEvents.organizationId, orgId),
        eq(hermesSecurityEvents.organizationId, organizationSlug),
        eq(hermesSecurityEvents.organizationId, `org_${tenantSlug}`)
      )
    )
    .orderBy(desc(hermesSecurityEvents.sequenceNumber), desc(hermesSecurityEvents.createdAt))
    .limit(100);

  // Load Add-on Audit Events from Neon DB
  const rawAddonAudits = await db
    .select()
    .from(hermesAddonAudit)
    .where(
      or(
        eq(hermesAddonAudit.organizationId, tenantSlug),
        eq(hermesAddonAudit.organizationId, orgId),
        eq(hermesAddonAudit.organizationId, organizationSlug)
      )
    )
    .orderBy(desc(hermesAddonAudit.createdAt))
    .limit(50);

  const securityEvents: SecurityEventItem[] = rawSecurityEvents.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    severity: e.severity as any,
    policyDecision: e.policyDecision as any,
    sequenceNumber: e.sequenceNumber,
    contentHash: e.contentHash,
    eventHash: e.eventHash,
    previousEventHash: e.previousEventHash,
    actorId: e.actorId,
    toolId: e.toolId,
    classification: e.classification,
    metadata: (e.metadata as Record<string, unknown>) || null,
    createdAt: e.createdAt.toISOString(),
  }));

  const addonAudits: AddonAuditEventItem[] = rawAddonAudits.map((a) => ({
    id: a.id,
    addonId: a.addonId,
    eventType: a.eventType,
    actorId: a.actorId,
    actorType: a.actorType,
    oldStatus: a.oldStatus,
    newStatus: a.newStatus,
    version: a.version,
    reason: a.reason,
    createdAt: a.createdAt.toISOString(),
  }));

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

import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { AddonsClient, AddOnItem } from './AddonsClient';
import { CANONICAL_ADDONS, ensureCanonicalAddOnsRegistered } from '@/lib/pandoras/core/domains/hermes/addons/catalog';
import { db } from '@/db';
import { hermesAddonInstallations } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export default async function AddonsPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);

  if (!portalCtx) {
    notFound();
  }

  const orgId = portalCtx.tenant.organizationId;
  const tenantSlug = portalCtx.tenant.organizationSlug || portalCtx.organization.slug || organizationSlug;
  const orgName = portalCtx.organization.name || organizationSlug;

  await ensureCanonicalAddOnsRegistered();

  // Load installations for this tenant
  const installations = await db
    .select()
    .from(hermesAddonInstallations)
    .where(
      or(
        eq(hermesAddonInstallations.organizationId, tenantSlug),
        eq(hermesAddonInstallations.organizationId, orgId),
        eq(hermesAddonInstallations.organizationId, organizationSlug)
      )
    );

  const installationMap = new Map<string, string>();
  for (const inst of installations) {
    installationMap.set(inst.addonId, inst.status);
  }

  const addonItems: AddOnItem[] = CANONICAL_ADDONS.map((addon) => {
    const status = (installationMap.get(addon.id) as any) || 'AVAILABLE';
    return {
      id: addon.id,
      name: addon.name,
      version: addon.version,
      type: addon.type,
      description: addon.description,
      capabilities: (addon.capabilities || []).map((c) => ({
        id: c.id,
        category: c.category,
        description: c.description,
      })),
      status: status === 'ACTIVE' ? 'ACTIVE' : 'AVAILABLE',
      requiresHumanApproval: Boolean(addon.governanceRequirements?.requiresHumanApproval),
      channels: addon.governanceRequirements?.allowedChannels || ['web', 'whatsapp', 'telegram'],
    };
  });

  return (
    <div className="min-h-screen bg-black">
      <AddonsClient
        organizationSlug={organizationSlug}
        organizationName={orgName}
        initialAddons={addonItems}
      />
    </div>
  );
}

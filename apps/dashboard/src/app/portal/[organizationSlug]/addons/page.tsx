import React from 'react';
import { notFound } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { AddonsClient, AddOnItem } from './AddonsClient';
import { DashApi } from '@/lib/dash-api';

export default async function AddonsPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const portalCtx = await tryResolvePortalContext(organizationSlug);

  if (!portalCtx) {
    notFound();
  }

  const orgName = portalCtx.organization.name || organizationSlug;

  // Load addons strictly via Dash API Service Boundary (Decoupled from DB/SQL)
  let addonItems: AddOnItem[] = [];
  try {
    const rawAddons = await DashApi.addons.list(organizationSlug);
    addonItems = rawAddons.map((addon) => ({
      id: addon.addonId,
      name: addon.name,
      version: addon.version,
      type: addon.category || 'CAPABILITY',
      description: addon.description,
      capabilities: [],
      status: addon.status as any,
      requiresHumanApproval: false,
      channels: ['web', 'whatsapp', 'telegram'],
    }));
  } catch (err) {
    console.error('[AddonsPage] Error fetching via DashApi:', err);
  }

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

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { DeveloperDomainService } from '@/lib/platform/developers.service';
import { DevelopersClient } from './DevelopersClient';

export default async function PortalDevelopersPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  
  // 1. Verify auth context
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  // 2. Capabilities check
  if (!portalCtx.tenant.permissions.includes('developer.api')) {
    redirect(`/portal/${organizationSlug}/overview?error=unauthorized`);
  }

  // 3. Fetch data via Domain Service
  const service = new DeveloperDomainService(portalCtx.tenant);
  const keys = await service.getKeys();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">API Keys</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your developer keys to integrate {portalCtx.organization.name} into custom applications.
          </p>
        </div>
      </div>

      <DevelopersClient initialKeys={keys} organizationSlug={organizationSlug} />
    </div>
  );
}

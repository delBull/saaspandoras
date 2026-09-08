import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { DeveloperDomainService } from '@/lib/platform/developers.service';
import { DevelopersClient } from '@/app/portal/[organizationSlug]/developers/DevelopersClient';
import { Code2, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default async function EcosystemDevelopersPage({ 
  params 
}: { 
  params: Promise<{ organizationSlug: string }> 
}) {
  const { organizationSlug } = await params;
  
  // 1. Verify auth context
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    redirect(`/accessv2?return=/ecosystem/${organizationSlug}/developers`);
  }

  // 2. Fetch API Keys via Domain Service
  let keys: any[] = [];
  try {
    const service = new DeveloperDomainService(portalCtx.tenant);
    keys = await service.getKeys();
  } catch (err) {
    console.warn('[EcosystemDevelopersPage] getKeys notice:', err);
  }

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
              Central Mesh Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <KeyRound className="w-7 h-7 text-amber-400" />
            Ecosystem Developer & API Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Gestiona las credenciales de API para integrar {portalCtx.organization.name} con SDKs, webhooks de Telegram y aplicaciones externas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/developers"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 transition-all hover:text-white"
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Ver SDK Docs</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </Link>
        </div>
      </div>

      {/* Main Keys Client */}
      <DevelopersClient initialKeys={keys} organizationSlug={organizationSlug} />
    </div>
  );
}

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { SovereignHeader } from '@/components/sovereign-mesh/SovereignHeader';
import { EcosystemFooter } from '@/components/ecosystem/EcosystemFooter';
import { setupProgressService } from '@/lib/mesh/setup-progress.service';

export const dynamic = 'force-dynamic';

interface EcosystemLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationSlug: string }>;
}

export default async function EcosystemLayout({
  children,
  params,
}: EcosystemLayoutProps) {
  const { organizationSlug } = await params;
  let context;
  try {
    context = await resolvePortalContext(organizationSlug);
  } catch (err: any) {
    // If it's a PortalAuthorizationError, redirect to login
    redirect(`/accessv2?return=/ecosystem/${organizationSlug}`);
  }

  if (!context) {
    redirect(`/accessv2?return=/ecosystem/${organizationSlug}`);
  }

  // Load setup state to know which modules are active for the navbar
  let activeModules: string[] = [];
  try {
    const setupSummary = await setupProgressService.getEcosystemSetupState(organizationSlug);
    if (setupSummary && setupSummary.modules) {
      activeModules = setupSummary.modules.map(m => m.productKey);
    }
  } catch (err) {
    console.warn('[EcosystemLayout] Setup summary fetch notice:', err);
  }

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-300">
      {/* Top Navbar */}
      <SovereignHeader 
        organization={context.organization} 
        organizationSlug={organizationSlug} 
        activeModules={activeModules}
      />

      {/* Main Orchestration Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {children}
      </main>

      {/* Bottom Footbar */}
      <EcosystemFooter organization={context.organization} />
    </div>
  );
}

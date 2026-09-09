import { ReactNode } from 'react';
import { DashApi } from '@/lib/dash-api';
import { GrowthOsSidebar } from './components/GrowthOsSidebar';
import { SovereignHeader } from '@/components/sovereign-mesh/SovereignHeader';
import { GrowthOsFooter } from './components/GrowthOsFooter';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { redirect } from 'next/navigation';
import { setupProgressService } from '@/lib/mesh/setup-progress.service';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { PortalAuthorizationError } from '@/lib/portal/portal-types';

export default async function ControlPlaneLayout({ 
  children, 
  params 
}: { 
  children: ReactNode; 
  params: Promise<{ organizationSlug: string }> 
}) {
  const resolvedParams = await params;
  const slugId = resolvedParams?.organizationSlug || '';
  const orgId = `org_${slugId}`;

  // 1. Secure Layout with Dual Gate: Platform Admin OR Authorized Tenant Context
  const nexusAuth = await getNexusAuthContext().catch(() => null);
  const isPlatformAdmin = nexusAuth?.isAuthenticated && (nexusAuth.role === 'SUPER_ADMIN' || nexusAuth.role === 'ADMIN');

  let portalContext = null;
  if (!isPlatformAdmin) {
    try {
      portalContext = await resolvePortalContext(slugId);
    } catch (err: any) {
      if (err instanceof PortalAuthorizationError) {
        if (err.code === 'NO_SESSION' || err.code === 'INVALID_SESSION') {
          redirect(`/portal/login?return=/growth-os/organizations/${slugId}`);
        }
        redirect(`/portal/unauthorized?reason=${err.code}`);
      }
      redirect(`/accessv2?return=/growth-os/organizations/${slugId}`);
    }
    if (!portalContext) {
      redirect(`/accessv2?return=/growth-os/organizations/${slugId}`);
    }
  }

  let overview = {
    id: orgId,
    name: slugId ? slugId.toUpperCase() : 'Organization',
    slug: slugId,
    hasHermes: false,
  };

  try {
    const fetched = await DashApi.controlPlane.getOverview(orgId);
    if (fetched) {
      overview = fetched;
    }
  } catch (err) {
    console.warn(`[ControlPlaneLayout] Notice:`, err);
  }

  // Load setup state to know which modules are active for the navbar
  let activeModules: string[] = [];
  try {
    const setupSummary = await setupProgressService.getEcosystemSetupState(slugId);
    if (setupSummary && setupSummary.modules) {
      activeModules = setupSummary.modules.map(m => m.productKey);
    }
  } catch (err) {
    console.warn('[ControlPlaneLayout] Setup summary fetch notice:', err);
  }

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header Navbar */}
      <SovereignHeader 
        organization={overview} 
        organizationSlug={slugId} 
        activeModules={activeModules} 
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-row min-w-0 overflow-hidden relative">
        <GrowthOsSidebar 
          slugId={slugId} 
          orgName={overview.name} 
          hasHermes={overview.hasHermes} 
        />
        <main className="flex-1 h-full min-w-0 bg-[#050505] text-zinc-100 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Bottom Status Footer */}
      <GrowthOsFooter slugId={slugId} />
    </div>
  );
}

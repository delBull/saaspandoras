import { ReactNode } from 'react';
import { DashApi } from '@/lib/dash-api';
import { GrowthOsSidebar } from './components/GrowthOsSidebar';
import { GrowthOsHeader } from './components/GrowthOsHeader';
import { GrowthOsFooter } from './components/GrowthOsFooter';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { redirect } from 'next/navigation';

export default async function ControlPlaneLayout({ 
  children, 
  params 
}: { 
  children: ReactNode; 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const slugId = resolvedParams?.id || '';
  const orgId = `org_${slugId}`;

  // 1. Secure Layout with Authentication
  const auth = await getNexusAuthContext();
  if (!auth.isAuthenticated) {
    redirect('/login');
  }

  // 2. Tenant isolation (only SUPER_ADMIN or ADMIN allowed in HQ)
  if (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN') {
    redirect('/unauthorized'); // Replace with your real fallback
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

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header Navbar */}
      <GrowthOsHeader slugId={slugId} orgName={overview.name} />

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

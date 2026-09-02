import { ReactNode } from 'react';
import { DashApi } from '@/lib/dash-api';
import { GrowthOsSidebar } from './components/GrowthOsSidebar';
import { GrowthOsHeader } from './components/GrowthOsHeader';
import { GrowthOsFooter } from './components/GrowthOsFooter';

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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Top Header Navbar */}
      <GrowthOsHeader slugId={slugId} orgName={overview.name} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        <GrowthOsSidebar 
          slugId={slugId} 
          orgName={overview.name} 
          hasHermes={overview.hasHermes} 
        />
        <main className="flex-1 min-w-0 bg-[#050505] text-zinc-100 overflow-y-auto pb-16">
          {children}
        </main>
      </div>

      {/* Bottom Status Footer */}
      <GrowthOsFooter slugId={slugId} />
    </div>
  );
}

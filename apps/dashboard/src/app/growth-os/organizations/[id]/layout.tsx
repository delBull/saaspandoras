import { ReactNode } from 'react';
import { DashApi } from '@/lib/dash-api';
import { GrowthOsSidebar } from './components/GrowthOsSidebar';

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
    hasHermes: true,
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <GrowthOsSidebar 
        slugId={slugId} 
        orgName={overview.name} 
        hasHermes={overview.hasHermes} 
      />
      <main className="flex-1 min-w-0 bg-slate-50 text-slate-900 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

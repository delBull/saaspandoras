import Link from 'next/link';
import { ReactNode } from 'react';
import { getOrganizationOverview } from './actions';
import { db } from '@/db';
import { installedProducts, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function ControlPlaneLayout({ children, params }: { children: ReactNode, params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams?.id;
  const orgId = `org_${slugId}`;

  // This layout is a server component, we can authorize and fetch capabilities here
  await getOrganizationOverview(orgId);
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slugId || '')
  });

  // Check capabilities
  const hermesInstall = project ? await db.query.installedProducts.findFirst({
      where: and(
          eq(installedProducts.projectId, project.id),
          eq(installedProducts.productFamily, 'HERMES')
      )
  }) : null;
  
  const hasHermes = !!hermesInstall;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6">
          <h2 className="text-white font-bold text-xl tracking-tight">Pandora's OS</h2>
          <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Control Plane</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href={`/growth-os/organizations/${slugId}`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Overview
          </Link>
          <Link href={`/growth-os/organizations/${slugId}/missions`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Mission Control
          </Link>
          <Link href={`/growth-os/organizations/${slugId}/governance`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Governance Center
          </Link>
          <Link href={`/growth-os/organizations/${slugId}/activity`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Activity & Audit
          </Link>
          
          {hasHermes && (
            <>
              <div className="pt-4 pb-2 px-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hermes</p>
              </div>
              <Link href={`/growth-os/organizations/${slugId}/hermes`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors pl-6">
                Hermes Overview
              </Link>
              <Link href={`/growth-os/organizations/${slugId}/hermes/conversations`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors pl-6">
                Conversations & Leads
              </Link>
              <Link href={`/growth-os/organizations/${slugId}/hermes/knowledge`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors pl-6">
                Knowledge & Soul
              </Link>
              <Link href={`/growth-os/organizations/${slugId}/hermes/integrations`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors pl-6">
                Integrations
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs">
          Organization ID:
          <div className="font-mono text-slate-500 truncate mt-1">{orgId}</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

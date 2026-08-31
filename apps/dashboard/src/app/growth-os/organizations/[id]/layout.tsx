import Link from 'next/link';
import { ReactNode } from 'react';
import { DashApi } from '@/lib/dash-api';

export default async function ControlPlaneLayout({ children, params }: { children: ReactNode, params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams?.id;
  const orgId = `org_${slugId}`;

  const overview = await DashApi.controlPlane.getOverview(orgId);
  const hasHermes = overview.hasHermes;

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
                Conversations
              </Link>
              <Link href={`/growth-os/organizations/${slugId}/hermes/knowledge`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors pl-6">
                Knowledge Base
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <span className="font-semibold text-gray-700">{overview.name}</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
              Active Context
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Link 
              href={`/profile/projects/${slugId}/manage`}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-300 transition-colors"
            >
              Manage Project
            </Link>
          </div>
        </header>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

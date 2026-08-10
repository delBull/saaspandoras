import Link from 'next/link';
import { ReactNode } from 'react';

export default async function ControlPlaneLayout({ children, params }: { children: ReactNode, params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orgId = resolvedParams?.id || 'org_snarai_sprint22';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6">
          <h2 className="text-white font-bold text-xl tracking-tight">Pandora's OS</h2>
          <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Control Plane</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href={`/growth-os/organizations/${orgId}`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Overview
          </Link>
          <Link href={`/growth-os/organizations/${orgId}/missions`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Mission Control
          </Link>
          <Link href={`/growth-os/organizations/${orgId}/governance`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Governance Center
          </Link>
          <Link href={`/growth-os/organizations/${orgId}/activity`} className="block px-4 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            Activity & Audit
          </Link>
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

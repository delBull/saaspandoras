import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Globe, Users, Zap, Shield, Database, LayoutDashboard, Settings, CreditCard, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import ConnectivityStudio from '@/components/admin/ConnectivityStudio';
import BillingStudio from '@/components/admin/BillingStudio';

export const metadata: Metadata = {
  title: 'Organization Portal | Pandora\'s OS',
};

// Tabs definition mapped to the 7 Studios
const STUDIOS = [
  { id: 'identity', label: 'Identity Studio', icon: <Shield className="w-4 h-4" /> },
  { id: 'ai', label: 'AI Studio', icon: <Database className="w-4 h-4" /> },
  { id: 'connectivity', label: 'Connectivity Studio', icon: <Globe className="w-4 h-4 text-indigo-400" /> },
  { id: 'knowledge', label: 'Knowledge Studio', icon: <Settings className="w-4 h-4" /> },
  { id: 'automation', label: 'Automation Studio', icon: <Zap className="w-4 h-4" /> },
  { id: 'billing', label: 'Billing Studio', icon: <CreditCard className="w-4 h-4 text-emerald-400" /> },
  { id: 'team', label: 'Team Studio', icon: <Users className="w-4 h-4" /> },
];

export default async function OrganizationPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ studio?: string }>;
}) {
  const { tenantId } = await params;
  const resolvedSearchParams = await searchParams;
  const activeStudio = resolvedSearchParams.studio || 'connectivity';

  // Basic guard (mock for now, should integrate with IdentitySDK)
  if (!tenantId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Organization Operations Center
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">TENANT: {tenantId.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Healthy
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Studio Nav */}
        <aside className="w-64 border-r border-zinc-800 bg-zinc-900/20 p-4 flex flex-col gap-2 overflow-y-auto hidden md:flex">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2">Studios</div>
          {STUDIOS.map((studio) => (
            <Link
              key={studio.id}
              href={`/org/${tenantId}?studio=${studio.id}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeStudio === studio.id
                  ? 'bg-zinc-800 text-white shadow-lg shadow-black/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {studio.icon}
              {studio.label}
            </Link>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto">
            {activeStudio === 'connectivity' && <ConnectivityStudio tenantId={tenantId} />}
            {activeStudio === 'billing' && <BillingStudio tenantId={tenantId} tier="PROFESSIONAL" />}
            
            {/* Placeholders for other studios */}
            {!['connectivity', 'billing'].includes(activeStudio) && (
              <div className="flex flex-col items-center justify-center h-96 border border-zinc-800/60 rounded-3xl bg-zinc-900/30 text-center p-8">
                <Settings className="w-12 h-12 text-zinc-700 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">
                  {STUDIOS.find(s => s.id === activeStudio)?.label}
                </h2>
                <p className="text-sm text-zinc-400 max-w-md">
                  This studio is under construction. Pandora's OS v4.2 focuses on Connectivity and Billing in this iteration.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

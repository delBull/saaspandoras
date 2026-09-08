import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { CampaignDomainService } from '@/lib/marketing/campaigns.service';
import { GlassCard } from '@/components/ui/glass-card';
import { Target, TrendingUp, Users, Activity, Play, Plus } from 'lucide-react';

export default async function PortalMarketAttackPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  
  // 1. Verify auth context
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  // 2. Capabilities check
  if (!portalCtx.tenant.permissions.includes('growth.market_attack')) {
    redirect(`/portal/${organizationSlug}/overview?error=unauthorized`);
  }

  // 3. Fetch data via Domain Service
  const service = new CampaignDomainService(portalCtx.tenant);
  
  // Note: We try/catch in case the analytics permission is missing, 
  // but usually market_attack and analytics go together for owners/admins.
  let performance: any[] = [];
  try {
    performance = await service.getCampaignPerformance();
  } catch (err) {
    console.warn("User lacks analytics capability for market attack page:", err);
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" /> Market Attack
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Deploy demand drafts and track campaign performance for {portalCtx.organization.name}.
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black font-semibold rounded-xl text-sm hover:bg-emerald-400 transition-colors">
          <Plus size={16} /> New Draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* ACTIVE CAMPAIGNS SUMMARY */}
         <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="p-5 flex flex-col gap-3">
               <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                  <Activity size={16} className="text-emerald-400" /> Total Active
               </div>
               <div className="text-3xl font-bold text-white">
                  {performance.filter(p => p.status === 'active').length}
               </div>
            </GlassCard>
            <GlassCard className="p-5 flex flex-col gap-3">
               <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                  <Users size={16} className="text-emerald-400" /> Total Leads
               </div>
               <div className="text-3xl font-bold text-white">
                  {performance.reduce((acc, curr) => acc + (curr.leads || 0), 0)}
               </div>
            </GlassCard>
            <GlassCard className="p-5 flex flex-col gap-3 md:col-span-2">
               <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                  <TrendingUp size={16} className="text-emerald-400" /> Top Performer Angle
               </div>
               <div className="text-xl font-bold text-emerald-400 truncate">
                  {performance.length > 0 ? performance[0].angle || 'Direct Response' : 'N/A'}
               </div>
               <div className="text-xs text-zinc-500 font-mono">
                  Score: {performance.length > 0 ? performance[0].score : '0.0'}
               </div>
            </GlassCard>
         </div>

         {/* PERFORMANCE LIST */}
         <div className="lg:col-span-3">
            <GlassCard className="p-1">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="text-xs text-zinc-500 uppercase bg-white/[0.02] border-b border-white/5">
                        <tr>
                           <th className="px-6 py-4 font-medium">Campaign</th>
                           <th className="px-6 py-4 font-medium">Strategy DNA</th>
                           <th className="px-6 py-4 font-medium">Platform</th>
                           <th className="px-6 py-4 font-medium">Performance (Leads/Purchases)</th>
                           <th className="px-6 py-4 font-medium text-right">Score</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {performance.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                 No campaigns launched yet. Create a demand draft to begin.
                              </td>
                           </tr>
                        ) : (
                           performance.map((c) => (
                              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
                                       <span className="font-medium text-white">{c.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-xs text-zinc-300">Angle: {c.angle || 'direct'}</span>
                                       <span className="text-[10px] text-zinc-500">Emotion: {c.emotion || 'neutral'}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-white/5 rounded-md text-xs font-mono text-zinc-400 capitalize">
                                       {c.platform || 'Multi'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                       <div className="flex flex-col">
                                          <span className="text-xs text-zinc-500">Leads</span>
                                          <span className="font-mono text-white">{c.leads || 0}</span>
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-xs text-zinc-500">Purchases</span>
                                          <span className="font-mono text-emerald-400">{c.purchases || 0}</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
                                       {Number(c.score || 0).toFixed(1)}
                                    </div>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </GlassCard>
         </div>
      </div>
    </div>
  );
}

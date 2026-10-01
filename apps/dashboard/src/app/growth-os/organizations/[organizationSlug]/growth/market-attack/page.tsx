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
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-emerald-400" /> Campañas & Market Attack
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Despliega borradores de demanda, automatizaciones y rastrea el rendimiento de campañas para {portalCtx.organization.name}.
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]">
          <Plus size={18} /> Nuevo Draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* ACTIVE CAMPAIGNS SUMMARY */}
         <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 flex flex-col gap-3 rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-md shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />
               <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold tracking-wide uppercase relative z-10">
                  <Activity size={16} className="text-emerald-400" /> Total Activas
               </div>
               <div className="text-4xl font-black text-white tracking-tighter relative z-10">
                  {performance.filter(p => p.status === 'active').length}
               </div>
            </div>
            <div className="p-6 flex flex-col gap-3 rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-md shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />
               <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold tracking-wide uppercase relative z-10">
                  <Users size={16} className="text-emerald-400" /> Total Leads
               </div>
               <div className="text-4xl font-black text-white tracking-tighter relative z-10">
                  {performance.reduce((acc, curr) => acc + (curr.leads || 0), 0)}
               </div>
            </div>
            <div className="p-6 flex flex-col gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-950/10 backdrop-blur-md shadow-xl md:col-span-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
               <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold tracking-wide uppercase relative z-10">
                  <TrendingUp size={16} className="text-emerald-400" /> Top Performer Angle
               </div>
               <div className="text-2xl font-black text-emerald-400 truncate relative z-10 tracking-tight">
                  {performance.length > 0 ? performance[0].angle || 'Direct Response' : 'N/A'}
               </div>
               <div className="text-xs text-zinc-500 font-mono relative z-10">
                  Score de Conversión: <span className="text-white font-bold">{performance.length > 0 ? performance[0].score : '0.0'}</span>
               </div>
            </div>
         </div>

         {/* PERFORMANCE LIST */}
         <div className="lg:col-span-3">
            <div className="rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase bg-white/[0.02] border-b border-white/5">
                        <tr>
                           <th className="px-6 py-5">Campaña</th>
                           <th className="px-6 py-5">DNA Estratégico</th>
                           <th className="px-6 py-5">Plataforma</th>
                           <th className="px-6 py-5">Rendimiento (Leads / Compras)</th>
                           <th className="px-6 py-5 text-right">Hermes Score</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {performance.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                 <div className="flex flex-col items-center justify-center gap-3">
                                   <Target className="w-8 h-8 text-zinc-700" />
                                   <p>No hay campañas lanzadas aún. Crea un draft de demanda para comenzar.</p>
                                 </div>
                              </td>
                           </tr>
                        ) : (
                           performance.map((c) => (
                              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-zinc-600'}`} />
                                       <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{c.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                       <span className="text-xs text-zinc-300 font-mono bg-white/5 px-2 py-0.5 rounded-md w-fit border border-white/10">Ángulo: {c.angle || 'direct'}</span>
                                       <span className="text-[10px] text-zinc-500 font-mono uppercase">Emoción: {c.emotion || 'neutral'}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 capitalize">
                                       {c.platform || 'Multi'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-6">
                                       <div className="flex flex-col">
                                          <span className="text-[10px] uppercase font-bold text-zinc-500">Leads</span>
                                          <span className="font-mono text-white text-base">{c.leads || 0}</span>
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[10px] uppercase font-bold text-zinc-500">Compras</span>
                                          <span className="font-mono text-emerald-400 text-base">{c.purchases || 0}</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5 text-right">
                                    <div className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-sm font-bold shadow-sm">
                                       {Number(c.score || 0).toFixed(1)}
                                    </div>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

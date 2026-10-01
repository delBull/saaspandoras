import { DashApi } from '@/lib/dash-api';
import { Users, DollarSign, Tag, ArrowRight, Activity } from 'lucide-react';
import { NewLeadModal } from './NewLeadModal';

export default async function PipelinePage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams.organizationSlug;
  const orgId = `org_${slugId}`;

  let pipelineData = {
    leads: [] as any[],
    stages: [] as any[],
  };

  try {
    pipelineData = await DashApi.growth.getPipeline(orgId);
  } catch (err) {
    console.warn('[PipelinePage] Error fetching pipeline:', err);
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Users className="w-8 h-8 text-indigo-400" />
            Pipeline & CRM Soberano
          </h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Gestión y cualificación de inversionistas y prospectos para {slugId.toUpperCase()}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NewLeadModal organizationSlug={slugId} />
        </div>
      </div>

      {/* Pipeline Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {pipelineData.stages.map((stage) => (
          <div key={stage.id} className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-md p-5 shadow-xl overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono relative z-10">{stage.label}</p>
            <p className="text-3xl font-black text-white font-mono mt-2 tracking-tighter relative z-10">{stage.count}</p>
            <p className="text-xs text-indigo-400 font-mono mt-1 font-bold relative z-10">
              ${(stage.totalValue || 0).toLocaleString()} USD
            </p>
          </div>
        ))}
      </div>

      {/* Leads List */}
      <div className="rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
          <h2 className="font-black text-white text-lg tracking-tight">Prospectos Activos ({pipelineData.leads.length})</h2>
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono bg-white/5 px-3 py-1 rounded-md border border-white/10">Sincronizado con Hermes Relational Mesh</span>
        </div>

        {pipelineData.leads.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg">
              <Users className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-xl font-black text-white mb-2 tracking-tight">Sin prospectos activos en el pipeline</p>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Las conversaciones inteligentes de Hermes y los formularios de captura calificarán y sincronizarán prospectos en tiempo real.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 relative z-10">
            {pipelineData.leads.map((lead) => (
              <div key={lead.id} className="p-5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-white text-base group-hover:text-indigo-400 transition-colors">{lead.name}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-mono font-bold border border-indigo-500/20">
                      Score: {lead.score}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono">
                    {lead.email && <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">{lead.email}</span>}
                    {lead.phone && <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">{lead.phone}</span>}
                    <span className="text-zinc-500 uppercase">Origen: {lead.source}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {lead.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] uppercase font-bold tracking-wider bg-white/[0.04] border border-white/10 text-zinc-300 px-2 py-1 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block shadow-sm">
                      {lead.stage}
                    </span>
                    <span className="text-sm font-black font-mono text-zinc-300 mt-2 block tracking-tight">
                      ${(lead.estimatedValue || 0).toLocaleString()} USD
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

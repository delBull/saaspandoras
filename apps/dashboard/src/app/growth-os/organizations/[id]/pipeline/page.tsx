import { DashApi } from '@/lib/dash-api';
import { Users, Plus, DollarSign, Tag, ArrowRight, Activity } from 'lucide-react';

export default async function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams.id;
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
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Users className="w-7 h-7 text-indigo-400" />
            Pipeline & CRM Soberano
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gestión y cualificación de inversionistas y prospectos para {slugId.toUpperCase()}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg shadow-indigo-600/20">
            <Plus className="w-4 h-4" />
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* Pipeline Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {pipelineData.stages.map((stage) => (
          <div key={stage.id} className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">{stage.label}</p>
            <p className="text-2xl font-bold text-white font-mono mt-1">{stage.count}</p>
            <p className="text-xs text-indigo-400 font-mono mt-1">
              ${(stage.totalValue || 0).toLocaleString()} USD
            </p>
          </div>
        ))}
      </div>

      {/* Leads List */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Prospectos Activos ({pipelineData.leads.length})</h2>
          <span className="text-[11px] text-zinc-500 font-mono">Sincronizado con Hermes Relational Mesh</span>
        </div>

        {pipelineData.leads.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">Sin prospectos activos en el pipeline</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Las conversaciones inteligentes de Hermes y los formularios de captura calificarán y sincronizarán prospectos en tiempo real.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pipelineData.leads.map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{lead.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/20">
                      Score: {lead.score}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                    {lead.email && <span>{lead.email}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                    <span>Origen: {lead.source}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {lead.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] bg-white/[0.04] border border-white/10 text-zinc-300 px-2 py-0.5 rounded-md font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 block">
                      {lead.stage}
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-300 mt-1 block">
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

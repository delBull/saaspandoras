import { DashApi } from '@/lib/dash-api';
import { Users, Filter, Plus, DollarSign, Tag, ArrowRight } from 'lucide-react';

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-indigo-600" />
            Pipeline & CRM Soberano
          </h1>
          <p className="text-slate-500 mt-1">
            Gestión y cualificación de inversionistas y prospectos para {slugId.toUpperCase()}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* Pipeline Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {pipelineData.stages.map((stage) => (
          <div key={stage.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stage.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stage.count}</p>
            <p className="text-xs text-indigo-600 font-medium mt-1">
              ${(stage.totalValue || 0).toLocaleString()} USD
            </p>
          </div>
        ))}
      </div>

      {/* Leads List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Prospectos Activos ({pipelineData.leads.length})</h2>
          <span className="text-xs text-slate-400">Sincronizado con Hermes Relational Mesh</span>
        </div>

        {pipelineData.leads.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No hay prospectos en el pipeline todavía. Las conversaciones de Hermes calificarán leads automáticamente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pipelineData.leads.map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{lead.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                      Score: {lead.score}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {lead.email && <span>{lead.email}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                    <span>Origen: {lead.source}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {lead.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 block">
                      {lead.stage}
                    </span>
                    <span className="text-xs font-medium text-slate-700 mt-1 block">
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

import { DashApi } from '@/lib/dash-api';
import { Mail, Send, Eye, MousePointer, Plus, FileCode, CheckCircle2 } from 'lucide-react';

export default async function EmailMarketingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams.id;
  const orgId = `org_${slugId}`;

  let emailData = {
    templates: [] as any[],
    campaigns: [] as any[],
    stats: { totalSent: 0, avgOpenRate: 0, avgClickRate: 0 },
  };

  try {
    emailData = await DashApi.growth.getEmailMarketing(orgId);
  } catch (err) {
    console.warn('[EmailMarketingPage] Error fetching email marketing:', err);
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Mail className="w-7 h-7 text-indigo-600" />
            Email Marketing & Templates
          </h1>
          <p className="text-slate-500 mt-1">
            Plantillas institucionales y campañas de comunicación para {slugId.toUpperCase()}.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Enviados</p>
            <p className="text-2xl font-bold text-slate-900">{emailData.stats.totalSent}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa de Apertura</p>
            <p className="text-2xl font-bold text-slate-900">{emailData.stats.avgOpenRate}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <MousePointer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa de Clics</p>
            <p className="text-2xl font-bold text-slate-900">{emailData.stats.avgClickRate}%</p>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Plantillas Oficiales de Tenant</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emailData.templates.map((tmpl) => (
            <div key={tmpl.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {tmpl.category}
                </span>
                <h3 className="font-semibold text-slate-900 mt-2">{tmpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Asunto: {tmpl.subject}</p>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{tmpl.previewText}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{tmpl.variables.length} variables</span>
                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Personalizar →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Historial de Campañas</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {emailData.campaigns.map((camp) => (
            <div key={camp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-slate-900">{camp.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Destinatarios: {camp.recipientsCount}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${camp.status === 'SENT' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {camp.status}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {camp.openRate > 0 ? `${camp.openRate}% Apertura` : 'Programada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Mail className="w-7 h-7 text-indigo-400" />
            Email Marketing & Templates
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Plantillas institucionales y campañas de comunicación para {slugId.toUpperCase()}.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg shadow-indigo-600/20">
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Total Enviados</p>
            <p className="text-2xl font-bold text-white font-mono">{emailData.stats.totalSent}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Tasa de Apertura</p>
            <p className="text-2xl font-bold text-white font-mono">{emailData.stats.avgOpenRate}%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl">
            <MousePointer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Tasa de Clics</p>
            <p className="text-2xl font-bold text-white font-mono">{emailData.stats.avgClickRate}%</p>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Plantillas Oficiales de Tenant</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emailData.templates.map((tmpl) => (
            <div key={tmpl.id} className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300">
                  {tmpl.category}
                </span>
                <h3 className="font-semibold text-white mt-2.5 text-sm">{tmpl.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 font-mono">Asunto: {tmpl.subject}</p>
                <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{tmpl.previewText}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 font-mono">{tmpl.variables.length} variables</span>
                <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Personalizar →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Historial de Campañas ({emailData.campaigns.length})</h2>
          <span className="text-[11px] text-zinc-500 font-mono">Despacho Soberano via Resend API</span>
        </div>

        {emailData.campaigns.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">No hay campañas ejecutadas</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Crea tu primera campaña para comunicar novedades de gobernanza o lanzamientos a la comunidad.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {emailData.campaigns.map((c) => (
              <div key={c.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">{c.name}</h4>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Enviado a {c.recipientsCount} destinatarios · {new Date(c.sentAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-emerald-400 font-semibold">{c.openRate}% Apertura</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { DashApi } from '@/lib/dash-api';
import { Mail, Send, Eye, MousePointer, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';
import { NewCampaignModal } from './NewCampaignModal';

export default async function EmailMarketingPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams.organizationSlug;
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
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <Mail className="w-8 h-8 text-indigo-400" />
            Email Marketing & Templates
          </h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Plantillas institucionales y campañas de comunicación para {slugId.toUpperCase()}.
          </p>
        </div>
        <NewCampaignModal
          organizationSlug={slugId}
          templates={emailData.templates.map(t => ({ id: t.id, name: t.name }))}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl p-6 shadow-xl flex items-center gap-5 overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl relative z-10 shadow-inner">
            <Send className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Total Enviados</p>
            <p className="text-3xl font-black text-white font-mono mt-1 tracking-tighter">{emailData.stats.totalSent}</p>
          </div>
        </div>

        <div className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl p-6 shadow-xl flex items-center gap-5 overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl relative z-10 shadow-inner">
            <Eye className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Tasa de Apertura</p>
            <p className="text-3xl font-black text-white font-mono mt-1 tracking-tighter">{emailData.stats.avgOpenRate}%</p>
          </div>
        </div>

        <div className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl p-6 shadow-xl flex items-center gap-5 overflow-hidden group hover:border-violet-500/30 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-4 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl relative z-10 shadow-inner">
            <MousePointer className="w-7 h-7" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Tasa de Clics</p>
            <p className="text-3xl font-black text-white font-mono mt-1 tracking-tighter">{emailData.stats.avgClickRate}%</p>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="space-y-5">
        <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest font-mono">Plantillas Oficiales de Tenant</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {emailData.templates.map((tmpl) => (
            <div key={tmpl.id} className="relative rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl p-6 shadow-xl space-y-4 flex flex-col justify-between group hover:border-indigo-500/30 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300">
                  {tmpl.category}
                </span>
                <h3 className="font-black text-white mt-4 text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{tmpl.name}</h3>
                <p className="text-xs text-zinc-400 mt-2 font-mono bg-white/5 p-2 rounded-lg border border-white/10">Asunto: {tmpl.subject}</p>
                <p className="text-sm text-zinc-500 mt-3 line-clamp-2 leading-relaxed">{tmpl.previewText}</p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">{tmpl.variables.length} variables</span>
                <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                  Personalizar <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns Section */}
      <div className="rounded-3xl border border-white/5 bg-[#09090D]/80 backdrop-blur-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
          <h2 className="font-black text-white text-lg tracking-tight">Historial de Campañas ({emailData.campaigns.length})</h2>
          <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-wider bg-white/5 px-3 py-1 rounded-md border border-white/10">Despacho Soberano via Resend API</span>
        </div>

        {emailData.campaigns.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg">
              <Mail className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-xl font-black text-white mb-2 tracking-tight">No hay campañas ejecutadas</p>
            <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
              Crea tu primera campaña para comunicar novedades de gobernanza o lanzamientos a la comunidad.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 relative z-10">
            {emailData.campaigns.map((c) => (
              <div key={c.id} className="p-5 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                <div>
                  <h4 className="font-black text-white text-base group-hover:text-indigo-400 transition-colors tracking-tight">{c.name}</h4>
                  <p className="text-xs text-zinc-500 font-mono mt-1">Enviado a {c.recipientsCount} destinatarios · {new Date(c.sentAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">{c.openRate}% Apertura</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

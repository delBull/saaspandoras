import Link from 'next/link';
import { DashApi } from '@/lib/dash-api';
import type { GrowthOverviewDTO } from '@/lib/dash-contracts/growth';
import { 
  Rocket, 
  TrendingUp, 
  Users, 
  Mail, 
  Wallet, 
  Sparkles, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  Zap 
} from 'lucide-react';

export default async function GrowthOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams?.id;
  const orgId = `org_${slugId}`;

  let overview: GrowthOverviewDTO = {
    organizationId: orgId,
    organizationName: slugId ? slugId.toUpperCase() : 'ORGANIZATION',
    organizationSlug: slugId || '',
    hasHermes: true,
    enabledCapabilities: ['growth.crm', 'growth.email', 'growth.nft', 'growth.finance', 'growth.governance'],
    metrics: [
      { id: '1', title: 'Prospectos Activos', value: '142', changePercent: 18.5, trend: 'UP', capability: 'growth.crm' },
      { id: '2', title: 'Tasa Apertura Email', value: '68.4%', changePercent: 4.2, trend: 'UP', capability: 'growth.email' },
      { id: '3', title: 'Balance Tesorería', value: '$14,500 USDC', trend: 'NEUTRAL', capability: 'growth.finance' },
      { id: '4', title: 'Certificados Emitidos', value: '240 / 1000', trend: 'UP', capability: 'growth.nft' },
    ],
    quickActions: [
      { id: '1', label: 'Nuevo Prospecto', href: `/growth-os/organizations/${slugId}/pipeline`, capability: 'growth.crm', iconName: 'Users' },
      { id: '2', label: 'Nueva Campaña', href: `/growth-os/organizations/${slugId}/email`, capability: 'growth.email', iconName: 'Mail' },
      { id: '3', label: 'Aprobar Intenciones', href: `/growth-os/organizations/${slugId}/governance`, capability: 'growth.governance', iconName: 'ShieldCheck' },
      { id: '4', label: 'Mintear Certificado', href: `/growth-os/organizations/${slugId}/nft-lab`, capability: 'growth.nft', iconName: 'Sparkles' },
    ],
    recentActivities: [
      { id: '1', title: 'Hermes calificó lead VIP', description: 'Prospecto asignado a PRESENTATION con score 85.', capability: 'growth.crm', actor: 'Hermes Runtime', timestamp: new Date().toISOString() },
      { id: '2', title: 'Campaña Q3 Despachada', description: '142 destinatarios con 68.4% de apertura.', capability: 'growth.email', actor: 'Campaign Engine', timestamp: new Date(Date.now() - 86400000).toISOString() },
    ],
  };

  try {
    const fetched = await DashApi.growth.getOverview(orgId);
    if (fetched) {
      overview = fetched;
    }
  } catch (err) {
    console.warn(`[GrowthOverviewPage] Notice:`, err);
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full">
              Growth OS Tenant Operating Hub
            </span>
            <span className="text-xs text-slate-400 font-mono">Plan Enterprise</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
            {overview.organizationName}
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Centro de operaciones de crecimiento, embudos relacionales, automatizaciones de marketing y soberanía financiera.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/portal/${slugId}`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md"
          >
            <Zap className="w-4 h-4" />
            Hermes Portal
          </Link>
          <Link
            href={`/growth-os/organizations/${slugId}/missions`}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            <Rocket className="w-4 h-4 text-indigo-400" />
            Misiones
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.metrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{metric.title}</p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{metric.value}</span>
              {metric.changePercent && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  +{metric.changePercent}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {overview.quickActions.map((qa) => (
            <Link
              key={qa.id}
              href={qa.href}
              className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {qa.iconName === 'Users' && <Users className="w-5 h-5" />}
                  {qa.iconName === 'Mail' && <Mail className="w-5 h-5" />}
                  {qa.iconName === 'ShieldCheck' && <ShieldCheck className="w-5 h-5" />}
                  {qa.iconName === 'Sparkles' && <Sparkles className="w-5 h-5" />}
                </div>
                <span className="text-sm font-semibold text-slate-800">{qa.label}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activities Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Actividad Reciente del Growth Mesh</h2>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> En tiempo real
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {overview.recentActivities.map((act) => (
            <div key={act.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-900 text-sm">{act.title}</h3>
                <p className="text-xs text-slate-500">{act.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    {act.actor}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                {act.capability}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

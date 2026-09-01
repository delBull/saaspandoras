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
  Zap,
  Layers,
  Activity,
  Plus
} from 'lucide-react';

export default async function GrowthOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams?.id;
  const orgId = `org_${slugId}`;

  let overview: GrowthOverviewDTO = {
    organizationId: orgId,
    organizationName: slugId ? slugId.toUpperCase() : 'ORGANIZATION',
    organizationSlug: slugId || '',
    planTier: undefined,
    hasHermes: false,
    enabledCapabilities: [],
    metrics: [],
    quickActions: [],
    recentActivities: [],
  };

  try {
    const fetched = await DashApi.growth.getOverview(orgId);
    if (fetched) {
      overview = fetched;
    }
  } catch (err) {
    console.warn(`[GrowthOverviewPage] Live fetch notice:`, err);
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── HEADER COMMAND BANNER (Hermes Portal Glass Style) ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-violet-500/10 text-violet-300 border border-violet-500/20 px-3 py-1 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500" />
                </span>
                GROWTH OS MESH ENGINE
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {overview.planTier ? `Plan ${overview.planTier.toUpperCase()}` : 'Plan STARTER'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {overview.organizationName}
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Consola operativa de crecimiento comercial, gestión de prospectos de inversión, automatización relacional y gobernanza de capital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/portal/${slugId}/ecosystem`}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all backdrop-blur-sm"
            >
              <Layers className="w-4 h-4 text-zinc-400" />
              Sovereign Mesh Hub
            </Link>
            {overview.hasHermes && (
              <Link
                href={`/portal/${slugId}/overview`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
              >
                <Zap className="w-4 h-4" />
                Hermes AI Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── METRICS GRID (Real Database Signals & Accurate Status Badges) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overview.metrics.map((metric) => (
          <div 
            key={metric.id} 
            className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md shadow-lg space-y-3 hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">{metric.title}</p>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                metric.status === 'LIVE'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : metric.status === 'DATABASE'
                  ? 'text-violet-400 bg-violet-500/10 border-violet-500/20'
                  : metric.status === 'PENDING'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-zinc-500 bg-white/5 border-white/10'
              }`}>
                {metric.status || 'DATABASE'}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white tracking-tight">{metric.value}</span>
              {metric.changePercent && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-500/20 font-mono">
                  <TrendingUp className="w-3 h-3" />
                  +{metric.changePercent}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS (Hermes Glass Cards) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <Activity className="w-4 h-4 text-violet-400" />
            Acciones de Despacho Rápido
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            {overview.enabledCapabilities?.length || 0} Capacidades Activas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {overview.quickActions.map((qa) => (
            <Link
              key={qa.id}
              href={qa.href}
              className="p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-violet-500/40 rounded-2xl shadow-lg transition-all flex items-center justify-between group backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-all shadow-md">
                  {qa.iconName === 'Users' && <Users className="w-4 h-4" />}
                  {qa.iconName === 'Mail' && <Mail className="w-4 h-4" />}
                  {qa.iconName === 'ShieldCheck' && <ShieldCheck className="w-4 h-4" />}
                  {qa.iconName === 'Sparkles' && <Sparkles className="w-4 h-4" />}
                </div>
                <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{qa.label}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── RECENT ACTIVITIES (Live Real-Time Event Stream) ── */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
          <h2 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-zinc-400" />
            Registro de Actividad del Growth Mesh
          </h2>
          <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
            {overview.recentActivities && overview.recentActivities.length > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Stream Activo
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                En Espera de Eventos
              </>
            )}
          </span>
        </div>

        {overview.recentActivities && overview.recentActivities.length > 0 ? (
          <div className="divide-y divide-white/5">
            {overview.recentActivities.map((act) => (
              <div key={act.id} className="p-5 flex items-start justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">{act.title}</h3>
                  <p className="text-xs text-zinc-400">{act.description}</p>
                  <div className="flex items-center gap-2 pt-1 font-mono">
                    <span className="text-[10px] font-bold bg-white/5 text-zinc-400 px-2 py-0.5 rounded-md border border-white/10">
                      {act.actor}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300">
                  {act.capability}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-xs text-zinc-400 font-medium">No hay eventos registrados aún en el flujo comercial.</p>
            <p className="text-[11px] text-zinc-600 font-mono">Los nuevos prospectos, campañas y ejecuciones de gobernanza aparecerán en este stream.</p>
          </div>
        )}
      </div>
    </div>
  );
}

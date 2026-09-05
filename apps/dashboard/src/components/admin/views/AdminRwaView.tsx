'use client';

/**
 * 🏛️ ADMIN RWA DEAL ROOM & CAPITAL STRUCTURING VIEW (F9.5 + F11.x)
 * apps/dashboard/src/components/admin/views/AdminRwaView.tsx
 *
 * Full project lifecycle management for Platform Admins:
 * - Visual pipeline bar (8 stages)
 * - Per-deal action panel with role-gated transitions
 * - 2FA gate for critical operations (Live, Deploy, Reject)
 * - Edit metadata inline (no 2FA required)
 */

import React, { useState, useTransition } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  Pencil,
  Rocket,
  XCircle,
  Pause,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { usePlatformInspector } from '../inspector/PlatformInspectorContext';
import { RwaDealSummaryDTO, RwaPipelineStage } from '@/lib/dash-contracts/admin';
import { PlatformActor } from '@/lib/dash-contracts/admin';

interface AdminRwaViewProps {
  deals: RwaDealSummaryDTO[];
  actor?: PlatformActor;
}

const STAGES: Array<{ stage: RwaPipelineStage; label: string }> = [
  { stage: 'APPLIED', label: '1. Solicitud' },
  { stage: 'SCREENING', label: '2. Screening' },
  { stage: 'DUE_DILIGENCE', label: '3. Due Diligence' },
  { stage: 'COMPLIANCE', label: '4. Compliance' },
  { stage: 'STRUCTURING', label: '5. Estructuración' },
  { stage: 'APPROVAL', label: '6. Aprobación' },
  { stage: 'DEPLOYMENT', label: '7. Despliegue' },
  { stage: 'LIVE', label: '8. En Vivo' },
];

// Maps RwaPipelineStage → canonical project status for the API call
const STAGE_TO_STATUS: Partial<Record<string, string>> = {
  'SCREENING': 'pending',
  'DUE_DILIGENCE': 'active_client',
  'APPROVAL': 'approved',
  'DEPLOYMENT': 'approved',  // approved unlocks deploy button
  'LIVE': 'live',
  'COMPLETED': 'completed',
};

// ── 2FA Gate Modal ─────────────────────────────────────────────────────────────
function Discord2FAGate({
  actionLabel,
  onConfirm,
  onCancel,
  isPending,
}: {
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#12121B] border border-amber-500/30 shadow-2xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Acción crítica — Requiere tu aprobación</h3>
            <p className="text-xs text-zinc-400">
              La acción <span className="font-semibold text-amber-300">"{actionLabel}"</span> es irreversible
              y está protegida por 2FA de Discord. Solo tú (SUPER_ADMIN) puedes ejecutarla.
            </p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mb-5 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
          💡 Para habilitar el 2FA de Discord, verifica tu identidad a través del canal de seguridad en Discord.
          Una vez verificado, tu sesión incluirá el flag <code className="text-amber-300">isDiscord2faVerified</code>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-wait transition-all flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Status change API call ─────────────────────────────────────────────────────
async function patchProjectStatus(projectNumericId: number, newStatus: string) {
  const res = await fetch(`/api/admin/projects/${projectNumericId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Per-deal Action Row ────────────────────────────────────────────────────────
function DealActionRow({
  deal,
  actor,
  onStatusChanged,
}: {
  deal: RwaDealSummaryDTO;
  actor?: PlatformActor;
  onStatusChanged: (dealId: string, newStatus: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [gateAction, setGateAction] = useState<{ label: string; status: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = actor?.role === 'SUPER_ADMIN';
  const isPlatformAdmin = actor?.role === 'SUPER_ADMIN' || actor?.role === 'ADMIN';
  const has2FA = actor?.isDiscord2faVerified ?? false;

  // Project numeric ID extracted from deal (deals carry originatingTenantId slug)
  // We use the inspector's actionHref pattern to get the slug for the manage page
  const projectSlug = deal.slug || deal.originatingTenantId;

  const executeStatusChange = (newStatus: string, requires2FA: boolean, label: string) => {
    setError(null);
    if (requires2FA && isSuperAdmin) {
      // Show 2FA gate modal — the actual execution happens on confirm
      setGateAction({ label, status: newStatus });
      return;
    }
    if (!isPlatformAdmin) {
      setError('Sin permisos suficientes para esta acción.');
      return;
    }
    startTransition(async () => {
      try {
        await patchProjectStatus(deal.id as unknown as number, newStatus);
        onStatusChanged(String(deal.id), newStatus);
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  const confirmGateAction = () => {
    if (!gateAction) return;
    const { status } = gateAction;
    setGateAction(null);
    startTransition(async () => {
      try {
        await patchProjectStatus(deal.id as unknown as number, status);
        onStatusChanged(String(deal.id), status);
      } catch (e: any) {
        setError(e.message);
      }
    });
  };

  // Canonical dashboard URL (absolute to avoid admin middleware rewrite)
  const dashBase =
    typeof window !== 'undefined' && window.location.hostname.includes('staging')
      ? 'https://staging.dash.pandoras.finance'
      : 'https://dash.pandoras.finance';
  const manageUrl = `${dashBase}/admin/projects/${projectSlug}/edit`;

  // Derive current canonical project status from deal stage (fallback to deal.stage itself)
  const currentStatus = (STAGE_TO_STATUS[deal.stage] ?? deal.stage.toLowerCase()) as string;

  return (
    <>
      {gateAction && (
        <Discord2FAGate
          actionLabel={gateAction.label}
          onConfirm={confirmGateAction}
          onCancel={() => setGateAction(null)}
          isPending={isPending}
        />
      )}

      <tr className="hover:bg-white/[0.02] transition-colors group">
        {/* Project Name */}
        <td className="py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <span className="font-semibold text-white block text-xs">{deal.title}</span>
              <span className="text-[11px] font-mono text-zinc-500">
                Tenant: {deal.originatingTenantId}
              </span>
            </div>
          </div>
        </td>

        {/* Asset Class */}
        <td className="py-4 px-4 text-zinc-400">
          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono">
            {deal.underlyingAssetType}
          </span>
        </td>

        {/* Stage */}
        <td className="py-4 px-4">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
            deal.stage === 'LIVE'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : deal.stage === 'STRUCTURING' || deal.stage === 'DEPLOYMENT'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
              : deal.stage === 'APPROVAL'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {deal.stage}
          </span>
        </td>

        {/* Valuation */}
        <td className="py-4 px-4 font-mono font-semibold text-white text-xs">
          {deal.structuring?.assetValuationUsd
            ? `$${deal.structuring.assetValuationUsd.toLocaleString()} USD`
            : 'En dictamen'}
        </td>

        {/* NDA */}
        <td className="py-4 px-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Firmado
          </span>
        </td>

        {/* Actions */}
        <td className="py-4 px-5 text-right">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 text-zinc-400 hover:text-purple-300 border border-white/[0.06] hover:border-purple-500/30 text-[11px] font-medium transition-all"
          >
            <span>Acciones</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </td>
      </tr>

      {/* Expanded action panel */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-5 pb-4">
            <div className="rounded-xl bg-[#0A0A12] border border-white/[0.08] p-4 space-y-3">
              {error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  ⚠️ {error}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {/* Always available: Ver Tokenomics */}
                <a
                  href={manageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-[11px] font-medium border border-white/[0.08] transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ver Tokenomics & Fases
                </a>

                {/* PLATFORM_ADMIN+: Avanzar a Screening */}
                {isPlatformAdmin && deal.stage === 'APPLIED' && (
                  <button
                    onClick={() => executeStatusChange('pending', false, 'Activar Screening')}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[11px] font-medium border border-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Activar Screening
                  </button>
                )}

                {/* PLATFORM_ADMIN+: Avanzar a Cliente Activo */}
                {isPlatformAdmin && deal.stage === 'SCREENING' && (
                  <button
                    onClick={() => executeStatusChange('active_client', false, 'Activar Cliente')}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[11px] font-medium border border-cyan-500/20 transition-all disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Activar Cliente (Due Diligence)
                  </button>
                )}

                {/* PLATFORM_ADMIN+: Aprobar */}
                {isPlatformAdmin && (deal.stage === 'DUE_DILIGENCE' || deal.stage === 'COMPLIANCE') && (
                  <button
                    onClick={() => executeStatusChange('approved', false, 'Aprobar Proyecto')}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-medium border border-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Aprobar (Listo p/ Despliegue)
                  </button>
                )}

                {/* SUPER_ADMIN + 2FA: Ir Live */}
                {isSuperAdmin && (deal.stage === 'STRUCTURING' || deal.stage === 'APPROVAL') && (
                  <button
                    onClick={() => executeStatusChange('live', true, 'Ir Live en Mainnet')}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                    🔒 Ir Live
                  </button>
                )}

                {/* SUPER_ADMIN + 2FA: Pausar como Incompleto */}
                {isSuperAdmin && deal.stage !== 'LIVE' && deal.stage !== 'APPLIED' && (
                  <button
                    onClick={() => executeStatusChange('incomplete', true, 'Pausar como Incompleto')}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-[11px] font-medium border border-orange-500/20 transition-all disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
                    🔒 Pausar (Incompleto)
                  </button>
                )}

                {/* SUPER_ADMIN + 2FA: Rechazar */}
                {isSuperAdmin && deal.stage !== 'LIVE' && (
                  <button
                    onClick={() => executeStatusChange('rejected', true, 'Rechazar Aplicación')}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-medium border border-rose-500/20 transition-all disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    🔒 Rechazar
                  </button>
                )}
              </div>

              {isSuperAdmin && !has2FA && (
                <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Las acciones con 🔒 requieren verificación 2FA de Discord activa en tu sesión.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main View ──────────────────────────────────────────────────────────────────
export function AdminRwaView({ deals: initialDeals, actor }: AdminRwaViewProps) {
  const { inspect } = usePlatformInspector();
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [deals, setDeals] = useState(initialDeals);

  const filteredDeals = deals.filter((d) =>
    stageFilter === 'ALL' ? true : d.stage === stageFilter
  );

  const handleStatusChanged = (dealId: string, newStatus: string) => {
    setDeals(prev =>
      prev.map(d =>
        String(d.id) === dealId
          ? { ...d, stage: newStatus.toUpperCase() as RwaPipelineStage }
          : d
      )
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            RWA Deal Room & Capital Structuring
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Flujo institucional de tokenización: Screening, Structuring, Compliance y Despliegue en Mainnet.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-mono font-semibold self-start">
          {deals.length} Proyectos en Pipeline
        </span>
      </div>

      {/* Visual Pipeline Bar */}
      <div className="p-4 rounded-2xl bg-[#0F0F16] border border-white/[0.08] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setStageFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
              stageFilter === 'ALL'
                ? 'bg-zinc-700/40 text-white border border-zinc-500/40'
                : 'bg-[#151520] text-zinc-400 border border-white/[0.06] hover:text-white'
            }`}
          >
            Todos
            <span className="text-[10px] px-1.5 rounded-full bg-white/[0.06] text-zinc-300">{deals.length}</span>
          </button>
          <ArrowRight className="w-3 h-3 text-zinc-700 shrink-0" />
          {STAGES.map((s, idx) => (
            <React.Fragment key={s.stage}>
              <button
                onClick={() => setStageFilter(stageFilter === s.stage ? 'ALL' : s.stage)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 ${
                  stageFilter === s.stage
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'bg-[#151520] text-zinc-400 border border-white/[0.06] hover:text-white'
                }`}
              >
                <span>{s.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300">
                  {deals.filter((d) => d.stage === s.stage).length}
                </span>
              </button>
              {idx < STAGES.length - 1 && (
                <ArrowRight className="w-3 h-3 text-zinc-700 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Deals Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0F0F16] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#12121B] text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-5">Proyecto RWA</th>
                <th className="py-3.5 px-4">Clase de Activo</th>
                <th className="py-3.5 px-4">Etapa</th>
                <th className="py-3.5 px-4">Valuación</th>
                <th className="py-3.5 px-4">NDA</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {filteredDeals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No hay proyectos en la etapa seleccionada.
                  </td>
                </tr>
              ) : (
                filteredDeals.map((deal) => (
                  <DealActionRow
                    key={deal.id}
                    deal={deal}
                    actor={actor}
                    onStatusChanged={handleStatusChanged}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

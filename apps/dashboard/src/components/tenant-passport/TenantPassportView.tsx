import React from 'react';
import { ActivityTimeline } from './ActivityTimeline';
import { AssetPortfolioBento } from './AssetPortfolioBento';
import { LoyaltyProgressCard } from './LoyaltyProgressCard';
import { TenantPassportShell } from './TenantPassportShell';
import type { PortalContext } from '@/lib/portal/portal-types';
import type { HermesOverviewView } from '@saasfly/shared';
import type {
  ActivityBlock,
  ActivityItemState,
  AssetBlock,
  LoyaltyBlock,
} from './passport-view';

const ACTIVITY_STATE_MAP = new Set(['completed', 'success', 'confirmed', 'sent']);
const PENDING_STATE_MAP = new Set(['pending', 'queued', 'processing', 'in_progress']);

function mapActivity(overview: HermesOverviewView | null): ActivityBlock {
  if (!overview) {
    return { state: 'unavailable', message: 'Historial de actividad no disponible en este momento.' };
  }
  const items: ActivityItemState[] = (overview.activity || []).map((event) => {
    const status = (event.status || '').toLowerCase();
    const state = ACTIVITY_STATE_MAP.has(status)
      ? ('confirmed' as const)
      : PENDING_STATE_MAP.has(status)
        ? ('pending' as const)
        : status.includes('fail') || status.includes('error') || status.includes('blocked')
          ? ('failed' as const)
          : ('unknown' as const);
    return {
      id: event.id,
      title: event.description || event.type,
      at: event.timestamp,
      state,
      detail: [event.channel, event.journey].filter(Boolean).join(' · ') || undefined,
    };
  });
  return { state: 'available', items };
}

function mapAssets(overview: HermesOverviewView | null): AssetBlock {
  // Fase 1 honesto: aún no existe fuente de activos conectada al portal B2C.
  // Los certificados IPFS / holdings se conectan en Fase 2 — nunca se inventan.
  if (!overview) {
    return { state: 'unavailable', message: 'No pudimos confirmar tus activos en este momento.' };
  }
  return {
    state: 'empty',
    message: 'Aún no tienes certificados o participaciones visibles en este tenant. Pronto podrás verlos aquí.',
  };
}

interface TenantPassportViewProps {
  context: PortalContext;
  overview: HermesOverviewView | null;
}

export function TenantPassportView({ context, overview }: TenantPassportViewProps) {
  const organization = context.organization;
  const isSimulation = organization.isSimulationMode === true;

  return (
    <TenantPassportShell
      organization={{
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
        logoUrl: organization.logoUrl,
      }}
    >
      {isSimulation && (
        <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Este tenant está en modo simulación. Los datos que verás corresponden a la simulación, no a producción.
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Estado del sistema</p>
          <p className="mt-2 text-lg font-semibold">
            {overview
              ? overview.systemStatus === 'NOT_CONFIGURED'
                ? 'En configuración'
                : overview.systemStatus === 'ATTENTION_REQUIRED'
                  ? 'Requiere atención'
                  : 'Operativo'
              : 'No disponible'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Programa</p>
          <p className="mt-2 text-lg font-semibold capitalize">
            {overview ? overview.journeyStatus.toLowerCase().replace('_', ' ') : 'No disponible'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500">Concierge AI</p>
          <p className="mt-2 text-lg font-semibold">Fase 4</p>
          <p className="text-xs text-zinc-500">Se activa con la base de conocimiento del tenant.</p>
        </div>
      </div>

      <div className="mb-8">
        <AssetPortfolioBento block={mapAssets(overview)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LoyaltyProgressCard
          block={{ state: 'available', userId: context.tenant.actorId } as LoyaltyBlock}
        />
        <ActivityTimeline block={mapActivity(overview)} />
      </div>
    </TenantPassportShell>
  );
}
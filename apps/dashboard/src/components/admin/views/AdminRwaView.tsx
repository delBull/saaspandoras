'use client';

/**
 * 🏛️ ADMIN RWA DEAL ROOM & CAPITAL STRUCTURING VIEW (F9.5)
 * apps/dashboard/src/components/admin/views/AdminRwaView.tsx
 *
 * Real World Asset Deal Pipeline covering institutional due diligence,
 * capital structuring, compliance, and tokenization lifecycle.
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { usePlatformInspector } from '../inspector/PlatformInspectorContext';
import { RwaDealSummaryDTO, RwaPipelineStage } from '@/lib/dash-contracts/admin';

interface AdminRwaViewProps {
  deals: RwaDealSummaryDTO[];
}

const STAGES: Array<{ stage: RwaPipelineStage; label: string; color: string }> = [
  { stage: 'APPLIED', label: '1. Solicitud', color: 'zinc' },
  { stage: 'SCREENING', label: '2. Screening', color: 'blue' },
  { stage: 'DUE_DILIGENCE', label: '3. Due Diligence', color: 'amber' },
  { stage: 'COMPLIANCE', label: '4. Compliance', color: 'purple' },
  { stage: 'STRUCTURING', label: '5. Estructuración', color: 'indigo' },
  { stage: 'APPROVAL', label: '6. Aprobación', color: 'emerald' },
  { stage: 'DEPLOYMENT', label: '7. Despliegue', color: 'cyan' },
  { stage: 'LIVE', label: '8. En Vivo', color: 'emerald' },
];

export function AdminRwaView({ deals }: AdminRwaViewProps) {
  const { inspect } = usePlatformInspector();
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const filteredDeals = deals.filter((d) => {
    if (stageFilter !== 'ALL' && d.stage !== stageFilter) return false;
    return true;
  });

  const handleInspectDeal = (deal: RwaDealSummaryDTO) => {
    inspect({
      type: 'RWA_DEAL',
      title: deal.title,
      subtitle: `Proyecto de tokenización RWA '${deal.slug}' originado por el tenant '${deal.originatingTenantId}'.`,
      badge: deal.stage,
      badgeColor: deal.stage === 'LIVE' ? 'emerald' : deal.stage === 'STRUCTURING' ? 'violet' : 'amber',
      attributes: {
        'Tipo de Activo': deal.underlyingAssetType,
        'Patrocinador (Sponsor)': deal.sponsorName,
        'Etapa del Pipeline': deal.stage,
        'Red Blockchain': deal.chain,
        'NDA Institucional': deal.ndaSigned ? '✓ Firmado & Notarizado' : 'Pendiente',
        'Vehículo Legal': deal.structuring?.legalVehicle || 'Pendiente de estructuración',
        'Jurisdicción': deal.structuring?.jurisdiction || 'México / Del.',
        'Valuación del Activo': deal.structuring?.assetValuationUsd ? `$${deal.structuring.assetValuationUsd.toLocaleString()} USD` : 'En dictamen',
        'Suministro de Tokens': deal.structuring?.totalTokenSupply ? deal.structuring.totalTokenSupply.toLocaleString() : 'Pendiente',
        'Precio Inicial por Token': deal.structuring?.initialTokenPriceUsd ? `$${deal.structuring.initialTokenPriceUsd.toFixed(2)} USD` : 'Por definir',
        'Contrato Inteligente': deal.contractAddress ? `${deal.contractAddress.slice(0, 10)}...${deal.contractAddress.slice(-6)}` : 'No desplegado aún',
      },
      rawPayload: deal,
      actionHref: `/profile/projects/${deal.slug}/manage`,
      actionLabel: 'Ver Tokenomics y Fases ↗',
    });
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
            Flujo institucional de tokenización de activos del mundo real: Screening, Structuring, Compliance y Despliegue.
          </p>
        </div>

        {/* Quick count */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 font-mono font-semibold">
            {deals.length} Proyectos en Pipeline
          </span>
        </div>
      </div>

      {/* Visual Pipeline Bar */}
      <div className="p-4 rounded-2xl bg-[#0F0F16] border border-white/[0.08] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
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
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.06] text-zinc-300">
                  {deals.filter((d) => d.stage === s.stage).length}
                </span>
              </button>
              {idx < STAGES.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
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
                <th className="py-3.5 px-4">Etapa Pipeline</th>
                <th className="py-3.5 px-4">Valuación</th>
                <th className="py-3.5 px-4">NDA</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
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
                  <tr
                    key={deal.id}
                    onClick={() => handleInspectDeal(deal)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-300 text-xs shrink-0 group-hover:scale-105 transition-transform">
                          <ShieldCheck className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <span className="font-semibold text-white group-hover:text-purple-300 transition-colors block">
                            {deal.title}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            Tenant: {deal.originatingTenantId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-zinc-400">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono">
                        {deal.underlyingAssetType}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${
                          deal.stage === 'LIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : deal.stage === 'STRUCTURING'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {deal.stage}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-semibold text-white">
                      {deal.structuring?.assetValuationUsd
                        ? `$${deal.structuring.assetValuationUsd.toLocaleString()} USD`
                        : 'En dictamen'}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Firmado</span>
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] group-hover:bg-purple-600/20 text-zinc-400 group-hover:text-purple-300 border border-white/[0.06] group-hover:border-purple-500/30 text-[11px] font-medium transition-all">
                        <span>Estructurar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

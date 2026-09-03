'use client';

/**
 * 🏛️ ADMIN BILLING & GPU ACCOUNTING VIEW (F9.6)
 * apps/dashboard/src/components/admin/views/AdminBillingView.tsx
 *
 * Exposes Hermes Internal Accounting Ledger, RunPod serverless fleet telemetry,
 * per-tenant credit management, and dynamic markup controls.
 */

import React, { useState } from 'react';
import { 
  DollarSign, 
  Cpu, 
  TrendingUp, 
  Layers, 
  Settings2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  Server,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { usePlatformInspector } from '../inspector/PlatformInspectorContext';
import { toast } from 'sonner';

interface TenantCreditRow {
  tenantId: string;
  name?: string;
  creditBalanceUsd: number;
  sandboxBalanceUsd: number;
  totalDepositedUsd: number;
  totalSpentUsd: number;
  markupPercentage: number;
  isSandboxEnabled: boolean;
}

interface ComputeEventRow {
  id: string;
  tenantId: string;
  capability: string;
  executionSeconds: number;
  rawCostUsd: number;
  markupCostUsd: number;
  totalChargedUsd: number;
  status: string;
  isSandbox: boolean;
  createdAt: string;
}

interface RunPodEndpointRow {
  id: string;
  endpointId: string;
  endpointName: string;
  modelType: string;
  gpuType: string;
  perSecondCostUsd: number;
  status: string;
}

interface AdminBillingViewProps {
  credits: TenantCreditRow[];
  events: ComputeEventRow[];
  endpoints: RunPodEndpointRow[];
  totalDeposited: number;
  totalRawCost: number;
  totalMargin: number;
  totalCirculating: number;
  treasuryWallet: string;
}

export function AdminBillingView({
  credits,
  events,
  endpoints,
  totalDeposited,
  totalRawCost,
  totalMargin,
  totalCirculating,
  treasuryWallet,
}: AdminBillingViewProps) {
  const { inspect } = usePlatformInspector();
  const [selectedTenant, setSelectedTenant] = useState<TenantCreditRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [markupInput, setMarkupInput] = useState<number>(35);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSandboxTarget, setIsSandboxTarget] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const openAdjustModal = (row: TenantCreditRow) => {
    setSelectedTenant(row);
    setMarkupInput(row.markupPercentage);
    setAdjustAmount('');
    setAdjustReason('');
    setIsSandboxTarget(false);
    setModalOpen(true);
  };

  const handleInspectEvent = (ev: ComputeEventRow) => {
    inspect({
      type: 'GPU_EVENT',
      title: `Consumo: ${ev.capability}`,
      subtitle: `Request ID '${ev.id}' ejecutado para el tenant '${ev.tenantId}'.`,
      badge: ev.status,
      badgeColor: ev.status === 'SETTLED' ? 'emerald' : 'amber',
      attributes: {
        'Tenant ID': ev.tenantId,
        'Capacidad': ev.capability,
        'Duración': `${ev.executionSeconds.toFixed(2)} segundos`,
        'Costo Proveedor RunPod': `$${ev.rawCostUsd.toFixed(5)} USD`,
        'Margen Retenido Pandora': `$${ev.markupCostUsd.toFixed(5)} USD`,
        'Total Cobrado al Tenant': `$${ev.totalChargedUsd.toFixed(5)} USD`,
        'Entorno': ev.isSandbox ? 'Sandbox (Pruebas)' : 'Producción',
        'Fecha ISO': new Date(ev.createdAt).toLocaleString(),
      },
      rawPayload: ev,
    });
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenant.tenantId,
          markupPercentage: markupInput,
          adjustmentUsd: adjustAmount ? parseFloat(adjustAmount) : 0,
          isSandbox: isSandboxTarget,
          reason: adjustReason || 'Ajuste operativo administrativo',
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success(`Parámetros de '${selectedTenant.tenantId}' actualizados correctamente.`);
        setModalOpen(false);
        // Soft refresh
        window.location.reload();
      } else {
        toast.error(data.error || 'No se pudo actualizar el balance del tenant.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar con la API de administración.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Hermes GPU Compute & Contabilidad Interna
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Auditoría de cómputo serverless RunPod, trazabilidad de márgenes y saldos de crédito por organización.
        </p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deposited */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] shadow-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Depósitos Brutos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              ${totalDeposited.toFixed(2)}
            </span>
            <span className="text-[11px] font-mono text-zinc-500 block mt-0.5">
              USD acumulado
            </span>
          </div>
        </div>

        {/* Total Raw GPU Cost */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] shadow-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Costo Neto RunPod</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              ${totalRawCost.toFixed(2)}
            </span>
            <span className="text-[11px] font-mono text-cyan-400 block mt-0.5">
              Cómputo neto consumido
            </span>
          </div>
        </div>

        {/* Retained Profit Margin */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] shadow-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Margen Retenido (Comisión)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              ${totalMargin.toFixed(2)}
            </span>
            <span className="text-[11px] font-mono text-amber-400 block mt-0.5">
              Ganancia bruta acumulada
            </span>
          </div>
        </div>

        {/* Circulating Credits */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] shadow-md">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Créditos en Circulación</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              ${totalCirculating.toFixed(2)}
            </span>
            <span className="text-[11px] font-mono text-purple-400 block mt-0.5">
              Disponible en tenencias
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Tenant Credits Management Table */}
      <div className="p-6 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Gestión de Créditos & Markup por Tenant</h3>
            <p className="text-xs text-zinc-400">Configura el markup individual (default 35%) o acredita fondos de cortesía/sandbox.</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#12121B]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#161622] text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Saldo Producción</th>
                  <th className="py-3 px-4">Saldo Sandbox</th>
                  <th className="py-3 px-4">Total Gastado</th>
                  <th className="py-3 px-4">Markup %</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {credits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No hay balances de crédito registrados aún.
                    </td>
                  </tr>
                ) : (
                  credits.map((row) => (
                    <tr key={row.tenantId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {row.tenantId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-300 font-bold">
                        ${row.creditBalanceUsd.toFixed(2)} USD
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        ${row.sandboxBalanceUsd.toFixed(2)} USD
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        ${row.totalSpentUsd.toFixed(2)} USD
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-400 font-medium">
                        {row.markupPercentage}%
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openAdjustModal(row)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Ajustar</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: RunPod Endpoints Monitor & Immutable Usage Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RunPod Endpoints (1/3) */}
        <div className="p-6 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Endpoints RunPod Activos</h3>
            <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
              <Server className="w-3 h-3" />
              Fleet
            </span>
          </div>

          <div className="space-y-3">
            {endpoints.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 border border-white/[0.04] rounded-xl bg-[#12121B]">
                No hay endpoints registrados en tabla hermes_runpod_endpoints.
              </div>
            ) : (
              endpoints.map((ep) => (
                <div
                  key={ep.endpointId}
                  className="p-3.5 rounded-xl bg-[#14141E] border border-white/[0.06] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[70%]">
                      {ep.endpointName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      {ep.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>{ep.gpuType}</span>
                    <span>${ep.perSecondCostUsd.toFixed(6)}/s</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 block truncate">
                    ID: {ep.endpointId}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Compute Events Ledger (2/3) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Ledger Inmutable de Consumo de GPU</h3>
              <p className="text-xs text-zinc-400">Haz clic en cualquier evento para auditar costos y márgenes en el Drawer.</p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Últimos {events.length} eventos
            </span>
          </div>

          <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#12121B]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#161622] text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    <th className="py-2.5 px-3.5">Tenant</th>
                    <th className="py-2.5 px-3">Capacidad</th>
                    <th className="py-2.5 px-3">Segundos</th>
                    <th className="py-2.5 px-3">Costo RunPod</th>
                    <th className="py-2.5 px-3">Total Cobrado</th>
                    <th className="py-2.5 px-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        No hay eventos de cómputo registrados aún.
                      </td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr
                        key={ev.id}
                        onClick={() => handleInspectEvent(ev)}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-3.5 font-mono text-white font-semibold">
                          {ev.tenantId}
                        </td>
                        <td className="py-2.5 px-3 text-purple-300 font-mono text-[11px]">
                          {ev.capability}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400">
                          {ev.executionSeconds.toFixed(2)}s
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-400">
                          ${ev.rawCostUsd.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                          ${ev.totalChargedUsd.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
                          {new Date(ev.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Adjust Markup & Credits */}
      {modalOpen && selectedTenant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F16] border border-white/[0.1] rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-white">
                Ajustar Finanzas: {selectedTenant.tenantId}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Modifica el margen dinámico de ganancia o inyecta/debita saldo manualmente.
              </p>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              {/* Markup % */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Porcentaje de Markup de Ganancia (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={markupInput}
                    onChange={(e) => setMarkupInput(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#151520] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <span className="text-xs font-mono text-zinc-400">%</span>
                </div>
                <span className="text-[11px] text-zinc-500 block">
                  Cálculo: Costo RunPod + {markupInput}% = Cobro al Tenant.
                </span>
              </div>

              {/* Adjust Balance Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Ajuste Manual de Balance ($ USD, opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="ej. 25.00 o -10.00"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-[#151520] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono placeholder-zinc-600"
                />
              </div>

              {/* Sandbox vs Production Selector */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sandboxToggle"
                  checked={isSandboxTarget}
                  onChange={(e) => setIsSandboxTarget(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="sandboxToggle" className="text-xs text-zinc-300 cursor-pointer">
                  Aplicar ajuste al saldo de pruebas (Sandbox)
                </label>
              </div>

              {/* Mandatory Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Motivo de Auditoría (Requerido)
                </label>
                <input
                  type="text"
                  placeholder="ej. Recarga de cortesía, corrección por incidencia, etc."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full bg-[#151520] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 placeholder-zinc-600"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

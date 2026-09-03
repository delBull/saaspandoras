'use client';

/**
 * 🏛️ ADMIN OVERVIEW VIEW (F9.3)
 * apps/dashboard/src/components/admin/views/AdminOverviewView.tsx
 *
 * Platform Governance HQ Overview dashboard featuring live KPI cards,
 * infrastructure health checks, and interactive Drawer triggers.
 */

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Cpu, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  ArrowUpRight,
  Zap,
  Activity,
  Server
} from 'lucide-react';
import { usePlatformInspector } from '../inspector/PlatformInspectorContext';
import { PlatformGlobalKpis, InfrastructureHealth } from '@/lib/dash-contracts/admin';

interface AdminOverviewViewProps {
  kpis: PlatformGlobalKpis;
  health: InfrastructureHealth;
  recentTenants: Array<{
    id: string;
    slug: string;
    name: string;
    category: string;
    creatorWallet: string;
    products: { hermesAiMesh: boolean; growthOsCrm: boolean; tokenomicsRwa: boolean };
    creditBalanceUsd: number;
    createdAt: string;
  }>;
}

export function AdminOverviewView({ kpis, health, recentTenants }: AdminOverviewViewProps) {
  const { inspect } = usePlatformInspector();

  const handleInspectTenant = (tenant: any) => {
    inspect({
      type: 'TENANT',
      title: tenant.name,
      subtitle: `Organización registrada bajo slug '${tenant.slug}'. Supervisión de solo lectura en Tenant Lens.`,
      badge: tenant.category || 'Tenant',
      badgeColor: 'violet',
      attributes: {
        'Slug': tenant.slug,
        'Billetera Creadora': tenant.creatorWallet ? `${tenant.creatorWallet.slice(0, 8)}...${tenant.creatorWallet.slice(-6)}` : 'No asignada',
        'Hermes AI Mesh': tenant.products.hermesAiMesh,
        'Growth OS CRM': tenant.products.growthOsCrm,
        'Tokenomics RWA': tenant.products.tokenomicsRwa,
        'Saldo Créditos': `$${tenant.creditBalanceUsd.toFixed(2)} USD`,
        'Registrado': new Date(tenant.createdAt).toLocaleDateString(),
      },
      rawPayload: tenant,
      actionHref: `/ecosystem/${tenant.slug}`,
      actionLabel: 'Abrir Mesh Hub del Tenant ↗',
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#111118] to-indigo-950/20 border border-purple-500/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-mono text-purple-300 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            F9 — Platform Governance Plane
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            HQ Sovereign Command & Governance
          </h2>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 leading-relaxed">
            Supervisión institucional, contabilidad interna de GPU RunPod, observabilidad de tenants y custodia de la Bóveda Soberana K25.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-purple-600/10 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Tenants */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] hover:border-purple-500/30 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Tenants & Ecosistemas</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
              {kpis.totalTenantsCount}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                {kpis.activeTenantsCount} activos
              </span>
              <span className="text-[11px] text-zinc-500">•</span>
              <span className="text-[11px] font-mono text-zinc-400">
                {kpis.rwaProjectsCount} RWA
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: GPU Seconds Executed */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] hover:border-cyan-500/30 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Cómputo RunPod (GPU)</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
              {(kpis.totalGpuSecondsExecuted / 3600).toFixed(1)} hrs
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-mono text-zinc-400">
                {kpis.totalGpuSecondsExecuted.toLocaleString()} s ejecutados
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Gross Deposits */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] hover:border-emerald-500/30 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Depósitos Brutos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
              ${kpis.totalGrossDepositsUsd.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-mono text-emerald-400">
                ${kpis.totalCirculatingCreditsUsd.toFixed(2)} en tenencias
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Retained Gross Margin */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] hover:border-amber-500/30 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Margen Bruto Pandora&apos;s</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
              ${kpis.totalRetainedMarginUsd.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-mono text-amber-400">
                {kpis.averageMarkupPercentage}% markup promedio
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Tenants (with Drawer triggers) & Infrastructure Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Recent Tenants */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Directorio Reciente de Tenants</h3>
              <p className="text-xs text-zinc-400">Haz clic en cualquier organización para abrir el Admin Tenant Lens.</p>
            </div>
            <Link
              href="/admin?tab=tenants"
              className="text-xs font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-all"
            >
              <span>Ver todos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden bg-[#12121B]">
            {recentTenants.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No hay organizaciones registradas aún.
              </div>
            ) : (
              recentTenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleInspectTenant(t)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-300 text-xs shrink-0 group-hover:scale-105 transition-transform">
                      {t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.06]">
                          {t.slug}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                        <span>{t.category || 'General'}</span>
                        <span>•</span>
                        <span className="font-mono text-purple-400">${t.creditBalanceUsd.toFixed(2)} USD</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      Inspeccionar ↗
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1/3): Infrastructure Status */}
        <div className="p-6 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Estado de Infraestructura</h3>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>

          <div className="space-y-3">
            {/* Neon Pooler */}
            <div className="p-3 rounded-xl bg-[#14141E] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-zinc-300">Neon PostgreSQL Pooler</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {health.neonPoolerStatus}
              </span>
            </div>

            {/* IPFS Gateway */}
            <div className="p-3 rounded-xl bg-[#14141E] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="text-zinc-300">Bóveda IPFS (Pinata)</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {health.ipfsGatewayStatus}
              </span>
            </div>

            {/* RunPod Serverless */}
            <div className="p-3 rounded-xl bg-[#14141E] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-zinc-300">RunPod Serverless Fleet</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {health.runpodServerlessStatus}
              </span>
            </div>

            {/* Discord 2FA */}
            <div className="p-3 rounded-xl bg-[#14141E] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-zinc-300">2FA Discord Webhook</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {health.discordWebhookStatus}
              </span>
            </div>
          </div>

          {/* Quick Nexus Bridge */}
          <div className="pt-2">
            <Link
              href="/nexus"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 font-medium transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Abrir Nexus Command Center</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

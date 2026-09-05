'use client';

/**
 * 🏛️ ADMIN TENANTS VIEW (F9.4)
 * apps/dashboard/src/components/admin/views/AdminTenantsView.tsx
 *
 * Tenant Master Directory with real-time filtering, product badges,
 * and seamless Admin Tenant Lens (Read-Only) inspection via the Portal Drawer.
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { usePlatformInspector } from '../inspector/PlatformInspectorContext';
import { AdminTenantLensDTO } from '@/lib/dash-contracts/admin';
import { SovereignIpfsStatusWidget } from '../SovereignIpfsStatusWidget';

interface AdminTenantsViewProps {
  tenants: AdminTenantLensDTO[];
  actorRole?: string;
}

export function AdminTenantsView({ tenants, actorRole = 'VIEWER' }: AdminTenantsViewProps) {
  const { inspect } = usePlatformInspector();
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<'ALL' | 'hermes' | 'growth' | 'rwa'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');

  const isAdmin = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN';

  // Directory KPIs
  const stats = useMemo(() => {
    const total = tenants.length;
    const hermesCount = tenants.filter(t => t.products.hermesAiMesh).length;
    const growthCount = tenants.filter(t => t.products.growthOsCrm).length;
    const rwaCount = tenants.filter(t => t.products.tokenomicsRwa).length;
    return { total, hermesCount, growthCount, rwaCount };
  }, [tenants]);

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      // Search
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.creatorWallet && t.creatorWallet.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Product
      if (productFilter === 'hermes' && !t.products.hermesAiMesh) return false;
      if (productFilter === 'growth' && !t.products.growthOsCrm) return false;
      if (productFilter === 'rwa' && !t.products.tokenomicsRwa) return false;

      // State
      if (stateFilter !== 'ALL' && t.lifecycleState !== stateFilter) return false;

      return true;
    });
  }, [tenants, searchQuery, productFilter, stateFilter]);

  // Open the Admin Tenant Lens (Read-Only) in Portal Drawer
  const handleOpenLens = (t: AdminTenantLensDTO) => {
    inspect({
      type: 'TENANT',
      title: t.name,
      subtitle: `Observabilidad de solo lectura para el tenant '${t.slug}'. Ficha de gobernanza institucional.`,
      badge: t.lifecycleState,
      badgeColor: t.lifecycleState === 'ACTIVE' ? 'emerald' : t.lifecycleState === 'TRIAL' ? 'amber' : 'zinc',
      attributes: {
        'Slug': t.slug,
        'Categoría': t.category || 'General',
        'Estado de Ciclo': t.lifecycleState,
        'Nivel de Riesgo': t.riskRating,
        'Billetera Creadora': t.creatorWallet ? `${t.creatorWallet.slice(0, 10)}...${t.creatorWallet.slice(-6)}` : 'No asignada',
        'Hermes AI Mesh': t.products.hermesAiMesh ? 'Instalado (Activo)' : 'No instalado',
        'Growth OS CRM': t.products.growthOsCrm ? 'Instalado (Activo)' : 'No instalado',
        'Tokenomics RWA': t.products.tokenomicsRwa ? 'Instalado (Activo)' : 'No instalado',
        'Saldo Créditos Producción': `$${t.compute.creditBalanceUsd.toFixed(2)} USD`,
        'Saldo Sandbox': `$${t.compute.sandboxBalanceUsd.toFixed(2)} USD`,
        'Markup de Cómputo': `${t.compute.markupPercentage}%`,
        'Total Depositado': `$${t.compute.totalDepositedUsd.toFixed(2)} USD`,
        'Total Gastado': `$${t.compute.totalSpentUsd.toFixed(2)} USD`,
        'Eventos de GPU': t.compute.totalEventsCount,
        'Intenciones Onboarding': t.intents.length > 0 ? t.intents.join(', ') : 'Ninguna declarada',
        'Registrado el': new Date(t.createdAt).toLocaleDateString(),
      },
      rawPayload: t,
      actionHref: `/ecosystem/${t.slug}`,
      actionLabel: 'Abrir Mesh Hub del Tenant ↗',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Infrastructure Health (Admins only) */}
      {isAdmin && <SovereignIpfsStatusWidget />}

      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Directorio Maestro de Tenants
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Admin Tenant Lens: Observabilidad exhaustiva de organizaciones registradas (Estrictamente Read-Only).
          </p>
        </div>

        {/* Quick Product Stats Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-[#111118] border border-white/[0.08] text-xs flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">Total:</span>
            <span className="font-mono font-bold text-white">{stats.total}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-center gap-2 text-purple-300">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Hermes:</span>
            <span className="font-mono font-bold">{stats.hermesCount}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs flex items-center gap-2 text-cyan-300">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Growth OS:</span>
            <span className="font-mono font-bold">{stats.growthCount}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>RWA:</span>
            <span className="font-mono font-bold">{stats.rwaCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0F0F16] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, slug o wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151520] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Product selector tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setProductFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              productFilter === 'ALL'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setProductFilter('hermes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              productFilter === 'hermes'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Hermes AI
          </button>
          <button
            onClick={() => setProductFilter('growth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              productFilter === 'growth'
                ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Growth OS
          </button>
          <button
            onClick={() => setProductFilter('rwa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              productFilter === 'rwa'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            RWA
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0F0F16] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#12121B] text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-5">Organización</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Suites Instaladas</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Créditos GPU</th>
                <th className="py-3.5 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No se encontraron organizaciones con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handleOpenLens(t)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* Organization Info */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-300 text-xs shrink-0 group-hover:scale-105 transition-transform">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-white group-hover:text-purple-300 transition-colors block">
                            {t.name}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {t.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4 text-zinc-400">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono">
                        {t.category || 'General'}
                      </span>
                    </td>

                    {/* Installed Suites Badges */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        {t.products.hermesAiMesh && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono">
                            Hermes
                          </span>
                        )}
                        {t.products.growthOsCrm && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono">
                            Growth
                          </span>
                        )}
                        {t.products.tokenomicsRwa && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                            RWA
                          </span>
                        )}
                        {!t.products.hermesAiMesh && !t.products.growthOsCrm && !t.products.tokenomicsRwa && (
                          <span className="text-zinc-500 text-[11px]">Ninguna</span>
                        )}
                      </div>
                    </td>

                    {/* Lifecycle State */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                          t.lifecycleState === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : t.lifecycleState === 'TRIAL'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}
                      >
                        {t.lifecycleState}
                      </span>
                    </td>

                    {/* Compute Credits Balance */}
                    <td className="py-4 px-4 font-mono font-semibold text-purple-300">
                      ${t.compute.creditBalanceUsd.toFixed(2)} USD
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] group-hover:bg-purple-600/20 text-zinc-400 group-hover:text-purple-300 border border-white/[0.06] group-hover:border-purple-500/30 text-[11px] font-medium transition-all">
                        <span>Lens</span>
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

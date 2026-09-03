'use client';

/**
 * 🏛️ ADMIN TENANT LENS (F9.4)
 * apps/dashboard/src/components/admin/inspector/AdminTenantLens.tsx
 *
 * Dedicated Read-Only Inspector Panel for a single organization.
 * Exposes identity, suites, onboarding intents, compute usage, and sovereign vaults.
 */

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Cpu, 
  TrendingUp, 
  ShieldCheck, 
  ExternalLink,
  Wallet,
  Sparkles,
  Lock,
  Calendar,
  Layers
} from 'lucide-react';
import { AdminTenantLensDTO } from '@/lib/dash-contracts/admin';
import { AdminWhitelabelConfig } from './AdminWhitelabelConfig';

interface AdminTenantLensProps {
  tenant: AdminTenantLensDTO;
}

export function AdminTenantLens({ tenant }: AdminTenantLensProps) {
  return (
    <div className="space-y-6 text-xs text-zinc-300 font-sans">
      {/* Identity Banner */}
      <div className="p-4 rounded-xl bg-[#14141E] border border-white/[0.08] flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-md">
          {tenant.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white truncate">{tenant.name}</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {tenant.lifecycleState}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 block">
            ID: {tenant.slug}
          </span>
        </div>
      </div>

      {/* Runtimes & Suites Installed */}
      <div className="space-y-2">
        <h5 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Runtimes & Suites Aprovisionadas
        </h5>
        <div className="grid grid-cols-3 gap-2">
          {/* Hermes AI */}
          <div
            className={`p-3 rounded-xl border text-center ${
              tenant.products.hermesAiMesh
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                : 'bg-white/[0.02] border-white/[0.05] text-zinc-600 opacity-60'
            }`}
          >
            <Sparkles className="w-4 h-4 mx-auto mb-1 text-purple-400" />
            <span className="text-[11px] font-semibold block">Hermes AI</span>
            <span className="text-[9px] font-mono block mt-0.5">
              {tenant.products.hermesAiMesh ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Growth OS */}
          <div
            className={`p-3 rounded-xl border text-center ${
              tenant.products.growthOsCrm
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-white/[0.02] border-white/[0.05] text-zinc-600 opacity-60'
            }`}
          >
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
            <span className="text-[11px] font-semibold block">Growth OS</span>
            <span className="text-[9px] font-mono block mt-0.5">
              {tenant.products.growthOsCrm ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Tokenomics RWA */}
          <div
            className={`p-3 rounded-xl border text-center ${
              tenant.products.tokenomicsRwa
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-white/[0.02] border-white/[0.05] text-zinc-600 opacity-60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
            <span className="text-[11px] font-semibold block">RWA Hub</span>
            <span className="text-[9px] font-mono block mt-0.5">
              {tenant.products.tokenomicsRwa ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Compute & Billing Telemetry */}
      <div className="space-y-2">
        <h5 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Contabilidad de Cómputo (GPU RunPod)
        </h5>
        <div className="p-4 rounded-xl bg-[#14141E] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Saldo Producción:</span>
            <span className="font-mono font-bold text-white text-sm">
              ${tenant.compute.creditBalanceUsd.toFixed(2)} USD
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Saldo Sandbox (Pruebas):</span>
            <span className="font-mono text-zinc-300">
              ${tenant.compute.sandboxBalanceUsd.toFixed(2)} USD
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Markup Aplicado:</span>
            <span className="font-mono text-purple-400 font-semibold">
              {tenant.compute.markupPercentage}%
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400 pt-2 border-t border-white/[0.04]">
            <span>Total Depositado:</span>
            <span className="font-mono text-emerald-400">
              ${tenant.compute.totalDepositedUsd.toFixed(2)} USD
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Total Gastado en Cómputo:</span>
            <span className="font-mono text-amber-400">
              ${tenant.compute.totalSpentUsd.toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {/* Strategic Intents from Onboarding */}
      {tenant.intents && tenant.intents.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Intenciones Estratégicas (Onboarding)
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {tenant.intents.map((intent, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-300 font-medium"
              >
                {intent}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sovereign Vault & Addresses */}
      <div className="space-y-2">
        <h5 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Billeteras & Bóveda Soberana
        </h5>
        <div className="p-3.5 rounded-xl bg-[#14141E] border border-white/[0.08] space-y-2 text-[11px]">
          <div>
            <span className="text-zinc-500 block text-[10px] font-mono">BILLETERA CREADORA</span>
            <span className="font-mono text-zinc-300 break-all">
              {tenant.creatorWallet || 'No asignada'}
            </span>
          </div>
          {tenant.treasuryAddress && (
            <div className="pt-2 border-t border-white/[0.04]">
              <span className="text-zinc-500 block text-[10px] font-mono">TESORERÍA SAFE</span>
              <span className="font-mono text-zinc-300 break-all">
                {tenant.treasuryAddress}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Whitelabel Configuration */}
      <div className="space-y-2">
        <h5 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
          Whitelabel Config (Pandora's HQ)
        </h5>
        <AdminWhitelabelConfig tenantSlug={tenant.slug} />
      </div>

      {/* Quick Launch Buttons */}
      <div className="pt-2 space-y-2">
        <Link
          href={`/ecosystem/${tenant.slug}`}
          target="_blank"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-900/20 transition-all text-xs"
        >
          <span>Abrir Mesh Hub del Tenant</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <Link
          href={`/portal/${tenant.slug}`}
          target="_blank"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white font-medium transition-all text-xs"
        >
          <span>Abrir Portal Interactivo</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

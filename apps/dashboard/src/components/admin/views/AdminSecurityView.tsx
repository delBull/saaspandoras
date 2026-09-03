'use client';

/**
 * 🏛️ ADMIN SECURITY & SOVEREIGN VAULT VIEW (F9.7)
 * apps/dashboard/src/components/admin/views/AdminSecurityView.tsx
 *
 * Security operations center, Sovereign Vault K25 integrity,
 * constitutional locks, and platform administrators whitelist.
 */

import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Key, 
  Server, 
  Database, 
  FileCheck2, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { usePlatformInspector } from '../inspector/PlatformInspectorContext';

interface AdminSecurityViewProps {
  totalVaultDocuments: number;
  isDiscord2faActive: boolean;
  administrators: Array<{
    id: number;
    walletAddress: string;
    role: string;
    addedBy: string;
    createdAt: string;
  }>;
}

export function AdminSecurityView({
  totalVaultDocuments,
  isDiscord2faActive,
  administrators,
}: AdminSecurityViewProps) {
  const { inspect } = usePlatformInspector();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Seguridad de Plataforma & Bóveda Soberana K25
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Custodia criptográfica de documentos, verificación de integridad de IPFS, bloqueo constitucional y control de administradores.
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Bóveda K25 */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Bóveda Soberana K25</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              {totalVaultDocuments}
            </span>
            <span className="text-[11px] font-mono text-purple-400 block mt-0.5">
              Documentos notarizados en IPFS Pinata
            </span>
          </div>
        </div>

        {/* Card 2: 2FA Discord Webhook */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Libros Constitucionales (2FA)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              {isDiscord2faActive ? 'ACTIVO' : 'NO CONFIGURADO'}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 block mt-0.5">
              Doble capa Discord Webhook Super Admin
            </span>
          </div>
        </div>

        {/* Card 3: Neon Pooler Security */}
        <div className="p-5 rounded-2xl bg-[#0F0F16] border border-white/[0.08] shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Neon DB Pooler</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              ENCRYPTED
            </span>
            <span className="text-[11px] font-mono text-cyan-400 block mt-0.5">
              SSL / Channel Binding Require
            </span>
          </div>
        </div>
      </div>

      {/* Administrators Whitelist */}
      <div className="p-6 rounded-2xl bg-[#0F0F16] border border-white/[0.08] space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Administradores de Plataforma (Whitelist)</h3>
            <p className="text-xs text-zinc-400">Billeteras autorizadas con privilegios supremos en la base de datos de producción.</p>
          </div>
          <span className="text-xs font-mono text-purple-400 font-semibold">
            {administrators.length} Administradores
          </span>
        </div>

        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#12121B]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#161622] text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Billetera</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4">Añadido Por</th>
                  <th className="py-3 px-4 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {administrators.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      No hay administradores registrados en la tabla administrators.
                    </td>
                  </tr>
                ) : (
                  administrators.map((admin) => (
                    <tr key={admin.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-white font-semibold flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{admin.walletAddress}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {admin.role || 'admin'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                        {admin.addedBy ? `${admin.addedBy.slice(0, 8)}...${admin.addedBy.slice(-6)}` : 'System / Genesis'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-500 text-[11px]">
                        {new Date(admin.createdAt).toLocaleDateString()}
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
  );
}

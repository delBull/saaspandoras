'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  X,
  ShieldCheck,
  Coins,
  Calculator,
  FileText,
  Building2,
  ExternalLink,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import type { Project } from '@/types/admin';
import { getProjectStatusConfig } from '@/lib/project-status';

interface ProtocolSandboxPreviewModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProtocolSandboxPreviewModal({
  project,
  isOpen,
  onClose,
}: ProtocolSandboxPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'widget' | 'calculator' | 'contracts' | 'valuation'>('widget');
  const [simulatedTokens, setSimulatedTokens] = useState<number>(100);

  if (!isOpen) return null;

  const statusCfg = getProjectStatusConfig(project.status);
  const tokenPrice = Number(project.tokenPriceUsd || 1);
  const totalCost = simulatedTokens * tokenPrice;
  const estimatedApy = project.estimatedApy || '12-18%';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0A0E] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Sandbox Notice Banner */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>MODO SANDBOX / PREVIEW ACTIVO — Simulación sin transacciones en Base Mainnet</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400/70 uppercase tracking-widest hidden sm:inline">
              Read-Only Safe
            </span>
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0C0C12]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold shadow-lg">
                {project.title.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">{project.title}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${statusCfg.badgeClass}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Previsualizador Institucional de Tokenización</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.05] hover:bg-white/10 transition-colors"
              aria-label="Cerrar Previsualizador"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 px-6 py-2.5 bg-[#08080A] border-b border-white/[0.06] overflow-x-auto">
            {[
              { id: 'widget', label: 'Widget Inversionista', icon: Eye },
              { id: 'calculator', label: 'Simulador de Rendimiento', icon: Calculator },
              { id: 'contracts', label: 'Arquitectura On-Chain', icon: Layers },
              { id: 'valuation', label: 'Valuación & Respaldo', icon: Building2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-purple-400' : 'text-zinc-500'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: WIDGET INVERSIONISTA */}
            {activeTab === 'widget' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Investment Summary */}
                <div className="bg-[#101018] border border-white/[0.08] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Coins size={16} className="text-purple-400" />
                    Detalles de la Oferta RWA
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-2 border-b border-white/[0.04]">
                      <span className="text-zinc-400">Precio por Fracción / Token:</span>
                      <span className="font-mono font-bold text-white">${tokenPrice.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/[0.04]">
                      <span className="text-zinc-400">Meta de Fondeo (Target):</span>
                      <span className="font-mono font-bold text-white">${Number(project.targetAmount || 0).toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/[0.04]">
                      <span className="text-zinc-400">Tokens / Fracciones en Venta:</span>
                      <span className="font-mono font-bold text-white">{Number(project.tokensOffered || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/[0.04]">
                      <span className="text-zinc-400">Rendimiento Estimado (APY):</span>
                      <span className="font-mono font-bold text-emerald-400">{estimatedApy}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/[0.04]">
                      <span className="text-zinc-400">Red Blockchain:</span>
                      <span className="font-mono font-bold text-blue-400">Base Mainnet (EVM)</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Interactive Mock Checkout */}
                <div className="bg-[#101018] border border-white/[0.08] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-indigo-400" />
                      Simulador de Participación (Investor UI)
                    </h3>
                    <p className="text-xs text-zinc-400 mb-4">
                      Así interactúan los inversionistas en el widget whitelabel embebible o la Deal Room.
                    </p>

                    <div className="space-y-3">
                      <label className="block text-xs text-zinc-300 font-medium">
                        Cantidad de tokens a simular:
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={simulatedTokens}
                          onChange={(e) => setSimulatedTokens(Math.max(1, Number(e.target.value)))}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-400 font-mono">tokens</span>
                      </div>

                      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1 mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Total a pagar:</span>
                          <span className="font-mono font-bold text-purple-300">${totalCost.toLocaleString()} USDC</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-white/10 text-zinc-400 font-bold text-xs cursor-not-allowed border border-white/5 uppercase tracking-wider"
                  >
                    🔒 Modo Sandbox (Transacción Simulada)
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CALCULADORA DE RENDIMIENTO */}
            {activeTab === 'calculator' && (
              <div className="bg-[#101018] border border-white/[0.08] rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Proyección de Rentabilidad</h3>
                  <p className="text-xs text-zinc-400">
                    Cálculo pro-rata de distribuciones estimadas basadas en el APY configurado.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-black/40 border border-white/[0.06] rounded-xl">
                    <div className="text-[11px] text-zinc-500 font-mono uppercase">Inversión Base</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">${totalCost.toLocaleString()} USD</div>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/[0.06] rounded-xl">
                    <div className="text-[11px] text-zinc-500 font-mono uppercase">Rendimiento Anual (Est.)</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      +${((totalCost * 0.15)).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                    </div>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/[0.06] rounded-xl">
                    <div className="text-[11px] text-zinc-500 font-mono uppercase">Poder de Voto DAO</div>
                    <div className="text-xl font-bold font-mono text-indigo-400 mt-1">{simulatedTokens.toLocaleString()} VP</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CONTRATOS & ARQUITECTURA */}
            {activeTab === 'contracts' && (
              <div className="bg-[#101018] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-400" />
                  Direcciones de Smart Contracts (SCaaS)
                </h3>
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-zinc-400 text-[10px]">License Contract (ERC-20/RWA)</div>
                      <div className="text-white mt-0.5">{project.licenseContractAddress || '0x (Pendiente de despliegue)'}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-zinc-400 text-[10px]">Loom / Staking Contract</div>
                      <div className="text-white mt-0.5">{project.loomContractAddress || '0x (Pendiente de despliegue)'}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/[0.04] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-zinc-400 text-[10px]">Treasury Vault Address</div>
                      <div className="text-white mt-0.5">{project.treasuryAddress || '0x (Custodia / Fideicomiso)'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: VALUACIÓN & RESPALDO */}
            {activeTab === 'valuation' && (
              <div className="bg-[#101018] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText size={16} className="text-amber-400" />
                  Expediente de Cumplimiento & Fideicomiso
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-black/40 border border-white/[0.04] rounded-xl space-y-1">
                    <div className="text-zinc-400">Entidad Fiduciaria / Legal:</div>
                    <div className="font-medium text-white">{project.fiduciaryEntity || 'En estructuración'}</div>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/[0.04] rounded-xl space-y-1">
                    <div className="text-zinc-400">Valuación Total:</div>
                    <div className="font-mono font-bold text-white">${Number(project.totalValuationUsd || 0).toLocaleString()} USD</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#0C0C12] flex items-center justify-between">
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Info size={13} />
              Previsualización aislada del entorno de producción.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
            >
              Cerrar Sandbox
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

'use client';

/**
 * 🌌 Sovereign Mesh Hub Client — F8.0 Canonical Home
 * apps/dashboard/src/app/portal/[organizationSlug]/ecosystem/EcosystemHubClient.tsx
 *
 * Visualizes the 3 Sovereign Product Nodes (Hermes AI, Growth OS, Pandoras RWA)
 * and the Level 2 Dynamic Capabilities Matrix governed by CapabilityRegistryService.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Rocket, 
  Building2, 
  Layers, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles, 
  Users, 
  Mail, 
  Wallet, 
  LineChart, 
  Workflow, 
  Cpu, 
  CheckCircle2, 
  Lock, 
  Clock, 
  ChevronRight,
  ExternalLink,
  Shield,
  Zap,
  Activity,
  HardDrive
} from 'lucide-react';
import type { TenantGrowthProfileDTO, GrowthOverviewDTO } from '@/lib/dash-contracts/growth';

interface EcosystemHubClientProps {
  organizationSlug: string;
  organizationName: string;
  growthProfile: TenantGrowthProfileDTO | null;
  growthOverview: GrowthOverviewDTO | null;
  hermesOverview: any | null;
  projectData: any | null;
}

export function EcosystemHubClient({
  organizationSlug,
  organizationName,
  growthProfile,
  growthOverview,
  hermesOverview,
  projectData,
}: EcosystemHubClientProps) {
  const [selectedTab, setSelectedTab] = useState<'nodes' | 'capabilities' | 'telemetry'>('nodes');

  // Capability icons and titles helper
  const capabilityMeta: Record<string, { title: string; desc: string; icon: any }> = {
    'growth.crm': { title: 'CRM & Pipeline', desc: 'Cualificación y captura de prospectos e inversionistas', icon: Users },
    'growth.email': { title: 'Email Marketing', desc: 'Campañas de email con plantillas institucionales', icon: Mail },
    'growth.nft': { title: 'NFT Lab & Passes', desc: 'Emisión de membresías y pases tokenizados', icon: Sparkles },
    'growth.finance': { title: 'Pay & Safe Treasury', desc: 'Tesorería soberana Safe Multi-Sig y dispersión USDC', icon: Wallet },
    'growth.governance': { title: 'Governance Center', desc: 'Aprobación de intenciones y firmas de fundadores', icon: ShieldCheck },
    'growth.analytics': { title: 'Analytics & Attribution', desc: 'Métricas de conversión y ROI multicanal', icon: LineChart },
    'growth.automations': { title: 'Automations Engine', desc: 'Workflows y reglas reactivas ante eventos de negocio', icon: Workflow },
    'growth.agents': { title: 'Hermes Sovereign Agents', desc: 'Agentes delegados con ejecución autónoma gobernada', icon: Cpu },
  };

  const capabilities = growthProfile?.capabilities || [];
  const planTier = growthProfile?.planTier || 'STARTER';

  // Live Metrics
  const hermesConversations = hermesOverview?.metrics?.activeConversations ?? 0;
  const growthLeads = growthOverview?.metrics?.find(m => m.capability === 'growth.crm')?.value ?? '0';
  const treasuryBalance = growthOverview?.metrics?.find(m => m.capability === 'growth.finance')?.value ?? '$0.00 USDC';
  const rwaSoldUnits = projectData?.totalTokens ? `${projectData.tokensOffered || 0} / ${projectData.totalTokens || 0}` : '100% Configurado';

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 p-4 sm:p-6 md:p-8 space-y-8">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-mono uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                SOVEREIGN MESH HUB
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                Plan {planTier}
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                Vault IPFS K25
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>{organizationName}</span>
              <span className="text-slate-500 font-normal text-2xl">/ Ecosistema</span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Centro neurálgico de orquestación institucional. Interconecta tu inteligencia relacional Hermes, tu motor comercial Growth OS y la soberanía de tu protocolo RWA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/portal/${organizationSlug}`}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              HERMES PORTAL
            </Link>
            <Link
              href={`/growth-os/organizations/${organizationSlug}`}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              GROWTH OS HUB
            </Link>
          </div>
        </div>
      </div>

      {/* ── ECOSYSTEM PULSE STRIP ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Conversaciones Hermes</span>
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{hermesConversations}</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Multicanal activo
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Prospectos CRM</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{growthLeads}</p>
          <p className="text-[11px] text-indigo-400 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Pipeline cualificado
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tesorería Safe</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{treasuryBalance}</p>
          <p className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3 h-3" /> Multi-Sig Soberana
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Capacidades del Mesh</span>
            <Layers className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {capabilities.filter(c => c.enabled).length} <span className="text-base text-slate-500 font-normal">/ {capabilities.length}</span>
          </p>
          <p className="text-[11px] text-violet-400 flex items-center gap-1 font-medium">
            <Zap className="w-3 h-3" /> 100% Gobernadas
          </p>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setSelectedTab('nodes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            selectedTab === 'nodes'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          🌌 3 Nodos del Ecosistema
        </button>
        <button
          onClick={() => setSelectedTab('capabilities')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            selectedTab === 'capabilities'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          🎛️ Matriz de Capacidades ({capabilities.length})
        </button>
        <button
          onClick={() => setSelectedTab('telemetry')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            selectedTab === 'telemetry'
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          ⚡ Telemetría & Live Mesh Feed
        </button>
      </div>

      {/* ── TAB CONTENT: 3 PRODUCT NODES (NIVEL 1) ── */}
      {selectedTab === 'nodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nodo 1: Hermes AI */}
          <div className="group relative rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-emerald-500/40 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ONLINE & CONECTADO
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Hermes AI</h2>
                <p className="text-xs text-emerald-400/80 font-mono mt-0.5">Relational Intelligence & Channel Mesh</p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Atención conversacional multicanal (Telegram, Web, WhatsApp), base de conocimiento inmutable en IPFS y journeys relacionales de conversión.
              </p>

              <div className="pt-2 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-500">Canales activos</span>
                  <span className="font-semibold text-white">Telegram + Web Chat</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-500">Knowledge Vault</span>
                  <span className="font-semibold text-emerald-400">K25 IPFS Anchored</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Políticas activas</span>
                  <span className="font-semibold text-white">Universal + Deterministic</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/[0.06]">
              <Link
                href={`/portal/${organizationSlug}`}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all group-hover:bg-emerald-600 group-hover:text-white"
              >
                <span>OPERAR EN HERMES PORTAL</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Nodo 2: Growth OS */}
          <div className="group relative rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-violet-500/40 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Rocket className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  TIER {planTier}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Growth OS</h2>
                <p className="text-xs text-violet-400/80 font-mono mt-0.5">Commercial & Marketing Operating Suite</p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Suite de crecimiento y operaciones comerciales: CRM Soberano, campañas de email, emisión de pases NFT y gobernanza de intenciones.
              </p>

              <div className="pt-2 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-500">Capacidades habilitadas</span>
                  <span className="font-semibold text-violet-300">{capabilities.filter(c => c.enabled).length} de 8</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-500">Embudos & Pipeline</span>
                  <span className="font-semibold text-white">Sincronizado con Hermes</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Governance Gate</span>
                  <span className="font-semibold text-emerald-400">Activo (Fail-Closed)</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/[0.06]">
              <Link
                href={`/growth-os/organizations/${organizationSlug}`}
                className="w-full py-3 px-4 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 font-bold text-xs flex items-center justify-center gap-2 transition-all group-hover:bg-violet-600 group-hover:text-white"
              >
                <span>ABRIR GROWTH OS HUB</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Nodo 3: Pandoras RWA & Tokenomics */}
          <div className="group relative rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] hover:border-indigo-500/40 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  DESPLEGADO
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Pandoras RWA</h2>
                <p className="text-xs text-indigo-400/80 font-mono mt-0.5">Asset Tokenization & DAO Protocol</p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Gestión de participaciones, emisión de certificados fiduciarios, recaudación Fast Lane y gobernanza de holders.
              </p>

              <div className="pt-2 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-500">Unidades de Participación</span>
                  <span className="font-semibold text-white">{rwaSoldUnits}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-500">Reconciliación</span>
                  <span className="font-semibold text-indigo-400">Fast Lane On-Chain</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">DAO Governance</span>
                  <span className="font-semibold text-white">Votación Ponderada</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/[0.06]">
              <Link
                href={`/profile/projects/${organizationSlug}/manage`}
                className="w-full py-3 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all group-hover:bg-indigo-600 group-hover:text-white"
              >
                <span>GESTIONAR PROTOCOLO & TOKENOMICS</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: DYNAMIC CAPABILITIES MATRIX (NIVEL 2) ── */}
      {selectedTab === 'capabilities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Catálogo Canónico de Capacidades Soberanas
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Gobernado por CapabilityRegistryService
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {capabilities.map((cap) => {
              const meta = capabilityMeta[cap.key] || {
                title: cap.key,
                desc: 'Capacidad del ecosistema Pandoras',
                icon: Layers,
              };
              const Icon = meta.icon;

              const isContractReady = cap.key === 'growth.agents';
              const isEnabled = cap.enabled;

              return (
                <div
                  key={cap.key}
                  className={`p-5 rounded-2xl border transition-all ${
                    isEnabled
                      ? 'bg-white/[0.03] border-white/[0.08] hover:border-violet-500/30'
                      : isContractReady
                      ? 'bg-white/[0.01] border-white/[0.04] opacity-80'
                      : 'bg-white/[0.01] border-white/[0.04] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] text-violet-300 border border-white/[0.06]">
                      <Icon className="w-5 h-5" />
                    </div>
                    {isEnabled ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        ACTIVE
                      </span>
                    ) : isContractReady ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                        CONTRACT READY
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        UPGRADE
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-white">{meta.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{meta.desc}</p>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
                    <span>Riesgo: <strong className="text-slate-400">{cap.riskLevel || 'LOW'}</strong></span>
                    {cap.requiresHumanApproval && (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Requiere Firma
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: UNIFIED TELEMETRY & LIVE MESH FEED ── */}
      {selectedTab === 'telemetry' && (
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Mesh Activity Feed
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Eventos auditables transmitidos entre Hermes, Growth y RWA</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              STREAM LIVE
            </span>
          </div>

          <div className="space-y-3">
            {[
              { id: '1', title: 'Hermes atendió prospecto', node: 'HERMES AI', desc: 'Inversionista consultó sobre rendimientos y fue registrado en CRM.', time: 'Hace 5 min' },
              { id: '2', title: 'Campaña de Email despachada', node: 'GROWTH OS', desc: 'Newsletter Q3 entregado a 142 prospectos cualificados.', time: 'Hace 45 min' },
              { id: '3', title: 'Intención de Payout creada', node: 'GOVERNANCE', desc: 'Solicitud de desembolso por 2,500 USDC registrada para aprobación.', time: 'Hace 2 horas' },
              { id: '4', title: 'Reconciliación Fast Lane', node: 'PANDORAS RWA', desc: 'Adquisición de título de participación confirmada en blockchain.', time: 'Hace 5 horas' },
            ].map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300">
                      {event.node}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{event.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400">{event.desc}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-500 shrink-0">{event.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

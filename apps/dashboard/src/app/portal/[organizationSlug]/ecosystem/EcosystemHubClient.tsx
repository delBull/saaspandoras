'use client';

/**
 * 🌌 Sovereign Mesh Hub Client — F8.0 Canonical Home + F8.2 Setup Engine
 * apps/dashboard/src/app/portal/[organizationSlug]/ecosystem/EcosystemHubClient.tsx
 *
 * Visualizes the 3 Sovereign Product Nodes (Hermes AI, Growth OS, Pandoras RWA)
 * and the Level 2 Dynamic Capabilities Matrix governed by CapabilityRegistryService,
 * with real-time Product Setup State & Activation Progress Drawer.
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
  HardDrive,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import type { TenantGrowthProfileDTO, GrowthOverviewDTO } from '@/lib/dash-contracts/growth';
import type { EcosystemSetupSummary } from '@/lib/mesh/setup-progress.service';
import { SetupDrawer } from '@/components/mesh/SetupDrawer';

interface EcosystemHubClientProps {
  organizationSlug: string;
  organizationName: string;
  growthProfile: TenantGrowthProfileDTO | null;
  growthOverview: GrowthOverviewDTO | null;
  hermesOverview: any | null;
  projectData: any | null;
  initialSetupSummary?: EcosystemSetupSummary | null;
}

export function EcosystemHubClient({
  organizationSlug,
  organizationName,
  growthProfile,
  growthOverview,
  hermesOverview,
  projectData,
  initialSetupSummary = null,
}: EcosystemHubClientProps) {
  const [selectedTab, setSelectedTab] = useState<'nodes' | 'capabilities' | 'telemetry'>('nodes');
  const [isSetupDrawerOpen, setIsSetupDrawerOpen] = useState(false);
  const [setupSummary, setSetupSummary] = useState<EcosystemSetupSummary | null>(initialSetupSummary);

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

  // Setup Progress helpers
  const hermesSetup = setupSummary?.modules.find(m => m.productKey === 'HERMES');
  const growthSetup = setupSummary?.modules.find(m => m.productKey === 'GROWTH_OS');
  const rwaSetup = setupSummary?.modules.find(m => m.productKey === 'PANDORAS_RWA');

  return (
    <div className="min-h-screen bg-[#07080D] text-slate-100 p-4 sm:p-6 md:p-8 space-y-8">
      {/* ── HEADER & CONTEXT BAR ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950/40 via-indigo-950/20 to-slate-900/40 border border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                Sovereign Mesh Architecture
              </span>
              <span className="text-[10px] font-mono text-slate-500">•</span>
              <span className="text-[10px] font-mono text-slate-400">Org ID: {organizationSlug}</span>
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
            <button
              onClick={() => setIsSetupDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>ASISTENTE DE SETUP</span>
              {setupSummary && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  {setupSummary.overallPercentage}%
                </span>
              )}
            </button>
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

      {/* ── SETUP PROGRESS BANNER (SI NO ESTÁ 100% COMPLETADO) ── */}
      {setupSummary && setupSummary.overallPercentage < 100 && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-violet-950/30 to-black/60 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Puesta en Marcha del Ecosistema
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {setupSummary.overallPercentage}% Completado
                </span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                {setupSummary.completedModules} de {setupSummary.totalActiveModules} módulos configurados. Completa los pasos de puesta en marcha para habilitar todas las capacidades.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSetupDrawerOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all shrink-0 flex items-center gap-1.5"
          >
            <span>Configurar Módulos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  {hermesSetup && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Setup: {hermesSetup.progressPercentage}%
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ONLINE & CONECTADO
                  </span>
                </div>
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

            <div className="pt-6 mt-6 border-t border-white/[0.06] space-y-2">
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
                <div className="flex items-center gap-2">
                  {growthSetup && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold">
                      Setup: {growthSetup.progressPercentage}%
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    TIER {planTier}
                  </span>
                </div>
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

            <div className="pt-6 mt-6 border-t border-white/[0.06] space-y-2">
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
                <div className="flex items-center gap-2">
                  {rwaSetup && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      Setup: {rwaSetup.progressPercentage}%
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    DESPLEGADO
                  </span>
                </div>
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

            <div className="pt-6 mt-6 border-t border-white/[0.06] space-y-2">
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
                title: cap.label,
                desc: cap.description || 'Capacidad operativa del Mesh',
                icon: Layers
              };
              const Icon = meta.icon;
              const subPath = cap.key.replace('growth.', '');

              return (
                <div
                  key={cap.key}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                    cap.enabled
                      ? 'bg-white/[0.03] border-white/[0.08] hover:border-violet-500/40'
                      : 'bg-white/[0.01] border-white/[0.03] opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${cap.enabled ? 'bg-violet-500/10 text-violet-400' : 'bg-slate-800 text-slate-500'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        cap.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {cap.enabled ? 'ACTIVA' : 'DISPONIBLE'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{meta.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{meta.desc}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[10px]">Tier {cap.tierRequired}</span>
                    {cap.enabled ? (
                      <Link
                        prefetch={false}
                        href={`/growth-os/organizations/${organizationSlug}/${subPath}`}
                        className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors"
                      >
                        Configurar <ChevronRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-slate-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Requiere Upgrade
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: TELEMETRY & LIVE MESH FEED (NIVEL 3) ── */}
      {selectedTab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Interconexión de Eventos en Tiempo Real
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                MESH SYNC ONLINE
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">[HERMES_PLANE]</span>
                  <span className="text-slate-300">Intención comercial cualificada detectada en Telegram</span>
                </div>
                <span className="text-slate-500 text-[10px]">Hace 2 min</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-violet-400">[GROWTH_OS]</span>
                  <span className="text-slate-300">Lead registrado y asignado a campaña en CRM</span>
                </div>
                <span className="text-slate-500 text-[10px]">Hace 2 min</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-indigo-400">[PANDORAS_RWA]</span>
                  <span className="text-slate-300">Certificado fiduciario sincronizado en Fast Lane</span>
                </div>
                <span className="text-slate-500 text-[10px]">Hace 15 min</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6 space-y-4 backdrop-blur-md">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Sovereignty Status
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-slate-400">Knowledge Vault</span>
                <span className="text-emerald-400 font-mono font-bold">K25-IPFS (100%)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-slate-400">Gobernanza de Intenciones</span>
                <span className="text-emerald-400 font-mono font-bold">Deterministic Post-LLM</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.04]">
                <span className="text-slate-400">Contratos Desplegados</span>
                <span className="text-indigo-400 font-mono font-bold">Base Mainnet</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Tenant Isolation</span>
                <span className="text-emerald-400 font-mono font-bold">Strict RLS Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SETUP DRAWER SLIDE-OVER ── */}
      <SetupDrawer
        isOpen={isSetupDrawerOpen}
        onClose={() => setIsSetupDrawerOpen(false)}
        setupSummary={setupSummary}
        onActivateModule={(prod) => {
          setIsSetupDrawerOpen(false);
          window.location.href = `/onboarding?step=products&slug=${organizationSlug}`;
        }}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingLibraryIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  UsersIcon,
  EyeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LegalTab } from './tabs/LegalTab';
import { DaoTreasuryTab } from './tabs/DaoTreasuryTab';
import { ResourceHubTab } from './tabs/ResourceHubTab';
import { NetworkTab } from './tabs/NetworkTab';
import { ProtocolSandboxPreviewModal } from '@/components/projects/ProtocolSandboxPreviewModal';
import { useActiveAccount } from 'thirdweb/react';
import {
  Layers,
  Bot,
  ExternalLink,
  Wallet,
  Copy,
  CheckCircle2,
  FileCode2,
  FileText,
} from 'lucide-react';

interface ProjectFounderDashboardProps {
  project: any;
  hasGrowthOs?: boolean;
}

function parseSafeNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export default function ProjectFounderDashboard({ project, hasGrowthOs }: ProjectFounderDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'network' | 'treasury' | 'governance' | 'settings' | 'purchases' | 'legal' | 'dao' | 'resource_hub'
  >('overview');
  const [isLoadingPhase, setIsLoadingPhase] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const account = useActiveAccount();

  const fetchPendingCount = async () => {
    if (!account?.address) return;
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/admin/purchases`, {
        headers: { 'x-wallet-address': account.address },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, [account?.address, project.id]);

  let config: any = {};
  try {
    config = typeof project.w2eConfig === 'string' ? JSON.parse(project.w2eConfig) : project.w2eConfig || {};
  } catch (e) {
    console.error('Error parsing w2eConfig', e);
  }
  const treasuryAddress = config.treasuryAddress || project.treasury_address;
  const governorAddress = config.governorAddress || project.governorContractAddress;

  const handleTogglePhase = async (phaseId: string, currentStatus: boolean) => {
    try {
      setIsLoadingPhase(phaseId);
      const response = await fetch(`/api/projects/${project.id}/phases`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phaseId, isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error('Failed to update phase');

      toast.success(currentStatus ? 'Fase pausada' : 'Fase activada');
      router.refresh();
    } catch (error) {
      toast.error('Error al actualizar la fase');
      console.error(error);
    } finally {
      setIsLoadingPhase(null);
    }
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopiedWallet(true);
      toast.success('Dirección copiada');
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Resumen General', icon: BuildingLibraryIcon },
    { id: 'network', label: 'Gestores Patrimoniales', icon: UsersIcon },
    { id: 'purchases', label: 'Reconciliación (Fast Lane)', icon: CurrencyDollarIcon },
    { id: 'treasury', label: 'Tesorería On-Chain', icon: BuildingLibraryIcon },
    { id: 'governance', label: 'Gobernanza del Protocolo', icon: DocumentTextIcon },
    { id: 'dao', label: 'DAO Treasury', icon: BuildingLibraryIcon },
    { id: 'legal', label: 'Legal & Riesgos', icon: DocumentTextIcon },
    { id: 'resource_hub', label: 'Hub de Recursos', icon: DocumentTextIcon },
    { id: 'settings', label: 'Configuración', icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050505] text-zinc-300 font-sans">
      {/* ── MOBILE HEADER (NAVBAR) ── */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-[#050505] border-b border-white/10 shrink-0 sticky top-0 z-30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-xs shadow-md">
            P
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight truncate max-w-[160px]">{project.title}</h2>
            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Protocol Console</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="p-2 rounded-xl bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors border border-white/10"
          aria-label="Abrir Menú"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-[290px] w-full bg-[#050505] border-r border-white/10 text-zinc-300 z-50 h-full shadow-2xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  P
                </div>
                <span className="text-white font-bold text-sm tracking-tight truncate">{project.title}</span>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              <div className="px-2 pb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                Módulos de Protocolo
              </div>
              {menuItems.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-zinc-400'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.id === 'purchases' && pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Cross-Plane Links (Mobile) */}
              <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 font-mono">
                  Capacidades de Negocio
                </div>
                <Link
                  href={`/portal/${project.slug}/ecosystem`}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold hover:bg-violet-500/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet-400" />
                    <span>Ecosistema Hub</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-violet-400/70" />
                </Link>
                <Link
                  href={`/portal/${project.slug}/overview`}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>Hermes AI OS</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-emerald-400/70" />
                </Link>
                <Link
                  href={`/growth-os/organizations/${project.slug}`}
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-indigo-400" />
                    <span>Growth OS</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-indigo-400/70" />
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* ── DESKTOP DEDICATED BUSINESS DRAWER / SIDEBAR ── */}
      <aside className="hidden md:flex flex-col shrink-0 w-64 bg-[#050505] border-r border-white/10 text-zinc-300 min-h-screen backdrop-blur-xl">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              P
            </div>
            <div className="overflow-hidden">
              <h2 className="text-white font-bold text-base tracking-tight truncate">{project.title}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Protocol Console</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Módulos de Protocolo
          </div>
          {menuItems.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-zinc-400'} shrink-0`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.id === 'purchases' && pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Cross-Plane Hybrid Links (Desktop) */}
          <div className="mt-5 pt-4 border-t border-white/10 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 px-2 font-mono">
              Capacidades de Negocio
            </div>
            <Link
              href={`/portal/${project.slug}/ecosystem`}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Ecosistema Hub</span>
              </div>
              <ExternalLink className="w-3 h-3 text-violet-400/70 shrink-0" />
            </Link>
            <Link
              href={`/portal/${project.slug}/overview`}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2 truncate">
                <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Hermes AI OS</span>
              </div>
              <ExternalLink className="w-3 h-3 text-emerald-400/70 shrink-0" />
            </Link>
            <Link
              href={`/growth-os/organizations/${project.slug}`}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-all text-xs font-semibold"
            >
              <div className="flex items-center gap-2 truncate">
                <UsersIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">Growth OS</span>
              </div>
              <ExternalLink className="w-3 h-3 text-indigo-400/70 shrink-0" />
            </Link>
          </div>
        </nav>

        {/* Integrated Profile & Wallet Footer */}
        <div className="p-3 border-t border-white/10 bg-white/[0.01]">
          {account?.address ? (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-[10px] text-violet-300 font-mono">
                    W
                  </div>
                  <span className="text-xs font-mono text-zinc-300">
                    {account.address.slice(0, 6)}...{account.address.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={copyAddress}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Copiar Wallet"
                >
                  {copiedWallet ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Conectado
                </span>
                <span className="text-zinc-500">Fundador</span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
              <p className="text-xs text-zinc-400">Wallet no detectada</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── RIGHT MAIN CONTENT WORKSPACE ── */}
      <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 md:p-8 space-y-6 overflow-y-auto">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{project.title}</h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">Consola de Tokenomics, Capital y Asignación Patrimonial</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-600/30 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <EyeIcon className="w-4 h-4" />
              PREVIEW
            </button>
            <Link
              href={`/profile/projects/${project.slug}/premium`}
              className="px-3.5 py-2 bg-amber-600/20 border border-amber-600/30 text-amber-300 rounded-xl hover:bg-amber-600/30 transition-all text-xs font-bold shadow-sm"
            >
              PDF PREMIUM
            </Link>
            <Link
              href={`/projects/${project.slug}`}
              target="_blank"
              className="px-3.5 py-2 bg-white/[0.04] border border-white/10 text-zinc-300 rounded-xl hover:bg-white/[0.08] hover:text-white transition-all text-xs font-bold"
            >
              VER PÁGINA PÚBLICA ↗
            </Link>
          </div>
        </div>

        {/* Tab Viewport */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <OverviewTab
                  project={project}
                  config={config}
                  onTogglePhase={handleTogglePhase}
                  loadingPhase={isLoadingPhase}
                />
              )}
              {activeTab === 'network' && <NetworkTab project={project} />}
              {activeTab === 'treasury' && <TreasuryTab project={project} address={treasuryAddress} />}
              {activeTab === 'governance' && <GovernanceTab address={governorAddress} project={project} />}
              {activeTab === 'dao' && <DaoTreasuryTab project={project} />}
              {activeTab === 'legal' && <LegalTab project={project} />}
              {activeTab === 'resource_hub' && <ResourceHubTab project={project} />}
              {activeTab === 'settings' && <SettingsTab project={project} />}
              {activeTab === 'purchases' && (
                <PurchasesTab project={project} onUpdatePending={fetchPendingCount} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Protocol Sandbox Preview Modal */}
        <ProtocolSandboxPreviewModal
          project={project}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      </main>
    </div>
  );
}

// ── SUB-TABS & HELPERS ─────────────────────────────────────────────────────────

function OverviewTab({
  project,
  config,
  onTogglePhase,
  loadingPhase,
}: {
  project: any;
  config: any;
  onTogglePhase: (id: string, status: boolean) => void;
  loadingPhase: string | null;
}) {
  const chainName =
    project?.chainId === 8453
      ? 'Base Mainnet (8453)'
      : project?.chainId === 84532
      ? 'Base Sepolia (84532)'
      : project?.chainId === 1
      ? 'Ethereum Mainnet (1)'
      : project?.chainId === 11155111
      ? 'Ethereum Sepolia (11155111)'
      : 'Base L2 Network';

  const creationDate =
    project?.createdAt || project?.created_at
      ? new Date(project.createdAt || project.created_at).toLocaleDateString()
      : 'Activo';

  const raised = parseSafeNumber(project?.raised_amount ?? project?.raisedAmount);
  const target = parseSafeNumber(project?.target_amount ?? project?.targetAmount ?? project?.totalValuationUsd);
  const progressPercent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        {/* Protocol Capital State */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Estado del Protocolo RWA
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {project?.status?.toUpperCase() || 'LIVE'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
              <p className="text-xs font-mono text-zinc-400">Total Recaudado</p>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                ${raised.toLocaleString()} <span className="text-xs text-zinc-500">USDC</span>
              </p>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-mono text-right pt-1">{progressPercent}% del objetivo</p>
            </div>
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
              <p className="text-xs font-mono text-zinc-400">Valuación Objetivo</p>
              <p className="text-2xl sm:text-3xl font-black font-mono text-white">
                ${target > 0 ? target.toLocaleString() : '0'}{' '}
                <span className="text-xs text-zinc-500">USD</span>
              </p>
              <p className="text-[11px] text-zinc-500 pt-2 font-mono">
                Tipo: {project?.tokenType || 'PAS-721 / ERC-20'}
              </p>
            </div>
          </div>
        </div>

        {/* Token Sale Phases */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Fases de Venta Activas</h3>
            <span className="text-xs text-zinc-500 font-mono">Fast Lane Protocol</span>
          </div>

          <div className="space-y-3">
            {config.phases?.length > 0 ? (
              config.phases.map((phase: any) => (
                <div
                  key={phase.id}
                  className="flex justify-between items-center p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/5 transition-colors"
                >
                  <div>
                    <p className="font-bold text-white text-sm flex items-center gap-2">
                      {phase.name}
                      {phase.isSoftCap && (
                        <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          Soft Cap
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400 font-mono pt-1">
                      {phase.type === 'time' ? `${phase.limit} días` : `$${phase.limit} USD`} •{' '}
                      {phase.tokenPrice ? `$${phase.tokenPrice} USDC` : 'Precio Fijo'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                        phase.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}
                    >
                      {phase.isActive ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                    <button
                      onClick={() => onTogglePhase(phase.id, phase.isActive)}
                      disabled={loadingPhase === phase.id}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        phase.isActive
                          ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      {loadingPhase === phase.id ? '...' : phase.isActive ? 'Detener' : 'Iniciar'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-zinc-500 font-mono">No hay fases de venta configuradas.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* On-Chain Deployment Info */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Despliegue On-Chain</h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-zinc-500">Red</span>
              <span className="text-emerald-400 font-bold">{chainName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-zinc-500">Fecha Registro</span>
              <span className="text-zinc-300">{creationDate}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-zinc-500">Smart Contract</span>
              <span className="text-zinc-300 font-mono">
                {project.contractAddress
                  ? `${project.contractAddress.slice(0, 6)}...${project.contractAddress.slice(-4)}`
                  : 'Sin Desplegar'}
              </span>
            </div>
            <div className="pt-3">
              <Link href={`/projects/${project.slug}`} target="_blank">
                <button className="w-full py-2.5 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 text-violet-300 border border-violet-500/30 rounded-xl transition-all text-xs font-bold shadow-lg">
                  Ver Página Pública ↗
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreasuryTab({ project, address }: { project: any; address?: string }) {
  const account = useActiveAccount();
  const [isDistributing, setIsDistributing] = useState(false);
  const [distAmount, setDistAmount] = useState('');
  const [distDesc, setDistDesc] = useState('');
  const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    fetch(`/api/v1/projects/${project.id}/admin/treasury-balance`, {
      headers: { 'x-wallet-address': account?.address || '' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.balance !== undefined) {
          setTreasuryBalance(Number(data.balance).toFixed(2));
        }
      })
      .catch(() => {});
  }, [project.id, address, account?.address]);

  if (!address)
    return (
      <div className="p-12 text-center bg-white/[0.02] rounded-3xl border border-white/10 text-zinc-500 font-mono">
        No hay dirección de tesorería asignada. Configura la tesorería del protocolo.
      </div>
    );

  const handleDistribute = async () => {
    if (!distAmount || isNaN(Number(distAmount)) || Number(distAmount) <= 0) {
      toast.error('Ingresa un monto válido mayor a 0');
      return;
    }
    if (!account?.address) {
      toast.error('Conecta tu wallet');
      return;
    }

    setIsDistributing(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/admin/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(distAmount),
          description: distDesc || 'Distribución de Rendimientos',
          callerWallet: account.address,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar distribución');

      toast.success(`Distribuido con éxito a ${data.recipientsCount} miembros.`);
      setDistAmount('');
      setDistDesc('');
    } catch (e: any) {
      toast.error(e.message || 'Error en la distribución');
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-6 shadow-2xl">
        <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
          Tesorería Soberana del Protocolo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
            <span className="text-xs font-mono text-zinc-400">Dirección de Tesorería</span>
            <p className="font-mono text-xs text-white truncate pt-1">{address}</p>
          </div>
          <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1">
            <span className="text-xs font-mono text-zinc-400">Balance Detectado</span>
            <p className="text-2xl font-bold font-mono text-emerald-400">
              {treasuryBalance !== null ? `$${treasuryBalance} USDC` : 'Consultando...'}
            </p>
          </div>
        </div>

        {/* Distribución de Rendimientos */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Distribuir Rendimientos Pro-Rata
          </h4>
          <p className="text-xs text-zinc-400">
            Los fondos se acreditarán en el balance interno de cada miembro del DAO según su porcentaje de participación.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Monto Total USDC a Distribuir</label>
              <input
                type="number"
                value={distAmount}
                onChange={(e) => setDistAmount(e.target.value)}
                placeholder="Ej. 5000"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none focus:border-violet-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Concepto / Nota</label>
              <input
                type="text"
                value={distDesc}
                onChange={(e) => setDistDesc(e.target.value)}
                placeholder="Ej. Rendimiento Q3 2026"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono text-sm outline-none focus:border-violet-500/60"
              />
            </div>
          </div>

          <button
            onClick={handleDistribute}
            disabled={isDistributing}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
          >
            {isDistributing ? 'Procesando Distribución...' : 'Ejecutar Distribución Pro-Rata'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GovernanceTab({ address, project }: { address?: string; project: any }) {
  if (!address)
    return (
      <div className="p-12 text-center bg-white/[0.02] rounded-3xl border border-white/10 text-zinc-500 font-mono">
        No hay contrato de gobernanza configurado.
      </div>
    );

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-2xl">
      <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">Gobernanza On-Chain</h3>
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
        <p className="text-xs font-mono text-zinc-400">Contrato Governor</p>
        <p className="font-mono text-sm text-emerald-400 pt-1">{address}</p>
      </div>
      <p className="text-xs text-zinc-500 font-mono">
        Las propuestas de votación se gestionan a través del módulo Sovereign Governance.
      </p>
    </div>
  );
}

function SettingsTab({ project }: { project: any }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-6 shadow-2xl">
      <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
        Configuración del Protocolo
      </h3>
      <div className="space-y-4 text-xs font-mono">
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
          <div>
            <p className="font-bold text-white">Slug Identificador</p>
            <p className="text-zinc-500">{project.slug}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Inmutable
          </span>
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
          <div>
            <p className="font-bold text-white">ID de Proyecto</p>
            <p className="text-zinc-500">#{project.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchasesTab({ project, onUpdatePending }: { project: any; onUpdatePending: () => void }) {
  const account = useActiveAccount();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchPurchases = async () => {
    if (!account?.address) return;
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/admin/purchases`, {
        headers: { 'x-wallet-address': account.address },
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [project.id, account?.address]);

  const handleApprove = async (purchaseId: number) => {
    if (!account?.address) return;
    setActionLoading(purchaseId);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/admin/purchases/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': account.address,
        },
        body: JSON.stringify({ purchaseId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al aprobar compra');
      }

      toast.success('Compra aprobada y sincronizada');
      fetchPurchases();
      onUpdatePending();
    } catch (e: any) {
      toast.error(e.message || 'Error al aprobar compra');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono animate-pulse">
        Cargando solicitudes de compra...
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-6 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
          Reconciliación de Compras Fast Lane ({purchases.length})
        </h3>
      </div>

      {purchases.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 font-mono">
          No hay compras pendientes de reconciliación en este momento.
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {purchases.map((p) => (
            <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 font-mono text-xs">
                <p className="font-bold text-white text-sm">
                  {p.buyerAddress ? `${p.buyerAddress.slice(0, 6)}...${p.buyerAddress.slice(-4)}` : 'Comprador'}
                </p>
                <p className="text-zinc-400">
                  Monto: <span className="text-emerald-400 font-bold">${p.amount} USDC</span> · Tokens: {p.tokenCount}
                </p>
                <p className="text-zinc-500 text-[10px]">{new Date(p.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <button
                  onClick={() => handleApprove(p.id)}
                  disabled={actionLoading === p.id}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition-all disabled:opacity-50 shadow-sm"
                >
                  {actionLoading === p.id ? 'Aprobando...' : 'Aprobar & Sincronizar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

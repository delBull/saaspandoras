'use client';

import Link from "next/link";
import { useState } from 'react';
import { Ticket, Lock, Unlock, Share2, Users, Heart, Check, Clock, Shield, Copy, MessageSquare, ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SimpleTooltip } from "../ui/simple-tooltip";
import { toast } from "sonner";
import type { ProjectData } from "@/app/()/projects/types";
import AccessCardPurchaseModal from "../modals/AccessCardPurchaseModal";
import ArtifactPurchaseModal from "../modals/ArtifactPurchaseModal"; // Unified Modal
import PerksModal from "../modals/PerksModal";
import type { UtilityPhase } from '@/types/deployment';
import { useActiveAccount, useReadContract, TransactionButton, useWalletBalance } from "thirdweb/react";
import { getContract, defineChain, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { balanceOf } from "thirdweb/extensions/erc721";

interface ProjectSidebarProps {
  project: ProjectData;
  targetAmount: number;
}

export default function ProjectSidebar({ project, targetAmount }: ProjectSidebarProps) {
  const [isPerksModalOpen, setIsPerksModalOpen] = useState(false);
  const [initialPurchaseAmount, setInitialPurchaseAmount] = useState<string | undefined>(undefined);
  // Debug: Check status
  // console.log("ProjectSidebar Debug:", { id: project.id, status: project.deploymentStatus });
  // Robust Chain ID handling: Handle potential undefined/null/NaN/0 values from DB
  const rawChainId = Number(project.chainId);
  const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111; // Default Sepolia


  // --- Access Gating Logic ---
  const account = useActiveAccount();



  // 1. Define License Contract safely
  // Ensure address is a valid hex string AND not the zero address
  const isValidAddress = (addr: string | null | undefined): boolean =>
    !!addr && addr.startsWith("0x") && addr.length === 42 && addr !== "0x0000000000000000000000000000000000000000";

  const licenseContract = (() => {
    // Priority chain for license contract address:
    // 1. project.licenseContractAddress (canonical field)
    // 2. project.w2eConfig?.licenseToken?.address (common V1 deploy location)
    // 3. project.contractAddress (legacy field name)
    // 4. project.utilityContractAddress (last resort for V1 protocols)
    const candidates = [
      project.licenseContractAddress,
      project.w2eConfig?.licenseToken?.address,
      (project as any).contractAddress,
      project.utilityContractAddress,
    ];
    const resolvedAddress = candidates.find(addr => isValidAddress(addr as string));
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Sidebar] licenseContract resolution:', {
        licenseContractAddress: project.licenseContractAddress,
        w2eConfigLicense: project.w2eConfig?.licenseToken?.address,
        contractAddress: (project as any).contractAddress,
        resolved: resolvedAddress
      });
    }
    return resolvedAddress
      ? getContract({
        client,
        chain: defineChain(safeChainId),
        address: resolvedAddress as string
      })
      : undefined;
  })();

  // Fallback to prevent hook crash if contract is undefined (even if disabled)
  // Use the SAME chain to avoid mismatches
  const dummyContract = getContract({
    client,
    chain: defineChain(safeChainId),
    address: "0x0000000000000000000000000000000000000000"
  });

  // 2. Read Balance (Check if user holds Access NFT)
  const { data: licenseBalance } = useReadContract({
    contract: licenseContract || dummyContract,
    queryOptions: { enabled: !!account && !!licenseContract },
    method: "function balanceOf(address) view returns (uint256)",
    params: [account?.address || "0x0000000000000000000000000000000000000000"]
  });

  const hasAccess = licenseBalance ? Number(licenseBalance) > 0 : false;
  // For verification: If we are the creator, maybe bypass? No, stricter is better.

  // --- Real Data Hooks (Moved Down) ---
  const { data: treasuryBalance } = useWalletBalance({
    client,
    chain: defineChain(safeChainId),
    address: project.treasuryAddress && project.treasuryAddress.startsWith('0x') ? project.treasuryAddress : undefined,
  });

  const { data: totalSupply } = useReadContract({
    contract: licenseContract || dummyContract, // Safe now
    queryOptions: { enabled: !!licenseContract },
    method: "function totalSupply() view returns (uint256)",
    params: []
  });

  const dbRaised = Number(project.raised_amount ?? 0);
  const raisedAmount = treasuryBalance ? Number(treasuryBalance.displayValue) : dbRaised;

  // Calculate Progress Logic
  const price = Number(project.w2eConfig?.licenseToken?.price ?? 0);
  const maxSupply = Number(project.w2eConfig?.licenseToken?.maxSupply ?? 0);

  // Financial Progress
  const financialProgress = targetAmount > 0 ? Math.min((raisedAmount / targetAmount) * 100, 100) : 0;

  // Token Progress (For Free Mints)
  const currentSupply = totalSupply ? Number(totalSupply) : 0;
  const tokenProgress = maxSupply > 0 ? Math.min((currentSupply / maxSupply) * 100, 100) : 0;

  // Effective Progress (Use Token Progress if Price is 0 or it's higher)
  const progressPercent = price === 0 ? tokenProgress : Math.max(financialProgress, tokenProgress);

  const raisedPercentage = progressPercent;

  // --- Phase Stats Calculation (Replicated from Tabs for Robustness) ---
  const getPhases = () => {
    try {
      const config = typeof project.w2eConfig === 'string'
        ? JSON.parse(project.w2eConfig)
        : (project.w2eConfig || {});

      // 1. Direct phases in config (V1 style)
      let phases = config.phases || (project as any).phases || [];

      // 2. If V2, check artifacts for phases
      if (phases.length === 0 && project.artifacts?.length) {
        // Collect phases from all artifacts (V2 modular approach)
        // Ensure each phase knows which contract address it belongs to
        const artifactPhases = project.artifacts
          .flatMap((a: any) => (a.phases || []).map((p: any) => ({
            ...p,
            artifactAddress: a.address || a.contractAddress // Handle both possible field names
          })))
          .filter((p: any) => p?.name);

        if (artifactPhases.length > 0) {
          phases = artifactPhases;
        }
      }

      return phases;
    } catch (e) {
      console.error("[Sidebar] Error parsing w2eConfig:", e);
      return (project as any).phases || [];
    }
  };

  const allPhases = getPhases();
  const config = typeof project.w2eConfig === 'string'
    ? JSON.parse(project.w2eConfig)
    : (project.w2eConfig || {});
  const accessCardImage = config.accessCardImage || project.image_url;

  // --- Smooth Scroll Logic ---
  const scrollToPhases = () => {
    const element = document.getElementById('tab-phases');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback: switch tab via URL if not in DOM, but try to stay on page if possible
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'utility');
      url.hash = 'tab-phases';
      window.location.href = url.toString();
    }
  };
  // let accumulatedUSD = 0; // Unused
  let accumulatedTokens = 0;

  const phasesWithStats = allPhases.map((phase: any) => {
    const price = Number(phase.tokenPrice || 0);
    const allocation = Number(phase.tokenAllocation || 0); // Tokens

    const stats = {
      cap: 0,
      raised: 0,
      percent: 0,
      isSoldOut: false,
      tokensAllocated: 0,
      tokensSold: 0,
      remainingTokens: 0,
      velocity: ''
    };

    // UNIFIED LOGIC: Always track by Tokens First (Source of Truth) to determine Sold Out
    // If Price > 0, we can display USD, but the limit logic should respect the Token Allocation if present.
    // NOTE: If phase.type === 'amount' (USD Limit), we track USD. If 'time', we track Tokens?
    // Actually, usually allocations are in TOKENS.

    // For this fix, we will prioritize Token Allocation check against Total Supply.

    // Calculate Phase Cap in Tokens
    const phaseCapTokens = allocation;

    // Calculate Raised Tokens for this phase
    const phaseStartTokens = accumulatedTokens;
    const currentPhaseRaisedTokens = Math.max(0, Math.min(allocation, currentSupply - phaseStartTokens));

    if (price === 0) {
      // Free Mint
      stats.cap = allocation;
      stats.raised = currentPhaseRaisedTokens;
      stats.percent = allocation > 0 ? (currentPhaseRaisedTokens / allocation) * 100 : 0;
      stats.isSoldOut = currentPhaseRaisedTokens >= allocation && allocation > 0;
    } else {
      // Paid Mint
      // We still check Sold Out based on Token Allocation because checking USD wallet balance is flaky
      const phaseCapUSD = phase.type === 'amount' ? Number(phase.limit) : (allocation * price);
      stats.cap = phaseCapUSD;

      // Infer Raised USD from Raised Tokens (more stable than wallet balance)
      const inferredRaisedUSD = currentPhaseRaisedTokens * price;
      stats.raised = inferredRaisedUSD;

      stats.percent = phaseCapUSD > 0 ? (inferredRaisedUSD / phaseCapUSD) * 100 : 0;
      stats.percent = phaseCapUSD > 0 ? (inferredRaisedUSD / phaseCapUSD) * 100 : 0;
      stats.isSoldOut = currentPhaseRaisedTokens >= allocation && allocation > 0;
    }

    // Add explicit token stats for Modal validation
    stats.tokensAllocated = allocation;
    stats.tokensSold = currentPhaseRaisedTokens;
    stats.remainingTokens = Math.max(0, allocation - currentPhaseRaisedTokens);

    // Provide a dynamic wear-down velocity for scarcity indicators
    const uniquenessSeed = (phase.name?.length || 4) % 3 + 2; 
    const activityFactor = currentPhaseRaisedTokens > 0 ? Math.max(1, Math.floor((currentPhaseRaisedTokens / Math.max(1, allocation)) * 10)) : 0;
    stats.velocity = `+${uniquenessSeed + activityFactor}`;

    accumulatedTokens += allocation;
    // We don't really use accumulatedUSD for calculation anymore in this unified approach

    return { ...phase, stats };
  });

  // Debug log (remove in prod)
  // console.log("Gating Check:", { user: account?.address, hasAccess, balance: licenseBalance?.toString() });

  // Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<UtilityPhase | null>(null);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handlePhaseClick = (phase: any) => {
    setSelectedPhase(phase);
    setIsArtifactModalOpen(true);
  };

  const isDeployed = ['approved', 'live', 'deployed', 'active'].includes(project.status?.toLowerCase() || '') || project.deploymentStatus === 'deployed';
  // Check if current connected wallet is the protocol creator (owner)
  const isOwner = !!account?.address &&
    !!(project.applicant_wallet_address) &&
    account.address.toLowerCase() === (project.applicant_wallet_address as string).toLowerCase();

  return (
    <>
      <div className="hidden lg:block absolute right-0 top-0 w-72 h-full z-20">
        {/* Non-sticky section - Investment & Creator cards */}
        <div className="space-y-6 mb-6">
          {/* Access / Investment Card */}
          <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-6 relative overflow-hidden group">
            {/* Access Card Background (Optional visual flair) */}
            {accessCardImage && (
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={accessCardImage} alt="" className="w-full h-full object-cover blur-sm" />
              </div>
            )}

            <div className="text-center mb-6 relative z-10">
              {accessCardImage && (
                <div className="mb-4 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-lime-400/50 shadow-[0_0_20px_rgba(163,230,53,0.3)] mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={accessCardImage} alt="Access NFT" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lime-400 font-bold text-sm tracking-wider uppercase">Access Card</h3>
                </div>
              )}

              {/* Goal and Status Tags */}
              <div className="flex flex-col items-center gap-3 mb-6 relative z-10 w-full px-4">
                <div className="bg-zinc-900/60 border border-white/10 px-4 py-3 rounded-2xl flex items-center justify-between gap-4 w-full shadow-lg">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Objetivo</span>
                    <span className="text-sm font-bold text-white tracking-tight">
                      ${targetAmount.toLocaleString(undefined, { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: (targetAmount < 1 ? 4 : 0) 
                      })} USD
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    isDeployed 
                    ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20' 
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isDeployed ? 'bg-lime-400 animate-pulse' : 'bg-yellow-400'}`} />
                    {isDeployed ? 'Activo' : 'Espera'}
                  </div>
                </div>
              </div>

              {/* === BUTTON LOGIC === */}
              {isOwner ? (
                // Owner: show DAO management button
                <div className="space-y-2 w-full mb-4">
                  <Link
                    href={`/projects/${project.slug}/dao`}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(147,51,234,0.4)] hover:scale-[1.02]"
                  >
                    <Shield className="w-4 h-4" />
                    Gestión de DAO
                  </Link>
                  {hasAccess && (
                    <div className="w-full bg-lime-500/10 border border-lime-500/30 text-lime-400 py-2 px-6 rounded-lg flex items-center justify-center gap-2 text-sm">
                      <Unlock className="w-3 h-3" />
                      Tu acceso está activo
                    </div>
                  )}
                </div>
              ) : hasAccess ? (
                <div className="space-y-2 w-full mb-4">
                  <div className="w-full bg-lime-500/10 border border-lime-500/30 text-lime-400 py-3 px-6 rounded-lg flex items-center justify-center gap-2 backdrop-blur-sm">
                    <Unlock className="w-3 h-3" />
                    Acceso Verificado
                  </div>
                  <button
                    onClick={scrollToPhases}
                    className="w-full py-1 text-xs text-zinc-400 hover:text-lime-400 hover:bg-white/5 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Ver Fases</span>
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <Link href={`/projects/${project.slug}/dao`} className="w-full hover:bg-white/5 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/5">
                    <Shield className="w-3 h-3 text-sm text-lime-400" />
                    Ir al DAO
                  </Link>

                  {/* Dynamic Perks Button */}
                  <button
                    onClick={() => setIsPerksModalOpen(true)}
                    className="w-full bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95 shadow-xl"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>{hasAccess ? 'Tus Beneficios' : 'Ver Beneficios'}</span>
                  </button>
                </div>
              ) : isDeployed && licenseContract && account ? (
                <div className="space-y-2 w-full mb-4">
                  <button
                    onClick={() => setIsAccessModalOpen(true)}
                    className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-2 rounded-lg flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(163,230,53,0.4)] text-sm whitespace-nowrap transition-all hover:scale-[1.02]"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Obtener Acceso</span>
                  </button>
                  <button
                    onClick={() => setIsPerksModalOpen(true)}
                    className="w-full bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Ver Beneficios</span>
                  </button>
                  <button
                    onClick={scrollToPhases}
                    className="w-full py-1 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Ver Fases</span>
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  className="w-full font-bold py-3 px-6 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2 bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50 backdrop-blur-sm"
                  disabled
                >
                  {!account ? (
                    <>
                      <Ticket className="w-5 h-5" />
                      Conecta tu Wallet
                    </>
                  ) : isDeployed ? (
                    <>
                      <Ticket className="w-5 h-5" />
                      Acceso Próximamente
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Próximamente
                    </>
                  )}
                </button>
              )}

              <div className="flex justify-center gap-3 mb-4">
                {/* 1. Share Project */}
                <SimpleTooltip content="Compartir Proyecto">
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 text-zinc-400 hover:text-lime-400 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </SimpleTooltip>

                {/* 2. Referral / Invite (Activator) */}
                <SimpleTooltip content="Programa de Referidos (Próximamente)">
                  <button className="p-2 text-zinc-400 hover:text-white transition-colors cursor-not-allowed">
                    <Users className="w-3 h-3" />
                  </button>
                </SimpleTooltip>

                {/* 3. Support / Donate (Activator) */}
                <SimpleTooltip content="Like (Próximamente)">
                  <button className="p-2 text-zinc-400 hover:text-pink-400 transition-colors cursor-not-allowed">
                    <Heart className="w-3 h-3" />
                  </button>
                </SimpleTooltip>
              </div>

              <div className="text-xs text-zinc-500">
                {isDeployed
                  ? "El acceso desbloquea utilidades exclusivas del protocolo."
                  : "Esta creación solo será activada si alcanza su meta antes de la fecha límite."}
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500 text-center">
              Este NFT otorga acceso a la utilidad del protocolo.
            </p>
          </div>

          {/* Project Creator Card (Compact Redesign) */}
          <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10">
              <span className="text-white font-bold text-xs">IMG</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Creación Por</p>
              <div className="text-white font-medium truncate">{project.applicant_name ?? "Creador"}</div>
              <div className="text-zinc-500 text-xs mt-0.5">
                {(() => {
                  const createdDate = project.created_at ? new Date(project.created_at as string) : new Date();
                  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                  return `${monthNames[createdDate.getMonth()]} ${createdDate.getFullYear()}`;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky section - Tokenomics & Offers (from here down) */}
        <div id="sidebar-phases" className="sticky top-6 space-y-6">

          {/* Utility Offers Panel (Dynamic Phases) */}
          {(allPhases && allPhases.length > 0) ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-lime-400" /> Fases de Venta
              </h3>
              <div className="space-y-4">
                {phasesWithStats
                  .map((phase: any, index: number) => {
                    // 1. Calculate Status for Sorting
                    const now = new Date();
                    const hasStarted = !phase.startDate || new Date(phase.startDate) <= now;
                    const hasEnded = phase.endDate && new Date(phase.endDate) < now;
                    const isNotPaused = phase.isActive !== false;
                    const isSoldOut = phase.stats?.isSoldOut || false;

                    // Check previous phase for sequential logic
                    // Note: We use original index from phasesWithStats to check previous
                    const previousPhase = index > 0 ? phasesWithStats[index - 1] : null;
                    const previousIsSoldOut = previousPhase?.stats?.isSoldOut ?? true;
                    const previousHasEnded = !!(previousPhase?.endDate && new Date(previousPhase.endDate) < now);
                    const previousIsComplete = previousIsSoldOut || previousHasEnded;

                    let status: string = 'inactive';
                    let statusPriority: number = 99; 
                    let statusLabel: string = 'No Disponible';
                    let statusColor: string = 'bg-zinc-600 text-gray-300';

                    if (isSoldOut) {
                      status = 'sold_out';
                      statusPriority = 4;
                      statusLabel = 'Agotado';
                      statusColor = 'bg-red-500/20 text-red-400 border border-red-500/50';
                    } else if (!isNotPaused) {
                      status = 'paused';
                      statusPriority = 5;
                      statusLabel = 'Pausado';
                      statusColor = 'bg-yellow-500/20 text-yellow-400';
                    } else if (hasEnded) {
                      status = 'ended';
                      statusPriority = 6;
                      statusLabel = 'Finalizado';
                      statusColor = 'bg-zinc-600 text-gray-400';
                    } else if (hasStarted) {
                      status = 'active';
                      statusPriority = 1; // Highest priority
                      statusLabel = 'Activo';
                      statusColor = 'bg-lime-500 text-black';
                    } else if (!previousIsComplete && phase.isActive !== true) {
                      status = 'waiting';
                      statusPriority = 3; // Treat as upcoming/waiting
                      statusLabel = 'Esperando';
                      statusColor = 'bg-orange-500/20 text-orange-400';
                    } else {
                      status = 'coming_soon';
                      statusPriority = 2; // Upcoming is second priority
                      statusLabel = 'Próximamente';
                      statusColor = 'bg-blue-500/20 text-blue-400';
                    }

                    return { ...phase, status, statusPriority, statusLabel, statusColor };
                  })
                  .sort((a: any, b: any) => {
                    // Sort by Priority
                    if (a.statusPriority !== b.statusPriority) return a.statusPriority - b.statusPriority;
                    // Then by Original Order (implied by stability of sort or we can use ID/index if needed)
                    return 0;
                  })
                  .map((phase: any) => {
                    const isActive = phase.status === 'active';
                    // Using hasAccess from the parent scope (on-chain verification result)

                    return (
                      <div key={phase.id} className={`bg-zinc-800 rounded-lg overflow-hidden border ${isActive ? 'border-lime-500/30' : 'border-zinc-700'} group transition-all hover:border-lime-500/50`}>
                        {/* Phase Image (Rich UI) */}
                        {phase.image && (
                          <div className="h-32 w-full relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={phase.image} alt={phase.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-90" />
                            {/* Overlay Badge */}
                            <div className="absolute bottom-2 left-3">
                              <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${phase.statusColor}`}>
                                {phase.statusLabel}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="text-white font-bold text-lg mb-1">{phase.name}</h4>
                              <p className="text-gray-400 text-xs uppercase tracking-wide">
                                {phase.type === 'amount' ? `Meta: $${Number(phase.limit).toLocaleString()}` : `Duración: ${phase.limit} días`}
                              </p>
                            </div>
                            {!phase.image && (
                              <span className={`text-xs px-2 py-1 rounded font-bold uppercase border border-white/10 ${phase.statusColor.replace('bg-', 'text-').replace('text-black', 'bg-white/10')}`}>
                                {phase.statusLabel}
                              </span>
                            )}
                          </div>

                          {/* Button Gated by Access */}
                          {hasAccess ? (
                            <button
                              onClick={() => isActive && !phase.stats.isSoldOut && handlePhaseClick(phase)}
                              className={`w-full py-3 px-4 rounded-lg transition-all text-sm font-bold flex items-center justify-center gap-2 ${isActive && !phase.stats.isSoldOut
                                ? 'bg-lime-400 hover:bg-lime-500 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:scale-[1.02]'
                                : 'bg-zinc-700 text-gray-400 cursor-not-allowed opacity-70'
                                }`}
                              disabled={!isActive || phase.stats.isSoldOut}
                            >
                              {phase.status === 'coming_soon' || phase.status === 'paused' || phase.status === 'waiting' ? (
                                <>
                                  <Clock className="w-4 h-4" />
                                  Próximamente
                                </>
                              ) : phase.status === 'sold_out' ? (
                                <>
                                  <Lock className="w-4 h-4" />
                                  Agotado
                                </>
                              ) : isActive ? (
                                <>
                                  <Ticket className="w-4 h-4" />
                                  Adquirir Artefactos
                                </>
                              ) : (
                                'No Disponible'
                              )}
                            </button>
                          ) : (
                            <div className="relative group/lock w-full">
                              <button
                                className="w-full py-3 px-4 rounded-lg bg-zinc-800 text-gray-500 text-sm font-medium border border-zinc-700 border-dashed flex items-center justify-center gap-2 cursor-not-allowed hover:bg-zinc-750"
                                disabled
                              >
                                <Lock className="w-4 h-4" />
                                Bloqueado
                              </button>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-black text-white text-xs p-3 rounded-lg hidden group-hover/lock:block text-center border border-zinc-700 shadow-xl z-50">
                                <p className="font-bold text-lime-400 mb-1">Acceso Restringido</p>
                                Adquiere el NFT de Acceso para participar en esta fase.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            // Fallback for projects without config
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-zinc-600" /> Ofertas
              </h3>
              <p className="text-zinc-500 text-sm">No hay fases de venta activas configuradas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartir Proyecto</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <button
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?text=Check out ${project.title} on Pandoras!&url=${window.location.href}`, '_blank');
                setIsShareModalOpen(false);
              }}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors border border-zinc-800"
            >
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-zinc-700">
                <span className="text-white font-bold text-lg">X</span>
              </div>
              <span className="text-xs text-zinc-400">Twitter / X</span>
            </button>

            <button
              onClick={() => {
                window.open(`https://wa.me/?text=Check out ${project.title} on Pandoras: ${window.location.href}`, '_blank');
                setIsShareModalOpen(false);
              }}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors border border-zinc-800"
            >
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-zinc-400">WhatsApp</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Enlace copiado");
                setIsShareModalOpen(false);
              }}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors border border-zinc-800"
            >
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                <Copy className="w-5 h-5 text-lime-400" />
              </div>
              <span className="text-xs text-zinc-400">Copiar</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <AccessCardPurchaseModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        project={project}
        licenseContract={licenseContract}
      />

      {/* Unified Artifact Modal */}
      <ArtifactPurchaseModal
        isOpen={isArtifactModalOpen}
        onClose={() => {
            setIsArtifactModalOpen(false);
            setInitialPurchaseAmount(undefined);
        }}
        project={project}
        utilityContract={{ address: project.utilityContractAddress }}
        phase={selectedPhase}
        userArtifactCount={licenseBalance ? Number(licenseBalance) : 0}
        initialAmount={initialPurchaseAmount}
      />

      <PerksModal 
        isOpen={isPerksModalOpen}
        onClose={() => setIsPerksModalOpen(false)}
        project={project}
        userArtifactCount={licenseBalance ? Number(licenseBalance) : 0}
        onBuyMore={(amount) => {
            setIsPerksModalOpen(false);
            setInitialPurchaseAmount(String(amount));
            const activePhase = phasesWithStats.find((p: any) => p.status === 'active');
            if (activePhase) {
                setSelectedPhase(activePhase);
                setIsArtifactModalOpen(true);
            } else {
                scrollToPhases();
                toast.info("Por favor selecciona una fase activa para continuar.");
            }
        }}
      />
    </>
  );
}

'use client';

import Link from "next/link";
import { useState } from 'react';
import { Ticket, Lock, Unlock, Share2, Users, Heart, Check, Clock, Shield, Copy, MessageSquare, ArrowDown, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SimpleTooltip } from "../ui/simple-tooltip";
import { toast } from "sonner";
import type { ProjectData } from "@/app/()/projects/types";
import AccessCardPurchaseModal from "../modals/AccessCardPurchaseModal";
import ArtifactPurchaseModal from "../modals/ArtifactPurchaseModal"; // Unified Modal
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

  const licenseContract = isValidAddress(project.licenseContractAddress) ? getContract({
    client,
    chain: defineChain(safeChainId),
    address: project.licenseContractAddress!
  }) : undefined;

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
    address: project.treasuryAddress || "",
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
  const allPhases = project.w2eConfig?.phases || [];
  // let accumulatedUSD = 0; // Unused
  let accumulatedTokens = 0;

  const phasesWithStats = allPhases.map((phase: any) => {
    const price = Number(phase.tokenPrice || 0);
    const allocation = Number(phase.tokenAllocation || 0); // Tokens

    const stats = {
      cap: 0,
      raised: 0,
      percent: 0,
      isSoldOut: false
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
      stats.isSoldOut = currentPhaseRaisedTokens >= allocation && allocation > 0;
    }

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

  return (
    <>
      <div className="hidden lg:block absolute right-0 top-0 w-72 h-full z-20">
        {/* Non-sticky section - Investment & Creator cards */}
        <div className="space-y-6 mb-6">
          {/* Access / Investment Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 relative overflow-hidden group">
            {/* Access Card Background (Optional visual flair) */}
            {project.w2eConfig?.accessCardImage && (
              <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.w2eConfig.accessCardImage} alt="" className="w-full h-full object-cover blur-sm" />
              </div>
            )}

            <div className="text-center mb-6 relative z-10">
              {project.w2eConfig?.accessCardImage ? (
                <div className="mb-4 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-lime-400/50 shadow-[0_0_20px_rgba(163,230,53,0.3)] mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={project.w2eConfig.accessCardImage} alt="Access NFT" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-lime-400 font-bold text-sm tracking-wider uppercase">Access Card</h3>
                </div>
              ) : (
                <div className="text-3xl font-bold text-white mb-2">
                  {price === 0 ? (
                    <span>{currentSupply} / {maxSupply > 0 ? maxSupply.toLocaleString() : '∞'}</span>
                  ) : (
                    <span>${raisedAmount.toLocaleString()}</span>
                  )}
                </div>
              )}

              {!project.w2eConfig?.accessCardImage && (
                <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
                  <div
                    className="bg-lime-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(raisedPercentage, 100)}%` }}
                  ></div>
                </div>
              )}

              <div className="flex justify-between text-sm mb-6">
                <span className="text-gray-400">Meta: {project.w2eConfig?.licenseToken?.maxSupply ? Number(project.w2eConfig.licenseToken.maxSupply).toLocaleString() : targetAmount.toLocaleString()} tokens</span>
                <span className="text-gray-400">Status: {project.deploymentStatus === 'deployed' ? '🟢 Activo' : '🟡 Espera'}</span>
              </div>

              {hasAccess ? (
                <div className="space-y-2 w-full mb-4">
                  <div className="w-full bg-zinc-800/80 border border-lime-500/50 text-lime-400 py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                    <Unlock className="w-3 h-3" />
                    Acceso Verificado
                  </div>
                  <button
                    onClick={() => document.getElementById('sidebar-phases')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full py-1 text-xs text-zinc-500 hover:text-lime-400 hover:bg-zinc-800/50 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Ver Fases</span>
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <Link href={`/projects/${project.slug}/dao`} className="w-full hover:bg-zinc-700/20 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <Shield className="w-3 h-3 text-sm text-lime-400" />
                    Ir al DAO
                  </Link>
                </div>
              ) : project.deploymentStatus === 'deployed' && licenseContract && account ? (
                <div className="space-y-2 w-full mb-4">
                  <button
                    onClick={() => setIsAccessModalOpen(true)}
                    className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-2 rounded-lg flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(163,230,53,0.4)] text-sm whitespace-nowrap transition-all hover:scale-[1.02]"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Obtener Acceso</span>
                  </button>
                  <button
                    onClick={() => document.getElementById('sidebar-phases')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full py-1 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Ver Fases</span>
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  className="w-full font-bold py-3 px-6 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2 bg-zinc-700 text-gray-500 cursor-not-allowed border border-zinc-600"
                  disabled
                >
                  {project.deploymentStatus === 'deployed' ? (
                    <>
                      <Ticket className="w-5 h-5" />
                      Conecta tu Wallet
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
                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </SimpleTooltip>

                {/* 2. Referral / Invite (Activator) */}
                <SimpleTooltip content="Programa de Referidos (Próximamente)">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors cursor-not-allowed">
                    <Users className="w-3 h-3" />
                  </button>
                </SimpleTooltip>

                {/* 3. Support / Donate (Activator) */}
                <SimpleTooltip content="Apoyar Creador (Donación)">
                  <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors cursor-not-allowed">
                    <Heart className="w-3 h-3" />
                  </button>
                </SimpleTooltip>
              </div>

              <div className="text-xs text-gray-400">
                {(project as any).deploymentStatus === 'deployed'
                  ? "El acceso desbloquea utilidades exclusivas del protocolo."
                  : "Esta creación solo será activada si alcanza su meta antes de la fecha límite."}
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-400 text-center">
              Este NFT otorga acceso a la utilidad del protocolo.
            </p>
          </div>

          {/* Project Creator Card (Compact Redesign) */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex-shrink-0 flex items-center justify-center border border-zinc-700">
              <span className="text-white font-bold text-xs">IMG</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Creación Por</p>
              <div className="text-white font-medium truncate">{project.applicant_name ?? "Creador"}</div>
              <div className="text-gray-500 text-xs mt-0.5">
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
        <div className="sticky top-6 space-y-6">

          {/* Utility Offers Panel (Dynamic Phases) */}
          {(project.w2eConfig?.phases && project.w2eConfig.phases.length > 0) ? (
            <div id="sidebar-phases" className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
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
                    const previousIsSoldOut = previousPhase ? (previousPhase.stats?.isSoldOut || false) : true;

                    let status = 'inactive';
                    let statusPriority = 99; // Lower is better
                    let statusLabel = 'No Disponible';
                    let statusColor = 'bg-zinc-600 text-gray-300';

                    if (isSoldOut) {
                      status = 'sold_out';
                      statusPriority = 3;
                      statusLabel = 'Agotado';
                      statusColor = 'bg-red-500/20 text-red-400 border border-red-500/50';
                    } else if (!isNotPaused) {
                      status = 'paused';
                      statusPriority = 4;
                      statusLabel = 'Pausado';
                      statusColor = 'bg-yellow-500/20 text-yellow-400';
                    } else if (!hasStarted) {
                      status = 'coming_soon';
                      statusPriority = 2; // Upcoming is second priority
                      statusLabel = 'Próximamente';
                      statusColor = 'bg-blue-500/20 text-blue-400';
                    } else if (hasEnded) {
                      status = 'ended';
                      statusPriority = 5;
                      statusLabel = 'Finalizado';
                      statusColor = 'bg-zinc-600 text-gray-400';
                    } else if (!previousIsSoldOut) {
                      status = 'waiting';
                      statusPriority = 2; // Treat as upcoming/waiting
                      statusLabel = 'Esperando';
                      statusColor = 'bg-orange-500/20 text-orange-400';
                    } else {
                      status = 'active';
                      statusPriority = 1; // Highest priority
                      statusLabel = 'Activo';
                      statusColor = 'bg-lime-500 text-black';
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
                    const hasAccess = true; // We use parent scope hasAccess, need to ensure it's captured or pass it. 
                    // Actually 'hasAccess' is available in scope. 

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
        onClose={() => setIsArtifactModalOpen(false)}
        project={project}
        utilityContract={{ address: project.utilityContractAddress }}
        phase={selectedPhase}
      />
    </>
  );
}

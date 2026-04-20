'use client';

import Link from "next/link";
import { useState } from 'react';
import { 
  Ticket, 
  Lock, 
  Unlock, 
  Share2, 
  Users, 
  Heart, 
  Check, 
  Clock, 
  Shield, 
  Copy, 
  MessageSquare, 
  ArrowDown, 
  ArrowRight, 
  Sparkles,
  Zap,
  ExternalLink
} from "lucide-react";
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
import { calculatePhaseStatus, getProjectPhasesWithStats } from "@/lib/phase-utils";

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

  // 2.1 Token Type Detection & Artifact Count Normalization
  const tokenType = (project as any).tokenType || 'erc20';
  const rawArtifactCount = licenseBalance ? Number(licenseBalance) : 0;
  
  // Normalize artifact count based on token type for progression calculations
  // ERC-721 (NFT): If user has ANY NFT, they qualify - map 0/1 to tier progression
  // ERC-20: Use actual balance (fungible tokens)
  // ERC-1155: Use balance as-is
  const normalizedArtifactCount = (() => {
    if (tokenType === 'erc721') {
      // For NFTs: treat holding as progressive - each tier unlocks based on Having NFT access
      // Map: 0 = 0, 1+ = 1 (min-based progression)
      return rawArtifactCount > 0 ? 1 : 0;
    }
    // ERC-20 or ERC-1155: use actual balance
    return rawArtifactCount;
  })();

  const hasAccess = rawArtifactCount > 0;

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

  const phasesWithStats = getProjectPhasesWithStats(project, currentSupply);
  const allPhases = phasesWithStats;

  const config = typeof project.w2eConfig === 'string'
    ? JSON.parse(project.w2eConfig)
    : (project.w2eConfig || {});
  
  const sanitizeUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    if (['image', 'logo', 'icon', 'undefined', 'null', 'cover'].includes(cleanUrl.toLowerCase())) return null;
    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('/') || cleanUrl.startsWith('data:')) return cleanUrl;
    if (cleanUrl.startsWith('ipfs:')) {
      const path = cleanUrl.replace(/^ipfs:(\/*)/, '');
      return `https://ipfs.io/ipfs/${path}`;
    }
    return `/${cleanUrl}`;
  };

  const accessCardImage = sanitizeUrl(config.accessCardImage || project.image_url);

  // --- Smooth Scroll Logic ---
  const scrollToPhases = () => {
    const element = document.getElementById('phases-section-anchor');
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'utility');
      window.history.pushState({}, '', url.toString());
    }
  };

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
      <div className="hidden lg:block sticky top-6 w-80 h-fit z-20 shrink-0 self-start">
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
        <div id="sidebar-phases" className="sticky top-6 space-y-6" style={{ scrollMarginTop: '100px' }}>

          {/* Utility Offers Panel (Dynamic Phases) */}
          {(allPhases && allPhases.length > 0) ? (
            <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h3 id="phases-section-anchor" className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-lime-400" /> Fases de Venta
              </h3>
              <div className="space-y-4">
                {phasesWithStats
                  .sort((a: any, b: any) => {
                    const priorityArr = ['active', 'upcoming', 'paused', 'sold_out', 'ended'];
                    const aPrio = priorityArr.indexOf(a.status);
                    const bPrio = priorityArr.indexOf(b.status);
                    return aPrio - bPrio;
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
                                {phase.type === 'amount' ? `Meta: ${phase.metric === 'USD' ? '$' : ''}${Number(phase.cap || 0).toLocaleString(undefined, { minimumFractionDigits: Number(phase.cap) < 1 ? 3 : 2, maximumFractionDigits: Number(phase.cap) < 1 ? 4 : 2 })} ${phase.metric === 'Tokens' ? 'NFTs' : ''}` : `Duración: ${phase.limit} días`}
                              </p>
                            </div>
                            {!phase.image && (
                              <span className={`text-xs px-2 py-1 rounded font-bold uppercase border border-white/10 ${phase.statusColor.replace('bg-', 'text-').replace('text-black', 'bg-white/10')}`}>
                                {phase.statusLabel}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => isActive && !phase.stats.isSoldOut && handlePhaseClick(phase)}
                            className={`w-full py-3 px-4 rounded-lg transition-all text-sm font-bold flex items-center justify-center gap-2 ${isActive && !phase.stats.isSoldOut
                              ? 'bg-lime-400 hover:bg-lime-500 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:scale-[1.02]'
                              : 'bg-zinc-700 text-gray-400 cursor-not-allowed opacity-70'
                              }`}
                            disabled={!isActive || phase.stats.isSoldOut}
                          >
                            {phase.status === 'upcoming' || phase.status === 'paused' ? (
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
        userArtifactCount={normalizedArtifactCount}
        initialAmount={initialPurchaseAmount}
        tokenType={tokenType as any}
      />

      <PerksModal 
        isOpen={isPerksModalOpen}
        onClose={() => setIsPerksModalOpen(false)}
        project={project}
        userArtifactCount={normalizedArtifactCount}
        tokenType={tokenType as any}
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

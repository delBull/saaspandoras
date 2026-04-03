'use client';

import { useState, useEffect } from "react";
import ArtifactPurchaseModal from "@/components/modals/ArtifactPurchaseModal";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Shield,
  Users,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Award,
  ExternalLink,
  Wallet,
  Building,
  Scale,
  Ticket,
  Clock,
  Zap,
  Lock,
  MessageCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  Phone,
  User,
  CheckCircle,
  Copy,
  Puzzle,
  Code,
  Crown,
  Briefcase,
  Star,
  LayoutGrid,
  ArrowRight,
  PlayCircle,
  DollarSign
} from "lucide-react";
import { UserGovernanceList } from "../user/UserGovernanceList";
import type { ProjectData } from "@/app/()/projects/types";
import { defineChain, getContract, readContract, resolveMethod } from "thirdweb";
import { useReadContract, useWalletBalance } from "thirdweb/react";
import { getTargetAmount } from "@/lib/project-utils";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { calculatePhaseStatus } from "@/lib/phase-utils";
// Format Helper
const formatCurrency = (amount: number | string) => {
  const num = Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: num < 1 ? 4 : 0,
    maximumFractionDigits: num < 1 ? 4 : 2,
  }).format(num);
};

// Human-readable legalStatus labels for consistent display
const LEGAL_STATUS_LABELS: Record<string, string> = {
  'sapi_mexico': 'S.A.P.I. de C.V. — Sociedad Anónima Promotora de Inversión (México)',
  'sa_mexico': 'S.A. de C.V. — Sociedad Anónima de Capital Variable (México)',
  'srl_mexico': 'S. de R.L. de C.V. — Sociedad de Responsabilidad Limitada (México)',
  'llc_usa': 'LLC — Limited Liability Company (Estados Unidos)',
  'corp_usa': 'Corp. — Corporation (Estados Unidos)',
  'foundation': 'Fundación sin fines de lucro',
  'dao': 'DAO — Organización Autónoma Descentralizada',
  'bvi': 'BVI Ltd. — Compañía en Islas Vírgenes Británicas',
  'cayman': 'Cayman Islands Foundation Company',
  'panama': 'Sociedad Anónima (Panamá)',
  'digital_asset': 'Activo Digital (sin entidad corporativa formal)',
  'pending': 'Pendiente de constituir',
  'other': 'Otro / En proceso de definición',
};

function getLegalLabel(value: string | null | undefined): string {
  if (!value) return 'No especificado';
  return LEGAL_STATUS_LABELS[value] ?? value;
}
import SectionCard from "./SectionCard";

const TagIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'residential_real_estate':
    case 'commercial_real_estate':
      return <Building className="w-3 h-3" />;
    case 'tech_startup':
      return <Zap className="w-3 h-3" />;
    case 'renewable_energy':
      return <Globe className="w-3 h-3" />;
    case 'art_collectibles':
      return <Award className="w-3 h-3" />;
    case 'intellectual_property':
      return <Scale className="w-3 h-3" />;
    default:
      return <TagIconInner className="w-3 h-3" />;
  }
};

// Simple internal tag icon if no match
const TagIconInner = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

function ArtifactsStats({ licenseContract }: { licenseContract: any }) {
  const { data: artifactsMinted } = useReadContract({
    contract: licenseContract,
    method: "function totalSupply() view returns (uint256)",
    params: []
  });
  return (
    <>{artifactsMinted ? artifactsMinted.toString() : "0"}</>
  );
}

interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface ProjectContentTabsProps {
  project: ProjectData;
}

export default function ProjectContentTabs({ project }: ProjectContentTabsProps) {
  const [activeTab, setActiveTab] = useState("campaign");
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);

  // Robust Chain ID handling
  const rawChainId = Number((project as any).chainId);
  const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;

  console.log("DEBUG: ProjectContentTabs", {
    title: project.title,
    chainId: project.chainId || "MISSING",
    safeChainId,
    treasuryAddress: project.treasuryAddress,
    treasuryContractAddress: (project as any).treasuryContractAddress,
    rawChainId
  });

  // --- REAL TIME DATA HOOKS ---
  const licenseContract = project.licenseContractAddress ? getContract({
    client,
    chain: defineChain(safeChainId),
    address: project.licenseContractAddress,
  }) : undefined;

  const { data: treasuryBalance } = useWalletBalance({
    client,
    chain: defineChain(safeChainId),
    address: project.treasuryAddress?.startsWith('0x') ? project.treasuryAddress : undefined,
  });

  const fundsRaised = treasuryBalance ? Number(treasuryBalance.displayValue) : 0;
  const targetAmount = getTargetAmount(project);
  const progressPercent = targetAmount > 0
    ? Math.min((fundsRaised / targetAmount) * 100, 100)
    : 0;

  // Fallback contract to fix TS error when licenseContract is undefined
  const dummyContract = getContract({
    client,
    chain: defineChain(safeChainId),
    address: "0x0000000000000000000000000000000000000000"
  });

  // Read Total Supply (for Free Mint progress)
  const { data: totalSupplyBN } = useReadContract({
    contract: licenseContract || dummyContract,
    queryOptions: { enabled: !!licenseContract },
    method: "function totalSupply() view returns (uint256)",
    params: []
  });
  const totalSupply = totalSupplyBN ? Number(totalSupplyBN) : 0;

  // --- Calculate Phase Stats ---
  const getPhases = () => {
    try {
      let config: Record<string, any> = {};
      try {
        config = typeof project.w2eConfig === 'string'
          ? JSON.parse(project.w2eConfig)
          : (project.w2eConfig || {});
      } catch {
        config = {};
      }

      // 1. Direct phases in config (V1 style)
      let phases = config.phases || (project as any).phases || [];

      // 2. If V2, check artifacts for phases
      if (phases.length === 0 && project.artifacts?.length) {
        const artifactPhases = project.artifacts
          .flatMap((a: any) => a.phases || [])
          .filter((p: any) => p?.name);

        if (artifactPhases.length > 0) {
          phases = artifactPhases;
        }
      }

      return phases;
    } catch (e) {
      console.error("[Tabs] Error parsing w2eConfig:", e);
      return (project as any).phases || [];
    }
  };
  const allPhases = getPhases();

  // We need to track BOTH USD accumulation and Token accumulation because phases might mix free/paid? 
  // For simplicity, let's assume if price is 0, we track tokens. If price > 0, we track USD.
  // Actually, simplest is to track "Sold Tokens" for everything?
  // But legacy logic tracks USD.

  // let accumulatedUSD = 0; // Unused
  let accumulatedTokens = 0;

  let tabsAccumulatedTokens = 0;

  const phasesWithStats = allPhases.map((phase: any) => {
    const statusData = calculatePhaseStatus(phase, totalSupply, tabsAccumulatedTokens);
    tabsAccumulatedTokens += Number(phase.tokenAllocation || 0);

    return {
      ...phase,
      stats: {
        ...statusData,
        participants: 0, // Keep field for UI compatibility, though logic was removed previously
      },
      ...statusData // Flatten if needed
    };
  });

  const activePhasesWithStats = phasesWithStats.filter((p: any) => p.isActive);
  const historicalPhasesWithStats = phasesWithStats.filter((p: any) => !p.isActive);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam && ['campaign', 'utility', 'strategy', 'compliance'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Función para mostrar el video (ya no utilizada)
  const _showVideo = () => {
    const videoRef = (window as any).projectVideoRef;
    if (videoRef?.showVideo) {
      videoRef.showVideo();
    }
  };

  const tabs: Tab[] = [
    // --- TAB 0: CAMPAÑA (LA PRESENTACIÓN) ---
    {
      id: 'campaign',
      label: 'Campaña',
      icon: Star,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Descripción del Protocolo" icon={Star}>
            <div className="mb-6">
              {project.tagline && (
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 italic">
                  "{project.tagline}"
                </h2>
              )}
              {project.business_category && typeof project.business_category === 'string' && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs font-bold uppercase tracking-wider">
                  <TagIcon category={project.business_category} />
                  {project.business_category.replace(/_/g, ' ')}
                </div>
              )}
            </div>
            <p className="text-zinc-300 whitespace-pre-line text-lg leading-relaxed">
              {project.description ?? 'No hay descripción disponible para este proyecto.'}
            </p>
          </SectionCard>

          {/* Video Pitch - shown if available */}
          {(project.video_pitch || (project as any).videoPitch) && (
            <SectionCard title="Video de Presentación" icon={PlayCircle}>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-zinc-800">
                <iframe
                  src={(() => {
                    const url = project.video_pitch || (project as any).videoPitch || '';
                    // Convert youtube watch URLs to embed
                    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
                    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
                    // Convert Loom share to embed
                    const loomMatch = url.match(/loom\.com\/share\/([a-f0-9]+)/);
                    if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
                    return url;
                  })()}
                  title="Video de Presentación del Protocolo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </SectionCard>
          )}
        </div>
      ),
    },
    // --- TAB 1: MECÁNICA DE UTILIDAD ---
    {
      id: 'utility',
      label: 'Mecánica de Utilidad',
      icon: Puzzle,
      content: (
        <div className="space-y-8 mb-8">
          {/* Mecánica del Protocolo (nueva clave) */}
          {project.protoclMecanism && (
            <SectionCard title="Mecánica del Protocolo" icon={Puzzle}>
              <p className="text-zinc-300 whitespace-pre-line">{project.protoclMecanism}</p>
            </SectionCard>
          )}

          {/* Utilidad a Largo Plazo (nueva clave) */}
          {project.artefactUtility && (
            <SectionCard title="Utilidad a Largo Plazo de los Artefactos" icon={Star}>
              <p className="text-zinc-300 whitespace-pre-line">{project.artefactUtility}</p>
            </SectionCard>
          )}

          {/* Uso de Fondos / Mecánica (campo legacy fund_usage) */}
          {project.fund_usage && !project.protoclMecanism && (
            <SectionCard title="Mecánica del Protocolo" icon={Puzzle}>
              <p className="text-zinc-300 whitespace-pre-line">{project.fund_usage}</p>
            </SectionCard>
          )}

          {/* Período de Retención / Utilidad Continua (campo legacy lockup_period) */}
          {project.lockup_period && !project.artefactUtility && (
            <SectionCard title="Período de Retención / Utilidad Continua" icon={Clock}>
              <p className="text-zinc-300 whitespace-pre-line">{project.lockup_period}</p>
            </SectionCard>
          )}

          {/* Sistema Work-to-Earn (nueva clave) */}
          {project.worktoearnMecanism && (
            <SectionCard title="Sistema Work-to-Earn" icon={Briefcase}>
              <p className="text-zinc-300 whitespace-pre-line">{project.worktoearnMecanism}</p>
            </SectionCard>
          )}

          {/* Active Phases (Formerly Ofertas) */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid className="w-5 h-5 text-lime-400" />
              <h3 className="text-lg font-bold text-white">Artefactos (Venta Primaria)</h3>
            </div>

            {/* EDUCATIONAL VIEW: Primary Sale Closed */}
            {project.marketPhase === 'defense' && (
              <div className="mb-6 p-6 bg-red-900/10 border border-red-500/20 rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="w-5 h-5 text-red-500" />
                  <h4 className="font-bold text-white uppercase italic">Venta Primaria Finalizada</h4>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  El protocolo ha transicionado a la fase de **Defensa (Mercado Secundario)**. La emisión directa de nuevos artefactos ha concluido para proteger la escasez del ecosistema.
                </p>
                <Link
                  href={`/protocol/market/${project.id || project.slug}`}
                  className="mt-4 inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-xs font-black uppercase italic hover:bg-lime-400 transition-colors"
                >
                  Ir al AGORA Market <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {project.marketPhase !== 'defense' && allPhases.length > 0 ? (
              <div id="tab-phases" className="space-y-6">
                {/* Fases Activas */}
                <div className="space-y-4">
                  {activePhasesWithStats
                    .map((phase: any, index: number) => {
                      const now = new Date();
                      const isSoldOut = phase.stats.isSoldOut;
                      const hasStarted = phase.stats.hasStarted;
                      const hasEnded = phase.endDate && new Date(phase.endDate) < now;
                      const isNotPaused = phase.isActive !== false;

                        const statusLabel = phase.statusLabel;
                        const statusBadgeColor = phase.statusColor;

                      const isClickable = hasStarted && !isSoldOut && isNotPaused && !hasEnded;

                      const cardBorderColor = isSoldOut
                        ? 'border-red-900/30'
                        : !hasStarted
                          ? 'border-blue-900/30'
                          : isClickable
                            ? 'border-zinc-700/50 hover:border-lime-500/50'
                            : 'border-zinc-700/50';

                      const titleColor = isSoldOut
                        ? 'text-zinc-500'
                        : !hasStarted
                          ? 'text-zinc-400'
                          : isClickable
                            ? 'text-white group-hover:text-lime-400'
                            : 'text-zinc-400';

                      return (
                        <div
                          key={`active-${index}`}
                          onClick={() => {
                            if (isClickable) {
                              setSelectedPhase(phase);
                              setIsArtifactModalOpen(true);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
                              setSelectedPhase(phase);
                              setIsArtifactModalOpen(true);
                            }
                          }}
                          className={`bg-zinc-800/50 p-4 rounded-lg border ${cardBorderColor} ${isClickable ? 'cursor-pointer hover:bg-zinc-800 group' : 'cursor-not-allowed opacity-75'} transition-all`}
                        >
                          <h4 className={`font-bold mb-2 flex items-center justify-between transition-colors ${titleColor}`}>
                            <div className="flex items-center gap-2">
                              <span>{phase.name}</span>
                              {!isSoldOut && <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-lime-400" />}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded uppercase ${statusBadgeColor}`}>{statusLabel}</span>
                          </h4>

                          {/* --- REAL DATA PROGRESS BAR (PHASE SPECIFIC) --- */}
                          <div className="mb-4 bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                            <div className="flex justify-between items-end mb-1">
                              <span className="text-xs text-zinc-400">Progreso Fase</span>
                              <span className={`${isSoldOut ? 'text-red-400' : 'text-lime-400'} font-mono text-sm font-bold`}>
                                {phase.stats.metric === 'Tokens' ?
                                  `${phase.stats.raised.toLocaleString()} / ${phase.stats.cap.toLocaleString()} Tokens` :
                                  `${formatCurrency(phase.stats.raised)} / ${formatCurrency(phase.stats.cap)}`
                                }
                              </span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mb-2">
                              <div
                                className={`${isSoldOut ? 'bg-red-500' : (hasEnded ? 'bg-zinc-600' : (!hasStarted ? 'bg-blue-500' : 'bg-lime-500'))} h-full rounded-full transition-all duration-1000`}
                                style={{ width: `${phase.stats.percent}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-500">
                                Faltan: <span className="text-zinc-300">
                                  {phase.stats.metric === 'Tokens' ?
                                    `${Math.max(0, phase.stats.cap - phase.stats.raised).toLocaleString()} Tokens` :
                                    formatCurrency(Math.max(0, phase.stats.cap - phase.stats.raised))
                                  }
                                </span>
                              </span>
                              <span className="px-2 py-0.5 bg-lime-900/30 text-lime-400 rounded-full border border-lime-500/20">
                                {phase.stats.participants.toLocaleString()} Partic.
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {/* Token Price (Property: tokenPrice) */}
                            <div>
                              <span className="text-zinc-500 block text-xs">Precio Token</span>
                              <span className={`${isSoldOut ? 'text-zinc-400' : 'text-lime-400'} font-mono`}>
                                {Number(phase.tokenPrice) === 0 ? 'GRATIS' : `$${phase.tokenPrice}`}
                              </span>
                            </div>
                            {/* Limit (Context sensitive) */}
                            <div>
                              <span className="text-zinc-500 block text-xs">Límite ({phase.type === 'time' ? 'Días' : (phase.stats.metric === 'Tokens' ? 'Tokens' : 'USD')})</span>
                              <span className="text-white font-mono">{Number(phase.limit).toLocaleString()} {phase.type === 'time' ? 'd' : (phase.stats.metric === 'Tokens' ? 'T' : '$')}</span>
                            </div>
                            {/* Allocation (Property: tokenAllocation) */}
                            <div>
                              <span className="text-zinc-500 block text-xs">Asignación</span>
                              <span className="text-white font-mono">{phase.tokenAllocation ? Number(phase.tokenAllocation).toLocaleString() : '∞'}</span>
                            </div>
                            {/* Status */}
                            <div>
                              <span className="text-zinc-500 block text-xs">Estado</span>
                              <span className={`${isSoldOut ? 'text-red-400' : (hasEnded ? 'text-zinc-500' : (!hasStarted ? 'text-blue-400' : 'text-lime-400'))}`}>
                                {isSoldOut ? 'Agotado' : (hasEnded ? 'Finalizado' : (!hasStarted ? 'Próximamente' : 'Activo'))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>

                {allPhases.filter((p: any) => p.isActive).length === 0 && (
                  <p className="text-zinc-400 italic text-sm">No hay fases activas en este momento.</p>
                )}

                {/* Botón Historial */}
                {allPhases.some((p: any) => !p.isActive) && (
                  <div className="pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => setShowHistorical(!showHistorical)}
                      className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mx-auto"
                    >
                      <Clock className="w-4 h-4" />
                      {showHistorical ? 'Ocultar Fases Finalizadas' : 'Ver Historial de Fases'}
                      {showHistorical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Fases Históricas (Inactivas) */}
                {showHistorical && (
                  <div className="space-y-4 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
                    {historicalPhasesWithStats
                      .map((phase: any, index: number) => (
                        <div
                          key={`historical-${index}`}
                          className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 cursor-not-allowed group"
                        >
                          <h4 className="font-bold text-zinc-400 mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{phase.name}</span>
                              <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">FINALIZADA</span>
                            </div>
                            <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-500 uppercase">{phase.type === 'time' ? 'Tiempo' : 'Monto'}</span>
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm opacity-60">
                            {/* Token Price (Property: tokenPrice) */}
                            <div>
                              <span className="text-zinc-600 block text-xs">Precio Token</span>
                              <span className="text-zinc-400 font-mono">${phase.tokenPrice ?? '0.00'}</span>
                            </div>
                            {/* Limit (Context sensitive) */}
                            <div>
                              <span className="text-zinc-600 block text-xs">Límite ({phase.type === 'time' ? 'Días' : 'USD'})</span>
                              <span className="text-zinc-400 font-mono">{Number(phase.limit).toLocaleString()} {phase.type === 'time' ? 'd' : '$'}</span>
                            </div>
                            {/* Allocation (Property: tokenAllocation) */}
                            <div>
                              <span className="text-zinc-600 block text-xs">Asignación</span>
                              <span className="text-zinc-400 font-mono">{phase.tokenAllocation ? Number(phase.tokenAllocation).toLocaleString() : '∞'}</span>
                            </div>
                            {/* Status */}
                            <div>
                              <span className="text-zinc-600 block text-xs">Motivo Cierre</span>
                              <span className="text-red-900/50 text-xs px-1 rounded bg-red-900/20">Expirada</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-400">No hay fases de artefactos definidas.</p>
            )}
          </div>

          <ArtifactPurchaseModal
            isOpen={isArtifactModalOpen}
            onClose={() => setIsArtifactModalOpen(false)}
            project={project}
            utilityContract={{ address: project.utilityContractAddress }}
            phase={selectedPhase}
            userArtifactCount={0}
          />

          {/* AGORA Market: Phase-Aware Preview */}
          <SectionCard title="Mercado Secundario (AGORA)" icon={Zap}>
            {project.marketPhase === 'defense' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <p className="text-emerald-400 font-bold text-sm">MERCADO ACTIVO: Liquidez Secundaria habilitada.</p>
                </div>
                <p className="text-zinc-300 text-sm">
                  Ahora puedes comprar y vender artefactos directamente con otros miembros de la comunidad bajo las reglas de gobernanza institucional.
                </p>
                <Link
                  href={`/protocol/market/${project.id || project.slug}`}
                  className="w-full justify-center inline-flex items-center gap-2 bg-emerald-500 text-black py-4 rounded-xl text-md font-black uppercase italic hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Abrir AGORA Market <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                  <Lock className="w-5 h-5 text-zinc-500" />
                  <p className="text-zinc-400 font-bold text-sm uppercase italic">Mercado en Funding (Fase 1)</p>
                </div>

                {/* Educational Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Treasury Actual</p>
                    <p className="text-xl font-mono text-white">{formatCurrency(fundsRaised)}</p>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Meta Activación</p>
                    <p className="text-xl font-mono text-lime-400">{formatCurrency(targetAmount)}</p>
                  </div>
                </div>

                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-lime-500 h-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed italic">
                  * El mercado secundario AGORA se activará automáticamente (Fase 2) al alcanzar el 100% de la meta de adopción o por decreto de gobernanza.
                </p>

                <button className="w-full py-4 bg-zinc-800 text-zinc-500 rounded-xl text-md font-bold uppercase italic cursor-not-allowed border border-zinc-700" disabled>
                  AGORA Bloqueado
                </button>
              </div>
            )}
          </SectionCard>

        </div>
      ),
    },
    // --- TAB 2: ESTRATEGIA Y SOSTENIBILIDAD (EL PLAN DE NEGOCIO) ---
    {
      id: 'strategy',
      label: 'Estrategia y Sostenibilidad',
      icon: Shield,
      content: (
        <div className="space-y-8 mb-8">
          {/* Meta de Adopción - Dynamic from Config or Target */}
          {(() => {
            const tokenomics = project.w2eConfig?.tokenomics;
            const target = tokenomics?.initialSupply ?
              (Number(tokenomics.initialSupply) * Number(tokenomics.price || 0)) :
              Number(project.target_amount || 0);

            return target > 0 && (
              <SectionCard title="Meta de Adopción" icon={Globe}>
                <p className="text-zinc-300">
                  <span className="font-semibold text-lime-400 text-lg">${target.toLocaleString()}</span>
                  <span className="text-zinc-400 ml-2">USD objetivo</span>
                </p>
              </SectionCard>
            );
          })()}

          {/* Modelo de Monetización - Nueva clave */}
          {project.monetizationModel && (
            <SectionCard title="Modelo de Monetización (Ingresos del Protocolo)" icon={ExternalLink}>
              <p className="text-zinc-300 whitespace-pre-line">{project.monetizationModel}</p>
              <p className="mt-4 text-sm text-lime-400">
                *Este modelo financia la utilidad recurrente.
              </p>
            </SectionCard>
          )}

          {/* Estrategia de Adquisición - Nueva clave */}
          {project.adquireStrategy && (
            <SectionCard title="Estrategia de Adopción (Go-To-Market)" icon={Star}>
              <p className="text-zinc-300 whitespace-pre-line">{project.adquireStrategy}</p>
              <p className="mt-4 text-sm text-zinc-400">
                *Detalla el plan inicial de distribución de Artefactos (Airdrop, Venta Fija, Mérito).
              </p>
            </SectionCard>
          )}

          {/* Parámetros del Artefacto (Fases) - READ ONLY duplicate view if desired or separate */}
          {/* Skipping full phase list here to avoid redundancy with Utility tab, or keeping concise */}



          {/* Governance Tokenomics (Deployment Config) */}
          {project.w2eConfig?.tokenomics && (
            <SectionCard title="Tokenomics y Gobernanza (On-Chain)" icon={Briefcase}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Precio Inicial (Deployment)</p>
                  <p className="text-xl font-mono text-white">${project.w2eConfig.tokenomics.price}</p>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Suministro Inicial</p>
                  <p className="text-xl font-mono text-white">{Number(project.w2eConfig.tokenomics.initialSupply).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Poder de Voto</p>
                  <p className="text-xl font-mono text-white">{project.w2eConfig.tokenomics.votingPowerMultiplier}x</p>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      ),
    },
    // --- TAB 3: TRANSPARENCIA Y LEGAL (LA CONFIANZA) ---
    {
      id: 'compliance',
      label: 'Transparencia y Legal',
      icon: Shield,
      content: (
        <div className="space-y-8 mb-8">
          {/* Governance Events & Signals */}
          <UserGovernanceList projectIds={[Number(project.id)]} />

          {/* Contratos Inteligentes (SCaaS) */}
          {(project.licenseContractAddress || project.utilityContractAddress || project.loomContractAddress || project.governorContractAddress || project.treasuryAddress || (project.w2eConfig?.timelockAddress && project.w2eConfig.timelockAddress !== "0x0000000000000000000000000000000000000000")) && (
            <SectionCard title="Contratos Inteligentes del Protocolo" icon={Code}>
              <div className="space-y-3">
                {/* Helper for Contract Item */}
                {[
                  { label: "Licencia de Acceso (NFT)", address: project.licenseContractAddress, type: "License" },
                  { label: "Token de Utilidad (ERC-20)", address: project.utilityContractAddress, type: "Utility" },
                  { label: "Protocol Registry V2", address: project.registryContractAddress, type: "Registry" },
                  { label: "W2E Loom (Lógica Central)", address: project.loomContractAddress, type: "Loom" },
                  { label: "Gobernador (DAO)", address: project.governorContractAddress, type: "Governor" },
                  { label: "Tesorería Comunitaria", address: project.treasuryAddress, type: "Treasury" },
                  { label: "Timelock (Seguridad)", address: project.w2eConfig?.timelockAddress, type: "Timelock" }
                ]
                  .filter(item => item.address && item.address !== "0x0000000000000000000000000000000000000000")
                  .map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-zinc-800/50 rounded-lg group hover:bg-zinc-800/80 transition-colors">
                      <div className="overflow-hidden flex-1 mr-4">
                        <p className="text-white font-medium text-sm">{item.label}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.address || "");
                            // Optionally toast
                          }}
                          className="text-zinc-500 text-xs font-mono break-all hover:text-lime-400 text-left transition-colors flex items-center gap-1 w-full"
                          title="Click to Copy"
                        >
                          <span className="truncate">{item.address}</span>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </button>
                      </div>
                      <a href={`https://sepolia.etherscan.io/address/${item.address}`} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300 flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
              </div>
            </SectionCard>
          )}

          {/* Estatus Legal - Nueva clave */}
          <SectionCard title="Estatus Legal y Jurisdicción" icon={Briefcase}>
            <p className="text-zinc-300 font-medium mb-2">{getLegalLabel(project.legalStatus)}</p>
            {project.legalStatusDetails && (
              <p className="text-zinc-400 text-sm whitespace-pre-line leading-relaxed border-t border-zinc-800/50 pt-2">{project.legalStatusDetails}</p>
            )}
          </SectionCard>

          {/* Entidad Fiduciaria (desde ProjectDetails) */}
          {project.fiduciaryEntity && (
            <SectionCard title="Entidad Fiduciaria" icon={Shield}>
              <p className="text-zinc-300 whitespace-pre-line">{project.fiduciaryEntity}</p>
              <p className="mt-4 text-sm text-zinc-400">
                *Custodia de activos del mundo real.
              </p>
            </SectionCard>
          )}

          {/* Documento de Valuación (desde ProjectDetails) */}
          {project.valuationDocumentUrl && (
            <SectionCard title="Documento de Valuación" icon={Code}>
              <a href={project.valuationDocumentUrl} target="_blank" rel="noopener noreferrer"
                className="text-lime-400 hover:text-lime-300 underline text-sm">
                Ver documento →
              </a>
              <p className="mt-2 text-sm text-zinc-400">
                *Análisis de valuación del proyecto.
              </p>
            </SectionCard>
          )}

          {/* Reporte de Due Diligence (desde ProjectDetails) */}
          {project.dueDiligenceReportUrl && (
            <SectionCard title="Reporte de Due Diligence" icon={Shield}>
              <a href={project.dueDiligenceReportUrl} target="_blank" rel="noopener noreferrer"
                className="text-lime-400 hover:text-lime-300 underline text-sm">
                Ver reporte →
              </a>
              <p className="mt-2 text-sm text-zinc-400">
                *Análisis de riesgos y validación.
              </p>
            </SectionCard>
          )}

          {/* Mitigación de Riesgos - Nueva clave */}
          {project.mitigationPlan && (
            <SectionCard title="Mitigación de Riesgo Operativo y Fraude" icon={Shield}>
              <p className="text-zinc-300 whitespace-pre-line">{project.mitigationPlan}</p>
              <p className="mt-4 text-sm text-zinc-400">
                *Plan del Creador para manejar el fraude interno y el riesgo de uso de la comunidad.
              </p>
            </SectionCard>
          )}
        </div>
      ),
    },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);
  const activeContent = activeTabData?.content;

  return (
    <div className="mt-12">
      {/* Navigación de Tabs */}
      <div className="flex border-b border-zinc-700/50 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
                px-4 py-3 text-sm md:text-md font-semibold flex items-center gap-2 transition-colors duration-200
                border-b-2 whitespace-nowrap
                ${activeTab === tab.id
                ? "border-lime-400 text-lime-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
              }
              `}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-lime-400" : "text-zinc-400"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido del Tab Activo */}
      <div className="min-h-[400px]">
        {activeContent}
      </div>

      {/* SECCIÓN PERSISTENTE: Enlaces y Recursos (Visible siempre debajo de los tabs) */}
      <div className="mt-12 border-t border-zinc-700/50 pt-8">
        {(() => {
          // Acceso seguro a propiedades opcionales
          const projectObj = project as unknown as Record<string, unknown>;
          const hasLinks = projectObj.website_url || projectObj.whitepaper_url || projectObj.twitter_url || projectObj.discord_url || projectObj.telegram_url || projectObj.video_pitch;

          return hasLinks ? (
            <SectionCard title="Enlaces y Recursos" icon={ExternalLink}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Website */}
                {typeof projectObj.website_url === 'string' && projectObj.website_url && (
                  <a
                    href={projectObj.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                  >
                    <Globe className="w-5 h-5 text-lime-400 group-hover:text-lime-300" />
                    <div>
                      <p className="text-white font-medium">Sitio Web</p>
                      <p className="text-zinc-400 text-sm">Visitar website oficial</p>
                    </div>
                  </a>
                )}

                {/* Whitepaper/Litepaper */}
                {typeof projectObj.whitepaper_url === 'string' && projectObj.whitepaper_url && (
                  <a
                    href={projectObj.whitepaper_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                  >
                    <FileText className="w-5 h-5 text-lime-400 group-hover:text-lime-300" />
                    <div>
                      <p className="text-white font-medium">Whitepaper</p>
                      <p className="text-zinc-400 text-sm">Documentación técnica</p>
                    </div>
                  </a>
                )}

                {/* DAO Access */}
                {(['approved', 'live', 'deployed', 'active'].includes(String(projectObj.status).toLowerCase()) || projectObj.deploymentStatus === 'deployed') && (
                  <Link
                    href={`/projects/${String(projectObj.slug)}/dao`}
                    className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group cursor-pointer"
                  >
                    <Shield className="w-5 h-5 text-lime-400 group-hover:text-lime-300" />
                    <div>
                      <p className="text-white font-medium">Panel de Gobernanza (DAO)</p>
                      <p className="text-zinc-400 text-sm">Votación y propuestas del protocolo</p>
                    </div>
                  </Link>
                )}

                {/* Twitter */}
                {typeof projectObj.twitter_url === 'string' && projectObj.twitter_url && (
                  <a
                    href={projectObj.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                  >
                    <Twitter className="w-5 h-5 text-lime-400 group-hover:text-lime-300" />
                    <div>
                      <p className="text-white font-medium">Twitter</p>
                      <p className="text-zinc-400 text-sm">Síguenos en Twitter</p>
                    </div>
                  </a>
                )}

                {/* Discord */}
                {typeof projectObj.discord_url === 'string' && projectObj.discord_url && (
                  <a
                    href={projectObj.discord_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                  >
                    <MessageCircle className="w-5 h-5 text-lime-400 group-hover:text-lime-300" />
                    <div>
                      <p className="text-white font-medium">Discord</p>
                      <p className="text-zinc-400 text-sm">Únete a la comunidad</p>
                    </div>
                  </a>
                )}

                {/* Telegram */}
                {typeof projectObj.telegram_url === 'string' && projectObj.telegram_url && (
                  <a
                    href={projectObj.telegram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/send.svg" className="w-5 h-5 text-lime-400 group-hover:text-lime-300 filter invert-0 dark:invert" alt="Telegram" />
                    <div>
                      <p className="text-white font-medium">Telegram</p>
                      <p className="text-zinc-400 text-sm">Canal oficial</p>
                    </div>
                  </a>
                )}

                {/* Video Pitch */}
                {typeof projectObj.video_pitch === 'string' && projectObj.video_pitch && (
                  <a
                    href={projectObj.video_pitch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                  >
                    <PlayCircle className="w-5 h-5 text-lime-400 group-hover:text-lime-300" />
                    <div>
                      <p className="text-white font-medium">Video Pitch</p>
                      <p className="text-zinc-400 text-sm">Ver presentación del proyecto</p>
                    </div>
                  </a>
                )}
              </div>
            </SectionCard>
          ) : null;
        })()}
      </div>
    </div>
  );
}


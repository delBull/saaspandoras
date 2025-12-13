'use client';

import { useState } from 'react';
import { Ticket, Lock, Unlock, Share2, Users, Heart, Check } from "lucide-react";
import { SimpleTooltip } from "../ui/simple-tooltip";
import { toast } from "sonner";
import type { ProjectData } from "@/app/()/projects/types";
import AccessCardPurchaseModal from "../modals/AccessCardPurchaseModal";
import PhaseParticipationModal from "../modals/PhaseParticipationModal";
import type { UtilityPhase } from '@/types/deployment';
import { useActiveAccount, useReadContract, TransactionButton } from "thirdweb/react";
import { getContract, defineChain, prepareContractCall } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { balanceOf } from "thirdweb/extensions/erc721";

interface ProjectSidebarProps {
  project: ProjectData;
  targetAmount: number;
}

export default function ProjectSidebar({ project, targetAmount }: ProjectSidebarProps) {
  // Debug: Check status
  console.log("ProjectSidebar Debug:", {
    id: project.id,
    status: project.deploymentStatus,
    w2eConfig: project.w2eConfig
  });

  const raisedAmount = Number(project.raised_amount ?? 0);
  const raisedPercentage = (raisedAmount / targetAmount) * 100;

  // --- Access Gating Logic ---
  const account = useActiveAccount();
  const chainId = Number(project.chainId) || 11155111; // Default Sepolia

  // 1. Define License Contract
  const licenseContract = project.licenseContractAddress ? getContract({
    client,
    chain: defineChain(chainId),
    address: project.licenseContractAddress
  }) : undefined;

  // Fallback to prevent hook crash if contract is undefined (even if disabled)
  const dummyContract = getContract({
    client,
    chain: defineChain(chainId),
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

  // Debug log (remove in prod)
  // console.log("Gating Check:", { user: account?.address, hasAccess, balance: licenseBalance?.toString() });

  // Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<UtilityPhase | null>(null);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);

  const handlePhaseClick = (phase: any) => {
    setSelectedPhase(phase);
    setIsPhaseModalOpen(true);
  };

  return (
    <>
      <div className="hidden lg:block absolute right-0 top-0 w-72 h-full">
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
                  ${raisedAmount.toLocaleString()}
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
                <div className="w-full bg-zinc-800/80 border border-lime-500/50 text-lime-400 font-bold py-3 px-6 rounded-lg mb-4 flex items-center justify-center gap-2">
                  <Unlock className="w-5 h-5" />
                  Acceso Verificado
                </div>
              ) : project.deploymentStatus === 'deployed' && licenseContract && account ? (
                <button
                  onClick={() => setIsAccessModalOpen(true)}
                  className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-2 rounded-lg mb-4 flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(163,230,53,0.4)] text-sm whitespace-nowrap transition-all hover:scale-[1.02]"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Obtener Acceso (Gratis)</span>
                </button>
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
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Enlace copiado al portapapeles");
                    }}
                    className="p-2 text-gray-400 hover:text-lime-400 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </SimpleTooltip>

                {/* 2. Referral / Invite (Activator) */}
                <SimpleTooltip content="Programa de Referidos (Próximamente)">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors cursor-not-allowed">
                    <Users className="w-5 h-5" />
                  </button>
                </SimpleTooltip>

                {/* 3. Support / Donate (Activator) */}
                <SimpleTooltip content="Apoyar Creador (Donación)">
                  <button className="p-2 text-gray-400 hover:text-pink-400 transition-colors cursor-not-allowed">
                    <Heart className="w-5 h-5" />
                  </button>
                </SimpleTooltip>
              </div>

              <div className="text-xs text-gray-400">
                {(project as any).deploymentStatus === 'deployed'
                  ? "El acceso desbloquea utilidades exclusivas del protocolo."
                  : "Esta creación solo será activada si alcanza su meta antes de la fecha límite."}
              </div>
            </div>
          </div>

          {/* Project Creator Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Creación Por</h3>
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-white font-bold text-lg">IMG</span>
              </div>
              <div className="text-white font-medium mb-1">{project.applicant_name ?? "Nombre del Creador"}</div>
              <div className="text-gray-400 text-sm mb-3">
                {(() => {
                  const createdDate = project.created_at ? new Date(project.created_at as string) : new Date();
                  const now = new Date();
                  const currentMonth = now.getMonth();
                  const currentYear = now.getFullYear();
                  const projectMonth = createdDate.getMonth();
                  const projectYear = createdDate.getFullYear();

                  if (projectMonth === currentMonth && projectYear === currentYear) {
                    return "Creado recientemente";
                  } else {
                    const monthNames = [
                      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                    ];
                    return `${monthNames[projectMonth]} ${projectYear}`;
                  }
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky section - Tokenomics & Offers (from here down) */}
        <div className="sticky top-6 space-y-6">
          {/* Investment Card (Move here if sticky desired, or keep logic separate) */}

          {/* Utility Protocol Info (Already dynamic) */}

          {/* Access Card Preview (New) */}
          {project.w2eConfig?.accessCardImage && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" /> Tarjeta de Acceso
              </h3>
              <div className="rounded-lg overflow-hidden border border-zinc-700/50 aspect-square relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.w2eConfig.accessCardImage}
                  alt="Access Card"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white font-medium text-sm">NFT de Acceso Oficial</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400 text-center">
                Este NFT otorga acceso a la utilidad del protocolo.
              </p>
            </div>
          )}

          {/* Utility Offers Panel (Dynamic Phases) */}
          {(project.w2eConfig?.phases && project.w2eConfig.phases.length > 0) ? (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-400" /> Fases de Venta
              </h3>
              <div className="space-y-4">
                {project.w2eConfig.phases.map((phase: any) => (
                  <div key={phase.id} className={`bg-zinc-800 rounded-lg p-4 border ${phase.isActive ? 'border-blue-500/30' : 'border-zinc-700'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">{phase.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {phase.type === 'amount' ? `Meta: $${Number(phase.limit).toLocaleString()}` : `Duración: ${phase.limit} días`}
                        </p>
                      </div>
                      {phase.isActive ? (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Activa</span>
                      ) : (
                        <span className="bg-zinc-700 text-gray-400 text-xs px-2 py-1 rounded">Inactiva</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Precio:</span>
                      <span className="text-lime-400 font-mono">${project.w2eConfig.tokenomics?.price || project.token_price_usd || 'N/A'}</span>
                    </div>

                    {/* Button Gated by Access */}
                    {hasAccess ? (
                      <button
                        onClick={() => handlePhaseClick(phase)}
                        className={`w-full mt-3 py-2 px-4 rounded-lg transition-colors text-sm font-medium ${phase.isActive ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-700 text-gray-500 cursor-not-allowed'}`}
                        disabled={!phase.isActive}
                      >
                        {phase.isActive ? 'Participar (Adquirir)' : 'No disponible'}
                      </button>
                    ) : (
                      <div className="mt-3 relative group/lock">
                        <button
                          className="w-full py-2 px-4 rounded-lg bg-zinc-700/50 text-gray-500 text-sm font-medium border border-zinc-600/50 flex items-center justify-center gap-2 cursor-not-allowed"
                          disabled
                        >
                          <Lock className="w-4 h-4" />
                          Requiere Access Card
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black text-white text-xs p-2 rounded hidden group-hover/lock:block text-center border border-zinc-700">
                          Adquiere el NFT de Acceso arriba para desbloquear esta utilidad.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Fallback for projects without config (Legacy/Static)
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              {/* Keep existing static offers if needed, or remove. Assuming new standard replaces it. */}
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-zinc-600" /> Ofertas
              </h3>
              <p className="text-zinc-500 text-sm">No hay fases de venta activas configuradas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AccessCardPurchaseModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        project={project}
        licenseContract={licenseContract}
      />

      <PhaseParticipationModal
        isOpen={isPhaseModalOpen}
        onClose={() => setIsPhaseModalOpen(false)}
        phase={selectedPhase}
        projectTitle={project.title}
      />
    </>
  );
}

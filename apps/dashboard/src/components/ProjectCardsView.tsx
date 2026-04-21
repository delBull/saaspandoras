'use client';

import React from 'react';
import { useFeaturedProjects } from '@/hooks/useFeaturedProjects';
import type { Project } from '@/types/admin';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Zap } from "lucide-react";

interface ProjectCardsViewProps {
  projects: Project[];
  expandedProject: string | null;
  setExpandedProject: (id: string | null) => void;
  setStatusDropdown: (id: string | null) => void;
  statusDropdown: string | null;
}

export function ProjectCardsView({
  projects,
  expandedProject,
  setExpandedProject,
  setStatusDropdown,
  statusDropdown
}: ProjectCardsViewProps) {
  const { isFeatured, toggleFeatured } = useFeaturedProjects();

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.length === 0 ? (
        <div className="col-span-full bg-zinc-800/50 rounded-lg p-12 text-center border border-zinc-700">
          <div className="text-gray-400 text-lg font-medium mb-2">No hay proyectos registrados</div>
        </div>
      ) : (
        projects.map((p) => (
          <div key={p.id} className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 hover:border-zinc-600 transition-colors">
            {/* Header con título y estado */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1 truncate">{p.title}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatusDropdown(statusDropdown === p.id ? null : p.id)}
                    className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                      p.status === "pending" ? "bg-yellow-600 hover:bg-yellow-700" :
                      p.status === "approved" ? "bg-blue-600 hover:bg-blue-700" :
                      p.status === "live" ? "bg-green-600 hover:bg-green-700" :
                      p.status === "completed" ? "bg-emerald-600 hover:bg-emerald-700" :
                      "bg-red-600 hover:bg-red-700"
                    } text-white`}
                  >
                    {p.status}
                  </button>
                  {isFeatured(Number(p.id)) && (
                    <span className="text-xs bg-lime-500 text-black px-2 py-1 rounded flex items-center gap-1">
                      ⭐ Featured
                    </span>
                  )}
                  {/* Badge for Provisional Treasury (Custody Mode) */}
                  {p.w2eConfig?.isProvisionalTreasury && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap cursor-help animate-pulse-subtle">
                          🛡️ Custodia
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-zinc-900 border-amber-500/30 text-zinc-200 w-64 shadow-xl">
                        <p className="font-bold flex items-center gap-1 text-amber-500 mb-1">
                          🛡️ Modo Provisional Activo
                        </p>
                        <p className="text-[11px] leading-relaxed">
                          Los fondos están resguardados en la <b>Super Admin Wallet</b>.
                        </p>
                        {p.w2eConfig?.claimableByEmail && (
                          <div className="mt-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px]">
                            <span className="font-mono text-amber-400 truncate block">{p.w2eConfig.claimableByEmail}</span>
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Growth OS Visual Identifier (Zap) with Tooltip */}
                  {p.deploymentStatus === 'deployed' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse-subtle shadow-[0_0_8px_rgba(168,85,247,0.2)] cursor-help">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                          </svg>
                          <span>GROWTH OS</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-zinc-900 border-purple-500/30 text-zinc-200">
                        <p className="font-bold flex items-center gap-1 text-purple-400 mb-1">
                          <Zap className="w-3 h-3" /> Integración Activa
                        </p>
                        <p className="text-[11px] leading-relaxed">
                          Este protocolo utiliza las herramientas de Growth OS para captar leads y gestionar whitelists.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>

            {/* Detalles principales */}
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-400">Monto objetivo: </span>
                <span className="text-white">${Number(p.targetAmount ?? 0).toLocaleString()}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Categoría: </span>
                <span className="text-white">{p.businessCategory ?? 'Sin especificar'}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Creador: </span>
                <span className="text-lime-400 font-mono text-xs">
                  {p.applicantWalletAddress
                    ? `${p.applicantWalletAddress.substring(0, 6)}...${p.applicantWalletAddress.substring(38)}`
                    : 'Desconocido'
                  }
                </span>
              </div>
            </div>

            {/* Action buttons - simplified */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => {
                  try {
                    const projectId = Number(p.id);
                    console.log('🔧 Cards: Toggling featured for project:', projectId);
                    void toggleFeatured(projectId);
                  } catch (error) {
                    console.error('🔧 Cards: Error featured toggle:', error);
                  }
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  isFeatured(Number(p.id))
                    ? 'bg-lime-500 text-black'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                }`}
              >
                {isFeatured(Number(p.id)) ? '⭐ Featured' : '☆ Feature'}
              </button>

              <span className="text-xs text-gray-500 self-center ml-2">
                Más acciones disponibles en vista tabla
              </span>
            </div>

            {/* Detalles expandidos */}
            <button
              onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors text-center"
            >
              {expandedProject === p.id ? 'Ocultar Detalles' : 'Ver Detalles'}
            </button>

            {expandedProject === p.id && (
              <div className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
                <h4 className="font-semibold text-lime-400 text-sm flex items-center gap-2">
                  📋 Información Detallada
                </h4>
                <div className="space-y-2 text-sm">
                  {p.applicantName && (
                    <div><span className="text-gray-400">Representante: </span><span className="text-white">{p.applicantName}</span></div>
                  )}
                  {p.applicantEmail && (
                    <div>
                      <span className="text-gray-400">Email: </span>
                      <a href={`mailto:${p.applicantEmail}`} className="text-lime-400 hover:underline">
                        {p.applicantEmail}
                      </a>
                    </div>
                  )}
                  {p.businessCategory && (
                    <div><span className="text-gray-400">Categoría: </span><span className="text-white">{p.businessCategory}</span></div>
                  )}
                  {p.website && (
                    <div>
                      <span className="text-gray-400">Sitio: </span>
                      <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        {p.website}
                      </a>
                    </div>
                  )}
                  {p.whitepaperUrl && (
                    <div>
                      <span className="text-gray-400">Whitepaper: </span>
                      <a href={p.whitepaperUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                        Ver documento
                      </a>
                    </div>
                  )}
                  {p.legalStatus && (
                    <div><span className="text-gray-400">Estatus legal: </span><span className="text-white">{p.legalStatus}</span></div>
                  )}
                  {(p.applicantName ?? false) || (p.applicantEmail ?? false) || (p.businessCategory ?? false) || (p.website ?? false) || (p.whitepaperUrl ?? false) || (p.legalStatus ?? false) || undefined}
                </div>
              </div>
            )}
            </div>
          ))
        )}
      </div>
    </TooltipProvider>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { Project } from '@/types/admin';
import type { DeploymentConfig } from '@/types/deployment';

import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Zap } from "lucide-react";

interface ProjectTableViewProps {
  projects: Project[];
  onOpenDetail?: (project: Project) => void;
  actionsDropdown: string | null;
  setActionsDropdown: (id: string | null) => void;
  setActionsDropdownPosition: (position: { top: number, left: number } | null) => void;
  isFeatured: (id: number) => boolean;
  toggleFeatured: (id: number) => Promise<void>;
  setStatusDropdown: (id: string | null) => void;
  statusDropdown: string | null;
  onDeployProtocol?: (id: string, title: string, slug?: string, config?: DeploymentConfig) => Promise<void>;
  onCloneProject?: (id: string, title: string, slug?: string) => Promise<void>;
  actionsLoading?: Record<string, boolean>;
}

export function ProjectTableView({
  projects,
  onOpenDetail,
  actionsDropdown,
  setActionsDropdown,
  setActionsDropdownPosition,
  isFeatured,
  toggleFeatured,
  setStatusDropdown,
  statusDropdown,
  onDeployProtocol,
  onCloneProject,
  actionsLoading
}: ProjectTableViewProps) {
  const handleDeployClick = (id: string, title: string, slug: string, forceRedeploy?: boolean) => {
    if (onDeployProtocol) {
      onDeployProtocol(id, title, slug, { forceRedeploy } as any);
    }
  };


  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-700 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
        <table className="w-full divide-y divide-zinc-700 text-sm">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-300 whitespace-nowrap min-w-[200px]">Título</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300 whitespace-nowrap">Monto (USD)</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300 whitespace-nowrap">Estado</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-300 whitespace-nowrap">Flujo</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-300 whitespace-nowrap">Featured</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-300 whitespace-nowrap">Detalles</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-300 whitespace-nowrap">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700 bg-zinc-900">
            {projects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No hay rotocolos registrados.
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <React.Fragment key={p.id}>
                <tr className="hover:bg-zinc-800">
                  <td className="px-4 py-3 text-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="font-medium whitespace-nowrap">{p.title}</span>
                      {/* Badge for NFT Access Passes */}
                      {p.businessCategory === 'infrastructure' && p.licenseContractAddress && !p.utilityContractAddress && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                          🎫 Access Pass
                        </span>
                      )}
                      {/* Badge for Full Protocols */}
                      {p.utilityContractAddress && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                          🔮 Full Protocol
                        </span>
                      )}
                      {/* Badge for Provisional Treasury (Custody Mode) */}
                      {p.w2eConfig?.isProvisionalTreasury && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap cursor-help animate-pulse-subtle">
                              🛡️ Tesorería en Custodia
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-zinc-900 border-amber-500/30 text-zinc-200 w-64">
                            <p className="font-bold flex items-center gap-1 text-amber-500 mb-1">
                              🛡️ Modo Provisional Activo
                            </p>
                            <p className="text-[11px] leading-relaxed">
                              Este proyecto fue desplegado sin una wallet de fundador configurada. Los fondos están resguardados en la <b>Super Admin Wallet</b>.
                            </p>
                            {p.w2eConfig?.claimableByEmail && (
                              <div className="mt-2 p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px]">
                                <span className="opacity-70 text-gray-400">Reclamable por administrador de:</span><br/>
                                <span className="font-mono text-amber-400">{p.w2eConfig.claimableByEmail}</span>
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {/* Growth OS Visual Identifier (Zap) with Tooltip */}
                      {p.deploymentStatus === 'deployed' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse-subtle shadow-[0_0_8px_rgba(168,85,247,0.2)] cursor-help">
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
                              Este protocolo utiliza las herramientas de Growth OS (API/Widget) para captar leads y gestionar whitelists.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-200 whitespace-nowrap">
                    ${Number(p.targetAmount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="relative">
                      <button
                        onClick={() => setStatusDropdown(statusDropdown === p.id ? null : p.id)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${p.status === "pending" ? "bg-yellow-600 hover:bg-yellow-700" :
                          p.status === "approved" ? "bg-blue-600 hover:bg-blue-700" :
                            p.status === "live" ? "bg-green-600 hover:bg-green-700" :
                              p.status === "completed" ? "bg-emerald-600 hover:bg-emerald-700" :
                                "bg-red-600 hover:bg-red-700"
                          } text-white flex items-center gap-1`}
                      >
                        <span>{p.status}</span>
                        <svg className="w-3 h-3 transition-transform" style={{ transform: statusDropdown === p.id ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      // Lógica mejorada para distinguir WhatsApp vs Web
                      const phone = p.applicantPhone?.trim();
                      const hasEmail = !!p.applicantEmail;
                      const createdAt = new Date(p.createdAt);
                      // Nueva Lógica Simplificada
                      let source = "unknown";

                      if (hasEmail) {
                        // El form web siempre pide Email. Bot de whatsapp no.
                        source = "web";
                      } else if (phone) {
                        // Teléfono sin email -> Bot de WhatsApp.
                        source = "whatsapp";
                      } else {
                        // Fallback
                        source = "web";
                      }

                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${source === "whatsapp"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : source === "web"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}>
                          {source === "whatsapp" ? "📱 WhatsApp" : source === "web" ? "🌐 Web" : "❓ Desconocido"}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Featured Column */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {(p.featured || isFeatured(Number(p.id))) && (
                        <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            const projectId = Number(p.id);
                            console.log('🔧 Admin: Toggling featured status for project:', projectId);
                            await toggleFeatured(projectId);
                            console.log('🔧 Admin: Featured status updated globally for project:', projectId);
                          } catch (error) {
                            console.error('🔧 Admin: Error updating featured status:', error);
                          }
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${(p.featured || isFeatured(Number(p.id)))
                          ? 'bg-lime-500 hover:bg-lime-600 text-black shadow-lg ring-2 ring-lime-400/30'
                          : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300 hover:text-white border border-zinc-600 hover:border-zinc-500'
                          }`}
                      >
                        {(p.featured || isFeatured(Number(p.id))) ? '✓ Featured' : '☆ Feature'}
                      </button>
                    </div>
                  </td>

                  {/* Detalles Column */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onOpenDetail && onOpenDetail(p)}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      title="Ver Detalles"
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  </td>

                  {/* Acciones Column */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onDeployProtocol && onDeployProtocol(p.id, p.title, p.slug || '')}
                        disabled={actionsLoading?.[`deploy-${p.id}`]}
                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Desplegar Protocolo"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onCloneProject && onCloneProject(p.id, p.title, p.slug || '')}
                        disabled={actionsLoading?.[`clone-${p.id}`]}
                        className="p-1.5 bg-zinc-700 hover:bg-zinc-600 text-gray-300 border border-zinc-600 rounded-lg transition-colors disabled:opacity-50"
                        title="Clonar Proyecto"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

    </>
  );
}

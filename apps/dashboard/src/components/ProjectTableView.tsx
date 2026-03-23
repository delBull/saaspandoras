'use client';

import React from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { Project } from '@/types/admin';
import { DeploymentConfigModal } from './admin/DeploymentConfigModal';
import DeploymentProgressModal from './admin/DeploymentProgressModal';
import type { DeploymentConfig } from '@/types/deployment';
import { AdminPayouts } from './dao/AdminPayouts';

import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Zap } from "lucide-react";

interface ProjectTableViewProps {
  projects: Project[];
  expandedProject: string | null;
  setExpandedProject: (id: string | null) => void;
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
  expandedProject,
  setExpandedProject,
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
                            // We don't call refreshData here because toggleFeatured already updates local hook state
                            // and the pulse uses both p.featured and isFeatured.
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

                  <td className="px-4 py-3 text-center min-w-[160px]">
                    <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-2">
                      <button
                        onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
                        className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-zinc-200 rounded text-xs font-medium transition-colors block w-full border border-zinc-600 hover:border-zinc-500 whitespace-nowrap"
                      >
                        {expandedProject === p.id ? 'Ocultar' : 'Ver'}
                      </button>
                      <Link
                        href={`/admin/projects/${p.id}/report`}
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-zinc-200 rounded text-[10px] sm:text-xs font-medium transition-colors flex items-center justify-center w-full border border-zinc-600 hover:border-zinc-500"
                      >
                        <span className="truncate">One Pager</span>
                      </Link>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          if (actionsDropdown === p.id) {
                            setActionsDropdown(null);
                            setActionsDropdownPosition(null);
                          } else {
                            setActionsDropdown(p.id);
                            setActionsDropdownPosition({
                              top: rect.bottom + window.scrollY,
                              left: rect.left + window.scrollX - 60
                            });
                          }
                        }}
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-gray-300 hover:text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>Acciones</span>
                        <svg
                          className="w-3 h-3 transition-transform"
                          style={{ transform: actionsDropdown === p.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Fila expandida con detalles de due diligence */}
                {expandedProject === p.id && (
                  <tr className="bg-zinc-800/50">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lime-400 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Información de Due Diligence
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Documentos */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Documentos Legales</h5>
                            <div className="space-y-1">
                              {p.valuationDocumentUrl ? (
                                <a
                                  href={p.valuationDocumentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-lime-300 hover:text-lime-200"
                                >
                                  📄 Valuación Profesional
                                </a>
                              ) : (
                                <span className="block px-2 py-1 bg-zinc-800 text-gray-500 rounded text-xs">Valuación: Sin completar</span>
                              )}

                              {p.dueDiligenceReportUrl ? (
                                <a
                                  href={p.dueDiligenceReportUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-cyan-300 hover:text-cyan-200"
                                >
                                  📋 Reporte Due Diligence
                                </a>
                              ) : (
                                <span className="block px-2 py-1 bg-zinc-800 text-gray-500 rounded text-xs">Due Diligence: Sin completar</span>
                              )}
                            </div>
                          </div>

                          {/* Información de contacto */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Representante</h5>
                            <div className="space-y-1">
                              <div className="text-xs">
                                <span className="text-gray-400">Nombre: </span>
                                <span className="text-white">{p.applicantName ?? "Sin completar"}</span>
                              </div>
                              <div className="text-xs">
                                <span className="text-gray-400">Email: </span>
                                {p.applicantEmail ? (
                                  <a href={`mailto:${p.applicantEmail}`} className="text-lime-400 hover:underline">
                                    {p.applicantEmail}
                                  </a>
                                ) : (
                                  <span className="text-gray-500">Sin completar</span>
                                )}
                              </div>
                              <div className="text-xs">
                                <span className="text-gray-400">Teléfono: </span>
                                <span className="text-white">{p.applicantPhone ?? "Sin completar"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Enlaces y redes sociales */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enlaces Públicos</h5>
                            <div className="space-y-1">
                              {p.website && (
                                <a
                                  href={p.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-emerald-300 hover:text-emerald-200"
                                >
                                  🌐 Sitio Web
                                </a>
                              )}
                              {p.whitepaperUrl && (
                                <a
                                  href={p.whitepaperUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-lime-300 hover:text-lime-200"
                                >
                                  📄 White Paper
                                </a>
                              )}
                              {p.twitterUrl && (
                                <a
                                  href={p.twitterUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-blue-300 hover:text-blue-200"
                                >
                                  𝕏 Twitter
                                </a>
                              )}
                              {p.discordUrl && (
                                <a
                                  href={p.discordUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-indigo-300 hover:text-indigo-200"
                                >
                                  💬 Discord
                                </a>
                              )}
                              {p.telegramUrl && (
                                <a
                                  href={p.telegramUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-blue-400 hover:text-blue-300"
                                >
                                  ✈️ Telegram
                                </a>
                              )}
                              {p.linkedinUrl && (
                                <a
                                  href={p.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-blue-600 hover:text-blue-500"
                                >
                                  💼 LinkedIn
                                </a>
                              )}
                              {!p.website && !p.whitepaperUrl && !p.twitterUrl && !p.discordUrl && !p.telegramUrl && !p.linkedinUrl && (
                                <span className="block px-2 py-1 bg-zinc-800 text-gray-500 rounded text-xs">
                                  Sin enlaces registrados
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Información del Protocolo (SCaaS) */}
                        {(p.deploymentStatus || p.licenseContractAddress) && (
                          <div className="border-t border-zinc-700 pt-4 mt-4">
                            <h4 className="font-semibold text-indigo-400 text-sm flex items-center gap-2 mb-3">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                              Información del Protocolo (SCaaS)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                              <div className="col-span-1 md:col-span-2 lg:col-span-4 mb-2">
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-400">Status:</span>
                                    <span className={`px-2 py-0.5 rounded font-bold ${p.deploymentStatus === 'deployed' ? 'bg-indigo-900 text-indigo-300 border border-indigo-700' :
                                      p.deploymentStatus === 'pending' ? 'bg-amber-900 text-amber-300 border border-amber-700' :
                                        'bg-zinc-700 text-gray-400'
                                      }`}>
                                      {p.deploymentStatus || 'N/A'}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-2 items-center">
                                    {p.deploymentStatus !== 'deployed' && (p.status === 'approved' || p.status === 'live') && (
                                      <button
                                        onClick={() => handleDeployClick(p.id, p.title, p.slug!)}
                                        disabled={actionsLoading?.[p.id]}
                                        className="px-3 py-1.5 bg-lime-500 hover:bg-lime-600 disabled:bg-zinc-600 disabled:cursor-not-allowed text-black text-xs font-bold rounded shadow-lg transition-all flex items-center gap-1.5"
                                        title="Desplegar contratos en Blockchain"
                                      >
                                        {actionsLoading?.[p.id] ? (
                                          <>
                                            <svg className="animate-spin h-3 w-3 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Deploying...
                                          </>
                                        ) : (
                                          <>
                                            🚀 Deploy
                                          </>
                                        )}
                                      </button>
                                    )}


                                    {p.deploymentStatus === 'deployed' && onCloneProject && (
                                      <button
                                        onClick={() => onCloneProject(p.id, p.title, p.slug!)}
                                        disabled={actionsLoading?.[`clone-${p.id}`]}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-gray-300 text-xs font-bold rounded shadow-lg transition-all flex items-center gap-1.5"
                                        title="Clonar este proyecto (Crea una copia sin contratos)"
                                      >
                                        {actionsLoading?.[`clone-${p.id}`] ? (
                                          <>
                                            <svg className="animate-spin h-3 w-3 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Clonando...
                                          </>
                                        ) : (
                                          <>
                                            📂 Clonar
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {p.deploymentStatus === 'deployed' && (
                                      <button
                                        onClick={() => {
                                          alert("🏛️ Transición Soberana a AGORA Market\n\nLa activación de la Fase de Defensa debe realizarse a través de una propuesta en la DAO del protocolo (W2EGovernor) o mediante interacción directa con los Smart Contracts si eres el propietario.\n\nEl sistema backend detectará automáticamente el cambio cuando las transferencias queden habilitadas on-chain.");
                                        }}
                                        className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-xs font-bold rounded shadow-lg transition-all flex items-center gap-1.5"
                                        title="Instrucciones para transición soberana a Fase de Defensa"
                                      >
                                        🏛️ Lanza AGORA Market
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Chain ID:</span>
                                <span className="text-white">{p.chainId || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">License Contract:</span>
                                <span className="text-white break-all" title={p.licenseContractAddress || ''}>
                                  {p.licenseContractAddress ? `${p.licenseContractAddress.substring(0, 8)}...${p.licenseContractAddress.substring(36)}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Utility Contract:</span>
                                <span className="text-white break-all" title={p.utilityContractAddress || ''}>
                                  {p.utilityContractAddress ? `${p.utilityContractAddress.substring(0, 8)}...${p.utilityContractAddress.substring(36)}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Loom Contract:</span>
                                <span className="text-white break-all" title={p.loomContractAddress || ''}>
                                  {p.loomContractAddress ? `${p.loomContractAddress.substring(0, 8)}...${p.loomContractAddress.substring(36)}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Governor Contract:</span>
                                <span className="text-white break-all" title={p.governorContractAddress || ''}>
                                  {p.governorContractAddress ? `${p.governorContractAddress.substring(0, 8)}...${p.governorContractAddress.substring(36)}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Treasury Contract:</span>
                                <span className="text-white break-all" title={p.treasuryAddress || ''}>
                                  {p.treasuryAddress ? `${p.treasuryAddress.substring(0, 8)}...${p.treasuryAddress.substring(36)}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Registry Contract:</span>
                                <span className="text-white break-all" title={(p as any).registryContractAddress || ''}>
                                  {(p as any).registryContractAddress
                                    ? `${(p as any).registryContractAddress.substring(0, 8)}...${(p as any).registryContractAddress.substring(36)}`
                                    : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400 block mb-1">Protocol Version:</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(p as any).protocolVersion === 2
                                  ? 'bg-indigo-900 text-indigo-300 border border-indigo-700'
                                  : 'bg-zinc-700 text-gray-400'
                                  }`}>
                                  V{(p as any).protocolVersion || 1}
                                </span>
                              </div>
                            </div>
                            {/* V2 Artifacts List */}
                            {(p as any).artifacts && (p as any).artifacts.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-zinc-700/50">
                                <span className="text-gray-400 block mb-2 text-[10px] uppercase tracking-wider">Artefactos del Ecosistema</span>
                                <div className="flex flex-wrap gap-2">
                                  {((p as any).artifacts as Array<{ type: string; address: string; name?: string }>).map((art, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-900/30 border border-indigo-700/50 rounded-lg text-[10px] text-indigo-300" title={art.address}>
                                      <span>{art.type === 'Access' ? '🔑' : art.type === 'Identity' ? '🪪' : art.type === 'Membership' ? '🏷️' : art.type === 'Coupon' ? '🎟️' : art.type === 'Reputation' ? '🏆' : '💰'}</span>
                                      <span>{art.name || art.type}</span>
                                      <span className="text-indigo-500">{art.address ? `${art.address.substring(0, 6)}…` : ''}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Protocol Safety Layer (Super Admin Override) */}
                            {p.deploymentStatus === 'deployed' && (
                              <div className="border-t border-red-900/30 pt-4 mt-4 bg-red-950/10 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-semibold text-red-400 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Protocol Safety Layer (Super Admin Override)
                                  </h4>
                                  <button
                                    className="text-xs bg-red-900/30 hover:bg-red-800 text-red-300 px-2 py-1 rounded border border-red-800 transition-colors"
                                    onClick={() => fetch(`/api/admin/check-delays?force=true&projectId=${p.id}`).then(() => alert("Alert System Triggered"))}
                                  >
                                    🛠️ Test Alert System
                                  </button>
                                </div>
                                <div className="text-xs text-red-200/70 mb-4">
                                  <p>⚠️ <strong>Emergency Power:</strong> Use this panel to force-distribute funds if the Protocol Owner is unresponsive.</p>
                                  <p>Actions taken here use <strong>YOUR</strong> connected wallet (Super Admin). Ensure you have necessary authorization.</p>
                                </div>

                                <div className="bg-zinc-900 p-2 rounded border border-red-900/30">
                                  {/* Using the same component as the Owner Dashboard, but context is Super Admin */}
                                  <AdminPayouts
                                    projectId={Number(p.id)}
                                    project={p}
                                    safeChainId={p.chainId || 1} // Default to Mainnet if missing, though unlikely for deployed
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Información adicional */}
                        <div className="border-t border-zinc-700 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Categoría de negocio: </span>
                              <span className="text-white">
                                {p.businessCategory === 'infrastructure' ? '🏗️ ' : ''}
                                {p.businessCategory ?? "Sin especificar"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Estatus legal: </span>
                              <span className="text-white">{p.legalStatus ?? "Sin completar"}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Entidad fiduciaria: </span>
                              <span className="text-white">{p.fiduciaryEntity ?? "Sin completar"}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Propiedad: </span>
                              <span className="text-white font-mono text-xs">
                                {p.applicantWalletAddress ? `${p.applicantWalletAddress.substring(0, 6)}...${p.applicantWalletAddress.substring(38)}` : "Sin asignar"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

    </>
  );
}

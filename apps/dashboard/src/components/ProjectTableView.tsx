'use client';

import React from 'react';
import type { Project } from '@/types/admin';

interface ProjectTableViewProps {
  projects: Project[];
  expandedProject: string | null;
  setExpandedProject: (id: string | null) => void;
  actionsDropdown: string | null;
  setActionsDropdown: (id: string | null) => void;
  setActionsDropdownPosition: (position: {top: number, left: number} | null) => void;
  isFeatured: (id: number) => boolean;
  toggleFeatured: (id: number) => Promise<void>;
  setStatusDropdown: (id: string | null) => void;
  statusDropdown: string | null;
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
  statusDropdown
}: ProjectTableViewProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-700 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
      <table className="w-full divide-y divide-zinc-700 text-sm">
        <thead className="bg-zinc-800">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-300">Título</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-300">Monto (USD)</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-300">Estado</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-300">Featured</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-300">Detalles</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-300">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-700 bg-zinc-900">
          {projects.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                No hay creaciones registrados.
              </td>
            </tr>
          )}
          {projects.map((p) => (
            <React.Fragment key={p.id}>
              <tr className="hover:bg-zinc-800">
                <td className="px-4 py-3 text-gray-200">{p.title}</td>
                <td className="px-4 py-3 text-gray-200">
                  ${Number(p.targetAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <button
                      onClick={() => setStatusDropdown(statusDropdown === p.id ? null : p.id)}
                      className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                        p.status === "pending" ? "bg-yellow-600 hover:bg-yellow-700" :
                        p.status === "approved" ? "bg-blue-600 hover:bg-blue-700" :
                        p.status === "live" ? "bg-green-600 hover:bg-green-700" :
                        p.status === "completed" ? "bg-emerald-600 hover:bg-emerald-700" :
                        "bg-red-600 hover:bg-red-700"
                      } text-white flex items-center gap-1`}
                    >
                      <span>{p.status}</span>
                      <svg className="w-3 h-3 transition-transform" style={{transform: statusDropdown === p.id ? 'rotate(180deg)' : 'rotate(0deg)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </td>

                {/* Featured Column */}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {isFeatured(Number(p.id)) && (
                      <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                    )}
                    <button
                      onClick={() => {
                        try {
                          const projectId = Number(p.id);
                          console.log('🔧 Admin: Toggling featured status for project:', projectId);
                          void toggleFeatured(projectId);
                          console.log('🔧 Admin: Featured status updated globally for project:', projectId);
                        } catch (error) {
                          console.error('🔧 Admin: Error updating featured status:', error);
                        }
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                        isFeatured(Number(p.id))
                          ? 'bg-lime-500 hover:bg-lime-600 text-black shadow-lg ring-2 ring-lime-400/30'
                          : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300 hover:text-white border border-zinc-600 hover:border-zinc-500'
                      }`}
                    >
                      {isFeatured(Number(p.id)) ? '✓ Featured' : '☆ Feature'}
                    </button>
                  </div>
                </td>

                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                  >
                    {expandedProject === p.id ? 'Ocultar' : 'Ver'}
                  </button>
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
                        style={{transform: actionsDropdown === p.id ? 'rotate(180deg)' : 'rotate(0deg)'}}
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

                      {/* Información adicional */}
                      <div className="border-t border-zinc-700 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Categoría de negocio: </span>
                            <span className="text-white">{p.businessCategory ?? "Sin especificar"}</span>
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
  );
}

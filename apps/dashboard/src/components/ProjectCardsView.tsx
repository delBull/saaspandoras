'use client';

import React from 'react';
import { useFeaturedProjects } from '@/hooks/useFeaturedProjects';
import type { Project } from '@/types/admin';

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
  );
}

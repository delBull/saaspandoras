import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProjectGrid } from "./ProjectGrid";
import type { Project } from "../../../hooks/applicants/useApplicantsData";
import { useState } from "react";
import Image from "next/image";

interface PanelProjectsProps {
  pendingProjects: Project[];
  approvedOnlyProjects: Project[]; // Only approved status projects
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function PanelProjects({ pendingProjects, approvedOnlyProjects, isCollapsed, onToggleCollapse }: PanelProjectsProps) {
  const [activeCategory, setActiveCategory] = useState<'pending' | 'approved'>('pending');
  return (
    <div
      className={`fixed right-0 top-0 h-screen bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 transition-all duration-500 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-1/5 min-w-[300px] max-w-[320px]'
      } z-30 overflow-hidden flex flex-col`}
    >
      {/* Panel Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800/50 p-4 flex-shrink-0">
        <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
          {!isCollapsed && (
            <h3 className="text-lg font-bold text-white">Categorías</h3>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
            title={isCollapsed ? "Expandir panel" : "Colapsar panel"}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
            ) : (
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
            )}
          </button>
        </div>
        {!isCollapsed && (
          <div className="mt-3 flex gap-2">
            {/* Categoría En Revisión */}
            <button
              onClick={() => setActiveCategory('pending')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/50'
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
              }`}
            >
              <span>En Revisión</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20">
                {pendingProjects.length}
              </span>
            </button>

            {/* Categoría Aprobados */}
            <button
              onClick={() => setActiveCategory('approved')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === 'approved'
                  ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/50'
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
              }`}
            >
              <span>Aprobados</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20">
                {approvedOnlyProjects.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Panel Content */}
      <div className={`h-full px-3 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent ${
        isCollapsed ? 'hidden' : ''
      }`}>
        {/* Para approved, mostrar en lista simple como pending, para pending mantener grid */}
        {activeCategory === 'pending' ? (
          <ProjectGrid
            projects={pendingProjects}
            variant="pending"
            viewMode="grid"
          />
        ) : (
          <div className="space-y-3 max-w-full">
            {approvedOnlyProjects.map((project) => (
              <div key={project.id} className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 hover:border-green-500/50 transition-all duration-300 group">
                {/* Cover Image */}
                <div className="relative w-full" style={{ paddingBottom: '56%' }}>
                  {project.coverPhotoUrl ? (
                    <Image
                      src={project.coverPhotoUrl}
                      alt={`${project.title} cover`}
                      fill
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                      <div className="w-8 h-8 text-zinc-500">📷</div>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-medium bg-green-500/90 text-black rounded-full">
                      Aprobado
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full">
                      Aprobado
                    </span>
                    <a
                      href={`/projects/${project.slug}`}
                      className={`text-xs text-emerald-400 flex items-center gap-1 hover:opacity-80 transition-opacity`}
                    >
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

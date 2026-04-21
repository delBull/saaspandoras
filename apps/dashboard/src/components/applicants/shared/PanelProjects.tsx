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
      className={`fixed right-0 top-0 h-screen bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 transition-all duration-500 ease-in-out ${isCollapsed ? 'w-20' : 'w-1/5 min-w-[300px] max-w-[320px]'
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${activeCategory === 'pending'
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${activeCategory === 'approved'
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
      <div className={`h-full px-3 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent ${isCollapsed ? 'hidden' : ''
        }`}>
        {/* Para approved y pending, usar ProjectGrid para consistencia visual */}
        <div className="space-y-3 max-w-full">
          <ProjectGrid
            projects={activeCategory === 'pending' ? pendingProjects : approvedOnlyProjects}
            variant={activeCategory === 'pending' ? 'pending' : 'approved'}
            viewMode="grid"
          />
        </div>
      </div>
    </div>
  );
}

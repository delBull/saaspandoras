import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProjectGrid } from "./ProjectGrid";
import type { Project } from "../../../hooks/applicants/useApplicantsData";

interface PanelProjectsProps {
  pendingProjects: Project[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function PanelProjects({ pendingProjects, isCollapsed, onToggleCollapse }: PanelProjectsProps) {
  return (
    <div
      className={`fixed right-0 top-0 h-screen bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 transition-all duration-500 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-1/5 min-w-[300px] max-w-[320px]'
      } z-20 overflow-hidden flex flex-col`}
    >
      {/* Panel Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800/50 p-4 flex-shrink-0">
        <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
          {!isCollapsed && (
            <h3 className="text-lg font-bold text-white">En Revisión</h3>
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
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
              {pendingProjects.length} proyectos
            </span>
          </div>
        )}
      </div>

      {/* Panel Content */}
      <div className={`h-full px-3 py-3 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent ${
        isCollapsed ? 'hidden' : ''
      }`}>
        <ProjectGrid projects={pendingProjects} variant="pending" />
      </div>
    </div>
  );
}

//import { PlusIcon } from "lucide-react";
//import { Button } from "@saasfly/ui/button";
import { MobileModal } from "./shared/MobileModal";
import { ProjectGrid } from "./shared/ProjectGrid";
import type { Project } from "../../hooks/applicants/useApplicantsDataBasic";

type ViewMode = 'grid' | 'list';

interface FilterOptions {
  search: string;
  category: string;
  network: string;
  status: string;
  minTokenPrice: string;
  maxTokenPrice: string;
}

interface ApplicantsMobileProps {
  pendingProjects: Project[];
  approvedProjects: Project[];
  showMobileModal: boolean;
  setShowMobileModal: (show: boolean) => void;
  onApplyClick: () => void;
  // Filtros móviles
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filters: FilterOptions;
  updateFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  totalProjects: number;
  filteredCount: number;
}

export function ApplicantsMobile({
   pendingProjects,
   approvedProjects,
   showMobileModal,
   setShowMobileModal,
   onApplyClick,
   viewMode,
   onViewModeChange: _onViewModeChange,
   filters: _filters,
   updateFilter: _updateFilter,
   clearFilters: _clearFilters,
   hasActiveFilters: _hasActiveFilters,
   totalProjects: _totalProjects,
   filteredCount: _filteredCount,
 }: ApplicantsMobileProps) {
  return (
    <div className="lg:hidden min-h-screen text-white">
      {/* Header */}
      <div className="top-0 z-20 flex justify-between items-center px-4 py-6 gap-6 bg-zinc-950/80 backdrop-blur-sm ml-16">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">Proyectos</h1>
          <p className="text-gray-400 text-sm truncate">
            {`${_filteredCount} de ${_totalProjects} proyectos aprobados`}
          </p>
        </div>
        <button
          onClick={onApplyClick}
          className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold shadow-lg flex-shrink-0 text-sm px-3 py-2 rounded-lg whitespace-nowrap"
        >
          Aplicar
        </button>
      </div>

      {/* Mobile Button for pending projects */}
      <div className="px-4 py-6 ml-16">
        <button
          onClick={() => setShowMobileModal(true)}
          className="w-full flex items-center justify-center px-3 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors"
        >
          Ver {pendingProjects.length > 0 ? `${pendingProjects.length} Proyectos en Revisión` : 'Proyectos de Revisión'}
        </button>
      </div>

      {/* Mobile Main Content - Approved Projects */}
      <div className="px-4 py-8 ml-16">
        <ProjectGrid
          projects={approvedProjects}
          variant="approved"
          viewMode={viewMode}
        />
      </div>

      {/* Mobile Modal for Pending Projects */}
      <MobileModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        pendingProjects={pendingProjects}
      />
    </div>
  );
}

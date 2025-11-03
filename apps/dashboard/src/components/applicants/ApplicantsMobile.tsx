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
  approvedOnlyProjects: Project[];
  showMobileModal: boolean;
  setShowMobileModal: (show: boolean) => void;
  showMobileApprovedModal: boolean;
  setShowMobileApprovedModal: (show: boolean) => void;
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
   approvedOnlyProjects,
   showMobileModal,
   setShowMobileModal,
   showMobileApprovedModal,
   setShowMobileApprovedModal,
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
    <div className="lg:hidden min-h-screen text-white pb-20 md:pb-6">
      {/* Header */}
      <div className="top-0 z-20 flex justify-between items-center px-2 py-6 gap-6 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">Creaciones</h1>
          <p className="text-gray-400 text-sm truncate">
            {`${approvedProjects.filter(p => p.status === 'live').length} de ${approvedProjects.length} creaciones desatadas`}
          </p>
        </div>
        {/* Enlace a /apply en la parte superior derecha */}
        <a
          href="/apply"
          className="text-sm italic text-gray-400 hover:text-lime-300 transition-colors whitespace-nowrap"
        >
          Desatar Creación
        </a>
      </div>

      {/* Mobile Buttons */}
      <div className="px-2 py-4">
        <div className="flex gap-4">
          <button
            onClick={() => setShowMobileModal(true)}
            className="flex-1 flex items-center justify-center px-3 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition-colors"
          >
            Ver {pendingProjects.length > 0 ? `${pendingProjects.length} Creaciones en Revisión` : 'Creaciones de Revisión'}
          </button>

          <button
            onClick={() => setShowMobileApprovedModal(true)}
            className="flex-1 flex items-center justify-center px-3 py-3 bg-green-500/20 text-green-300 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors"
          >
            Ver {approvedOnlyProjects.length > 0
              ? `${approvedOnlyProjects.length} Creaciones Aprobadas`
              : 'Creaciones Aprobadas'}
          </button>
        </div>
      </div>

      {/* Mobile Main Content - Live Projects Only */}
      <div className="py-2">
        <ProjectGrid
          projects={approvedProjects}
          variant="approved"
          viewMode={viewMode}
        />
        {/* Center and full width styling inherited from ProjectGrid w-full adjustments */}
      </div>

      {/* Mobile Modal for Pending Projects */}
      <MobileModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        pendingProjects={pendingProjects}
      />

      {/* Mobile Modal for Approved Projects - Only status='approved' */}
      <MobileModal
        isOpen={showMobileApprovedModal}
        onClose={() => setShowMobileApprovedModal(false)}
        pendingProjects={approvedOnlyProjects}
        approvedProjects={approvedOnlyProjects}
        title="Creaciones Aprobadas"
      />
    </div>
  );
}

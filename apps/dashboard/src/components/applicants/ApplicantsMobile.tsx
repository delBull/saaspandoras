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
    <div className="lg:hidden min-h-screen text-white">
      {/* Header */}
      <div className="top-0 z-20 flex justify-between items-center px-6 py-6 gap-6 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">Creaciones</h1>
          <p className="text-gray-400 text-sm truncate">
            {`${approvedProjects.filter(p => p.status === 'live').length} de ${approvedProjects.length} creaciones desatadas`}
          </p>
        </div>
      </div>

      {/* Mobile Buttons */}
      <div className="px-6 py-8 space-y-4">
        <button
          onClick={() => setShowMobileModal(true)}
          className="w-full flex items-center justify-center px-3 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors"
        >
          Ver {pendingProjects.length > 0 ? `${pendingProjects.length} Creaciones en Revisión` : 'Creaciones de Revisión'}
        </button>

        <button
          onClick={() => setShowMobileApprovedModal(true)}
          className="w-full flex items-center justify-center px-3 py-3 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors"
        >
          Ver {approvedOnlyProjects.length > 0
            ? `${approvedOnlyProjects.length} Creaciones Aprobadas`
            : 'Creaciones Aprobadas'}
        </button>
      </div>

      {/* Mobile Main Content - Live Projects Only */}
      <div className="px-6 lg:px-0 py-8">
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

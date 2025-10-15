//import { PlusIcon } from "lucide-react";
//import { Button } from "@saasfly/ui/button";
import { PanelProjects } from "./shared/PanelProjects";
import { ProjectGrid } from "./shared/ProjectGrid";
// import { ApplicantsFilters } from "./ApplicantsFilters";
// import { ApplicantsListView } from "./ApplicantsListView";
// import { useProjectFilters } from "../../hooks/applicants/useProjectFilters";
import type { Project } from "../../hooks/applicants/useApplicantsDataBasic";

type ViewMode = 'grid' | 'list';
type GridColumns = 3 | 4 | 6;

interface FilterOptions {
  search: string;
  category: string;
  network: string;
  status: string;
  minTokenPrice: string;
  maxTokenPrice: string;
}

interface ApplicantsDesktopProps {
  pendingProjects: Project[];
  approvedProjects: Project[];
  isPendingPanelCollapsed: boolean;
  onTogglePanelCollapse: () => void;
  onApplyClick: () => void;
  // Filtros avanzados (opcionales hasta completar implementación)
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  gridColumns?: GridColumns;
  onGridColumnsChange?: (columns: GridColumns) => void;
  filters?: FilterOptions;
  updateFilter?: (key: string, value: string) => void;
  clearFilters?: () => void;
  hasActiveFilters?: boolean;
  totalProjects?: number;
  filteredCount?: number;
}

export function ApplicantsDesktop({
  pendingProjects,
  approvedProjects,
  isPendingPanelCollapsed,
  onTogglePanelCollapse,
  onApplyClick: _onApplyClick,
}: ApplicantsDesktopProps) {
  // const {
  //   viewMode,
  //   setViewMode,
  //   gridColumns,
  //   setGridColumns,
  //   filters,
  //   updateFilter,
  //   clearFilters,
  //   hasActiveFilters,
  //   totalProjects,
  //   filteredCount,
  // } = useProjectFilters({
  //   projects: [...pendingProjects, ...approvedProjects],
  // });

  return (
    <div className="hidden lg:block min-h-screen">
      {/* Fila 1: Header */}
      <div className={`top-0 z-10 flex justify-between items-center px-6 lg:px-8 py-6 gap-8 w-full transition-all duration-500 ease-in-out ${
        isPendingPanelCollapsed ? 'pr-20' : 'pr-[340px]'
      }`}>
        <div className="flex-row items-center gap-8">
          <h1 className="text-3xl font-bold text-white">Proyectos</h1>
          <p className="text-gray-400 text-base">
            {`${approvedProjects.length} proyectos aprobados disponibles`}
          </p>
        </div>
      </div>

      {/* Fila 2: Proyectos (Filtros comentados hasta completar implementación) */}
      <div className={`w-full px-6 lg:px-8 py-8 transition-all duration-500 ease-in-out ${
        isPendingPanelCollapsed ? 'pr-20' : 'pr-[340px]'
      }`}>
        <ProjectGrid projects={approvedProjects} variant="approved" />
      </div>

      {/* Panel Derecho */}
      <PanelProjects
        pendingProjects={pendingProjects}
        isCollapsed={isPendingPanelCollapsed}
        onToggleCollapse={onTogglePanelCollapse}
      />
    </div>
  );
}

import { PanelProjects } from "./shared/PanelProjects";
import { ProjectGrid } from "./shared/ProjectGrid";
import { ApplicantsFilters } from "./ApplicantsFilters";
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
  // Filtros requeridos
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  gridColumns: GridColumns;
  onGridColumnsChange: (columns: GridColumns) => void;
  filters: FilterOptions;
  updateFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  totalProjects: number;
  filteredCount: number;
}

export function ApplicantsDesktop({
    pendingProjects,
    approvedProjects,
    isPendingPanelCollapsed,
    onTogglePanelCollapse,
    viewMode = 'grid',
    onViewModeChange,
    gridColumns = 3,
    onGridColumnsChange,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    totalProjects,
    filteredCount,
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
      {/* Panel Derecho - Movido arriba para que tenga z-index más alto */}
      <PanelProjects
        pendingProjects={pendingProjects}
        isCollapsed={isPendingPanelCollapsed}
        onToggleCollapse={onTogglePanelCollapse}
      />

      {/* Contenedor principal con ajuste automático de márgenes */}
      <div className={`min-h-screen transition-all duration-500 ease-in-out ${
        isPendingPanelCollapsed ? 'mr-12' : 'mr-[270px]'
      }`}>
        {/* Fila 1: Header con filtros */}
        <div className="top-0 z-10 flex flex-col gap-4 px-6 lg:px-0 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Proyectos</h1>
              <p className="text-gray-400 text-base">
                {`${filteredCount} de ${totalProjects} proyectos aprobados`}
              </p>
            </div>
          </div>

          {/* Filtros activados */}
          <ApplicantsFilters
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            gridColumns={gridColumns}
            onGridColumnsChange={onGridColumnsChange}
            filters={filters}
            onFiltersChange={(_filters: FilterOptions) => { /* No necesitamos esta función */ }}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            totalProjects={totalProjects}
            filteredCount={filteredCount}
          />
        </div>

        {/* Fila 2: Proyectos */}
        <div className="w-full px-6 lg:px-0 py-8">
          <ProjectGrid
            projects={approvedProjects}
            variant="approved"
            viewMode={viewMode}
            gridColumns={gridColumns}
          />
        </div>
      </div>
    </div>
  );
}

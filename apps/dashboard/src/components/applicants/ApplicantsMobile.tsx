//import { PlusIcon } from "lucide-react";
//import { Button } from "@saasfly/ui/button";
import { MobileModal } from "./shared/MobileModal";
import { ProjectGrid } from "./shared/ProjectGrid";
import type { Project } from "../../hooks/applicants/useApplicantsDataBasic";

type ViewMode = 'grid' | 'list';

interface ApplicantsMobileProps {
  pendingProjects: Project[];
  approvedProjects: Project[];
  showMobileModal: boolean;
  setShowMobileModal: (show: boolean) => void;
  onApplyClick: () => void;
  // Filtros básicos para móvil (opcionales hasta completar implementación)
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function ApplicantsMobile({
  pendingProjects,
  approvedProjects,
  showMobileModal,
  setShowMobileModal,
  //onApplyClick,
  viewMode,
  onViewModeChange: _onViewModeChange,
}: ApplicantsMobileProps) {
  return (
    <div className="lg:hidden min-h-screen text-white">
      {/* Header */}
      <div className="top-0 z-20 flex justify-between items-center px-4 py-6 gap-6 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">Proyectos</h1>
          <p className="text-gray-400 text-sm truncate">Proyectos aprobados listos para invertir</p>
        </div>
        {/*
        <Button
          onClick={onApplyClick}
          size="sm"
          className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold shadow-lg flex-shrink-0 text-sm whitespace-nowrap"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Aplicar
        </Button>
        */}
      </div>

      {/* Mobile Button for pending projects */}
      <div className="px-4 py-6">
        <button
          onClick={() => setShowMobileModal(true)}
          className="w-full flex items-center justify-center px-3 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors"
        >
          Ver {pendingProjects.length > 0 ? `${pendingProjects.length} Proyectos en Revisión` : 'Proyectos de Revisión'}
        </button>
      </div>

      {/* Mobile Main Content - Approved Projects */}
      <div className="px-4 py-8">
        {viewMode === 'grid' ? (
          <ProjectGrid projects={approvedProjects} variant="approved" />
        ) : (
          <div className="text-center py-8 text-gray-400">
            Vista de lista no disponible en móvil
          </div>
        )}
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

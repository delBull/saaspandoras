//import { PlusIcon } from "lucide-react";
//import { Button } from "@saasfly/ui/button";
import { PanelProjects } from "./shared/PanelProjects";
import { ProjectGrid } from "./shared/ProjectGrid";
import type { Project } from "../../hooks/applicants/useApplicantsData";

interface ApplicantsDesktopProps {
  pendingProjects: Project[];
  approvedProjects: Project[];
  isPendingPanelCollapsed: boolean;
  onTogglePanelCollapse: () => void;
  onApplyClick: () => void;
}

export function ApplicantsDesktop({
  pendingProjects,
  approvedProjects,
  isPendingPanelCollapsed,
  onTogglePanelCollapse,
  //onApplyClick,
}: ApplicantsDesktopProps) {
  return (
    <div className="hidden lg:block min-h-screen">
      {/* Fila 1: Header */}
      <div className={`top-0 z-10 flex justify-between items-center px-6 lg:px-8 py-6 gap-8 w-full transition-all duration-500 ease-in-out ${
        isPendingPanelCollapsed ? 'pr-20' : 'pr-[340px]'
      }`}>
        <div className="flex-row items-center gap-8">
          <h1 className="text-3xl font-bold text-white">Proyectos</h1>
          <p className="text-gray-400 text-base">Aprobados listos para invertir</p>
        </div>
        {/*
        <Button
          onClick={onApplyClick}
          size="default"
          className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold px-6 py-3 shadow-lg flex-shrink-0 text-base whitespace-nowrap"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Aplicar Nuevo Proyecto
        </Button>
        */}
      </div>

      {/* Fila 2: Proyectos Aprobados */}
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

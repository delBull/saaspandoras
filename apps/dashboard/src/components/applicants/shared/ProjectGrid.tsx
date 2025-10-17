import { ProjectCard } from "./ProjectCard";
import { ApplicantsListView } from "../ApplicantsListView";
import { EyeIcon } from "lucide-react";
import type { Project } from "../../../hooks/applicants/useApplicantsData";

export type ViewMode = 'grid' | 'list';
export type GridColumns = 3 | 4 | 6;

interface ProjectGridProps {
  projects: Project[];
  variant?: 'approved' | 'pending';
  viewMode?: ViewMode;
  gridColumns?: GridColumns;
}

export function ProjectGrid({
  projects,
  variant = 'approved',
  viewMode = 'grid',
  gridColumns = 3
}: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center mx-5 py-8 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
        <EyeIcon className="w-8 h-8 text-gray-400 dark:text-zinc-500 mx-auto mb-2" />
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {variant === 'pending'
            ? "No hay proyectos en revisión"
            : "No hay proyectos para mostrar"}
        </p>
      </div>
    );
  }

  // List view
  if (viewMode === 'list') {
    return <ApplicantsListView projects={projects} variant={variant} />;
  }

  // Grid view
  const getGridClasses = () => {
    const baseClasses = 'gap-4 md:gap-6 place-items-center';

    if (variant === 'pending') {
      return `grid grid-cols-1 ${baseClasses}`;
    }

    // Responsive grid based on selected columns with better breakpoints
    switch (gridColumns) {
      case 6:
        return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 ${baseClasses}`;
      case 4:
        return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${baseClasses}`;
      case 3:
      default:
        return `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${baseClasses}`;
    }
  };

  return (
    <div className={getGridClasses()}>
      {projects.map((project) => (
        <div key={project.id} className="w-full">
          <ProjectCard
            project={project}
            variant={variant}
            gridColumns={gridColumns}
          />
        </div>
      ))}
    </div>
  );
}

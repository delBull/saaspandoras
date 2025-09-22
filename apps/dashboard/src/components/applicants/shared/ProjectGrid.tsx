import { ProjectCard } from "./ProjectCard";
import { EyeIcon } from "lucide-react";
import type { Project } from "../../../hooks/applicants/useApplicantsData";

interface ProjectGridProps {
  projects: Project[];
  variant?: 'approved' | 'pending';
}

export function ProjectGrid({ projects, variant = 'approved' }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center mx-5 py-8 bg-zinc-800/30 rounded-xl border-2 border-dashed border-zinc-700">
        <EyeIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">
          {variant === 'pending'
            ? "No hay proyectos en revisión"
            : "No hay proyectos para mostrar"}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-8 ${
      variant === 'pending' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
    }`}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          variant={variant}
        />
      ))}
    </div>
  );
}

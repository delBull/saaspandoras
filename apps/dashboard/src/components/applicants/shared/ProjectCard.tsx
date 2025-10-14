import Image from "next/image";
import Link from "next/link";
import { EyeIcon, ImageIcon } from "lucide-react";
import type { Project } from "../../../hooks/applicants/useApplicantsData";

interface ProjectCardProps {
  project: Project;
  variant?: 'approved' | 'pending';
}

export function ProjectCard({ project, variant = 'approved' }: ProjectCardProps) {
  const targetAmount = Number(project.targetAmount ?? 0);
  const raisedAmount = Number(project.raisedAmount ?? 0);
  const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;

  const isPending = project.status === 'pending';

  return (
    <div className={`bg-gray-50 dark:bg-zinc-800/50 rounded-xl overflow-hidden border hover:border-lime-500/50 transition-all duration-300 group flex flex-col w-full ${
      variant === 'pending' ? 'hover:border-yellow-500/50 border-gray-200 dark:border-zinc-700' : 'border-gray-200 dark:border-zinc-700'
    }`}>
      <div className="relative w-full bg-gray-200 dark:bg-zinc-700" style={{ paddingBottom: isPending ? '75%' : '50%' }}>
        {project.coverPhotoUrl ? (
          <Image
            src={project.coverPhotoUrl}
            alt={`Cover photo for ${project.title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-zinc-500" />
          </div>
        )}

        {/* Status Badge */}
        {variant === 'pending' && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 text-xs font-medium bg-yellow-500/90 text-black rounded-full">
              Pendiente
            </span>
          </div>
        )}
      </div>

      <div className={`flex flex-col flex-grow ${variant === 'pending' ? 'p-3' : 'p-5'}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 ${
          isPending ? 'text-base' : 'text-xl'
        }`}>
          {project.title}
        </h3>
        <p className={`text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow ${
          isPending ? 'text-xs h-8' : 'text-sm h-10'
        }`}>
          {project.description}
        </p>

        {!isPending && project.status !== 'pending' && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Recaudado</span>
              <span className="font-semibold text-gray-900 dark:text-white">${raisedAmount.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-lime-500 to-emerald-500 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-600 dark:text-gray-400 mt-1">
              Meta <span className="font-semibold text-gray-900 dark:text-white">${targetAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className={`flex justify-between items-center ${isPending ? 'pt-2' : 'pt-4'} border-t border-gray-200 dark:border-zinc-700 mt-auto`}>
          {variant === 'pending' ? (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded-full">
              En Revisión
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full">
              Aprobado
            </span>
          )}
          <Link href={`/projects/${project.slug}`} className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${
            isPending ? 'text-xs' : 'text-sm'
          } ${variant === 'pending' ? 'text-lime-400' : 'text-emerald-400'}`}>
            <EyeIcon className="w-4 h-4" />
            Ver Proyecto
          </Link>
        </div>
      </div>
    </div>
  );
}

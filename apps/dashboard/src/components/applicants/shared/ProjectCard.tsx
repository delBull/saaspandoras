import Image from "next/image";
import Link from "next/link";
import { EyeIcon, ImageIcon } from "lucide-react";
import type { Project } from "../../../hooks/applicants/useApplicantsData";

interface ProjectCardProps {
  project: Project;
  variant?: 'approved' | 'pending';
  gridColumns?: 3 | 4 | 6;
}

export function ProjectCard({ project, variant = 'approved', gridColumns = 3 }: ProjectCardProps) {
  const targetAmount = Number(project.targetAmount ?? 0);
  const raisedAmount = Number(project.raisedAmount ?? 0);
  const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;

  const isPending = project.status === 'pending';

  // Responsive sizing based on grid columns
  const getCardStyles = () => {
    const baseClasses = `bg-gray-50 dark:bg-zinc-800/50 rounded-xl overflow-hidden border hover:border-lime-500/50 transition-all duration-300 group flex flex-col w-full`;

    if (variant === 'pending') {
      return `${baseClasses} hover:border-yellow-500/50 border-gray-200 dark:border-zinc-700`;
    }

    // Adjust card size based on number of columns
    switch (gridColumns) {
      case 6:
        return `${baseClasses} border-gray-200 dark:border-zinc-700 max-w-[200px]`;
      case 4:
        return `${baseClasses} border-gray-200 dark:border-zinc-700 max-w-[280px]`;
      case 3:
      default:
        return `${baseClasses} border-gray-200 dark:border-zinc-700 max-w-[320px]`;
    }
  };

  const getImageAspectRatio = () => {
    if (isPending) return '75%';
    switch (gridColumns) {
      case 6: return '60%'; // Más cuadrado para tarjetas pequeñas
      case 4: return '56%'; // Proporción media
      case 3:
      default: return '50%'; // Más rectangular para tarjetas grandes
    }
  };

  const getPadding = () => {
    if (variant === 'pending') return 'p-3';
    switch (gridColumns) {
      case 6: return 'p-3'; // Menos padding para tarjetas pequeñas
      case 4: return 'p-4'; // Padding medio
      case 3:
      default: return 'p-5'; // Más padding para tarjetas grandes
    }
  };

  const getTitleSize = () => {
    if (isPending) return 'text-base';
    switch (gridColumns) {
      case 6: return 'text-lg'; // Título más pequeño
      case 4: return 'text-lg'; // Título medio
      case 3:
      default: return 'text-xl'; // Título más grande
    }
  };

  const getDescriptionHeight = () => {
    if (isPending) return 'h-8';
    switch (gridColumns) {
      case 6: return 'h-8'; // Menos espacio para descripción
      case 4: return 'h-10'; // Espacio medio
      case 3:
      default: return 'h-12'; // Más espacio para descripción
    }
  };

  return (
    <div className={getCardStyles()}>
      <div className="relative w-full bg-gray-200 dark:bg-zinc-700" style={{ paddingBottom: getImageAspectRatio() }}>
        {project.coverPhotoUrl ? (
          <Image
            src={project.coverPhotoUrl}
            alt={`Cover photo for ${project.title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className={`${gridColumns === 6 ? 'w-8 h-8' : gridColumns === 4 ? 'w-10 h-10' : 'w-12 h-12'} text-zinc-500`} />
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

      <div className={`flex flex-col flex-grow ${getPadding()}`}>
        <h3 className={`font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 ${getTitleSize()}`}>
          {project.title}
        </h3>
        <p className={`text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow text-sm ${getDescriptionHeight()}`}>
          {project.description}
        </p>

        {!isPending && project.status !== 'pending' && (
          <div className="mb-4">
            <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
              <span>Progreso de Financiamiento</span>
              <span className="font-semibold text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-lime-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
              <span>${raisedAmount.toLocaleString()} recaudados</span>
              <span>de ${targetAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className={`flex justify-between items-center ${isPending ? 'pt-2' : 'pt-3'} border-t border-gray-200 dark:border-zinc-700 mt-auto`}>
          {variant === 'pending' ? (
            <span className={`px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-300 rounded-full ${
              gridColumns === 6 ? 'px-1.5 py-0.5 text-xs' : gridColumns === 4 ? 'px-2 py-1 text-xs' : 'px-2 py-1 text-xs'
            }`}>
              En Revisión
            </span>
          ) : (
            <span className={`px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full ${
              gridColumns === 6 ? 'px-1.5 py-0.5 text-xs' : gridColumns === 4 ? 'px-2 py-1 text-xs' : 'px-2 py-1 text-xs'
            }`}>
              Aprobado
            </span>
          )}
          <Link href={`/projects/${project.slug}`} className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${
            isPending ? 'text-xs' : gridColumns === 6 ? 'text-xs' : 'text-sm'
          } ${variant === 'pending' ? 'text-lime-400' : 'text-emerald-400'}`}>
            <EyeIcon className={`${gridColumns === 6 ? 'w-3 h-3' : 'w-4 h-4'}`} />
            {gridColumns === 6 ? 'Ver' : 'Ver Proyecto'}
          </Link>
        </div>
      </div>
    </div>
  );
}

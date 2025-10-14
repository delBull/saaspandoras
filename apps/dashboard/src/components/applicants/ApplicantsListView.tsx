"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { EyeIcon, ImageIcon, Calendar, DollarSign } from "lucide-react";
import type { Project } from "../../hooks/applicants/useApplicantsData";

interface ApplicantsListViewProps {
  projects: Project[];
  variant?: 'approved' | 'pending';
}

export function ApplicantsListView({ projects, variant = 'approved' }: ApplicantsListViewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-zinc-800/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
        <EyeIcon className="w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          {variant === 'pending'
            ? "No hay proyectos en revisión"
            : "No hay proyectos para mostrar"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ListItem key={project.id} project={project} variant={variant} />
      ))}
    </div>
  );
}

interface ListItemProps {
  project: Project;
  variant: 'approved' | 'pending';
}

function ListItem({ project, variant }: ListItemProps) {
  const targetAmount = Number(project.targetAmount ?? 0);
  const raisedAmount = Number(project.raisedAmount ?? 0);
  const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;
  const isPending = project.status === 'pending';

  return (
    <div className={`bg-gray-50 dark:bg-zinc-800/50 rounded-xl border hover:border-lime-500/50 transition-all duration-300 group flex items-center gap-6 p-6 ${
      variant === 'pending' ? 'hover:border-yellow-500/50 border-gray-200 dark:border-zinc-700' : 'border-gray-200 dark:border-zinc-700'
    }`}>

      {/* Project Image */}
      <div className="relative w-24 h-24 bg-gray-200 dark:bg-zinc-700 rounded-lg overflow-hidden flex-shrink-0">
        {project.coverPhotoUrl ? (
          <Image
            src={project.coverPhotoUrl}
            alt={`Cover photo for ${project.title}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-zinc-500" />
          </div>
        )}

        {/* Status Badge */}
        {variant === 'pending' && (
          <div className="absolute -top-1 -right-1">
            <span className="px-2 py-1 text-xs font-medium bg-yellow-500 text-black rounded-full">
              Pendiente
            </span>
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 truncate">
              {project.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
              {project.description}
            </p>

            {/* Project Meta */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
              {project.targetAmount && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ${Number(project.targetAmount).toLocaleString()} objetivo
                </div>
              )}
            </div>
          </div>

          {/* Financial Info (only for approved projects) */}
          {!isPending && project.status !== 'pending' && (
            <div className="flex-shrink-0 text-right">
              <div className="mb-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">Progreso</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${raisedAmount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  de ${targetAmount.toLocaleString()}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-32 bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-lime-500 to-emerald-500 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400">
                {progress.toFixed(1)}% completado
              </div>
            </div>
          )}
        </div>

        {/* Status and Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-700/50">
          <div className="flex items-center gap-2">
            {variant === 'pending' ? (
              <span className="px-3 py-1 text-sm font-medium bg-yellow-500/20 text-yellow-300 rounded-full">
                En Revisión
              </span>
            ) : (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                project.status === 'live'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : project.status === 'completed'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}>
                {project.status === 'live' ? 'Activo' :
                 project.status === 'completed' ? 'Completado' :
                 project.status === 'approved' ? 'Aprobado' : 'Desconocido'}
              </span>
            )}
          </div>

          <Link
            href={`/projects/${project.slug}`}
            className="flex items-center gap-2 text-sm text-lime-400 hover:text-lime-300 transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            Ver Proyecto
          </Link>
        </div>
      </div>
    </div>
  );
}
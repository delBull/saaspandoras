"use client";

import React from "react";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import Image from "next/image";
import type { Project } from "../../hooks/applicants/useApplicantsData";

interface ApplicantsListViewProps {
  projects: Project[];
  variant?: 'pending' | 'approved';
}

export function ApplicantsListView({ projects, variant = 'approved' }: ApplicantsListViewProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">No hay proyectos</div>
        <div className="text-gray-500 text-sm">
          {variant === 'approved'
            ? 'No se encontraron proyectos aprobados con los filtros aplicados'
            : 'No hay proyectos pendientes de revisión'
          }
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800 hover:border-lime-400/30 transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-6">
            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-lime-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-lime-400/20">
                  {project.coverPhotoUrl ? (
                    <Image
                      src={project.coverPhotoUrl}
                      alt={project.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-lime-400">
                      {project.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                        {project.description}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      project.status === 'live'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                        : project.status === 'approved'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                        : project.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                    }`}>
                      {project.status === 'live' ? 'Activo' :
                       project.status === 'approved' ? 'Aprobado' :
                       project.status === 'pending' ? 'Pendiente' :
                       project.status === 'completed' ? 'Completado' :
                       project.status === 'rejected' ? 'Rechazado' : 'Borrador'}
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-lime-400" />
                      <span className="text-gray-300">
                        ${typeof project.targetAmount === 'number' ? project.targetAmount.toLocaleString() : '0'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300 capitalize">
                        {project.status}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      ID: {project.id} • Slug: {project.slug}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
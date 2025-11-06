'use client';

import Image from "next/image";
import type { ProjectData } from "../../app/(dashboard)/projects/types";

interface ProjectHeaderProps {
  project: ProjectData;
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  // Acceso seguro a propiedades opcionales
  const projectObj = project as unknown as Record<string, unknown>;
  const coverPhotoUrl = projectObj.coverPhotoUrl || projectObj.cover_photo_url || '/images/default-project.jpg';
  const logoUrl = projectObj.logoUrl || projectObj.logo_url || '/images/default-logo.jpg';
  const tagline = projectObj.tagline || projectObj.description || 'Sin descripción';
  const businessCategory = projectObj.business_category as string | undefined;

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-xl mb-8">
      {/* Imagen de Portada */}
      <Image
        src={coverPhotoUrl as string}
        alt={`Portada de ${project.title}`}
        fill
        className="object-cover"
        priority
      />

      {/* Icono de Video - Solo mostrar si existe video_pitch */}
      {project.video_pitch && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="bg-black/70 backdrop-blur-sm rounded-full p-3 border border-zinc-700 hover:bg-black/80 transition-colors cursor-pointer group">
            <svg
              className="w-6 h-6 text-white group-hover:text-lime-400 transition-colors"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Superposición Oscura y Contenido */}
      <div className="absolute inset-0 bg-black/60 flex items-end p-6 md:p-12">
        <div className="flex items-end gap-6 w-full">
          {/* Logo */}
          <Image
            src={logoUrl as string}
            alt={`${project.title} logo`}
            width={100}
            height={100}
            className="rounded-xl border-4 border-zinc-900 bg-zinc-800"
          />
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-white leading-tight">{project.title}</h1>
            <p className="text-xl text-lime-400 mt-1">{tagline as string}</p>
            <div className="mt-2 text-sm text-zinc-400">
              {businessCategory ? businessCategory.toUpperCase().replace(/_/g, ' ') : 'Sin Categoría'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import type { ProjectData } from "../../app/dashboard/projects/types";

interface ProjectHeaderProps {
  project: ProjectData;
  onVideoClick?: () => void;
}

export default function ProjectHeader({ project, onVideoClick }: ProjectHeaderProps) {
  // Acceso seguro a propiedades opcionales
  const projectObj = project as unknown as Record<string, unknown>;
  const coverPhotoUrl = projectObj.coverPhotoUrl || projectObj.cover_photo_url || '/images/default-project.jpg';
  const logoUrl = projectObj.logoUrl || projectObj.logo_url || '/images/default-logo.jpg';
  const tagline = projectObj.tagline || projectObj.description || 'Sin descripción';
  const businessCategory = projectObj.business_category as string | undefined;

  // Estados para controlar las animaciones
  const [showVideoHint, setShowVideoHint] = useState(false);
  const [stopAnimations, setStopAnimations] = useState(false);

  useEffect(() => {
    // Mostrar la animación después de 3 segundos
    const timer1 = setTimeout(() => {
      setShowVideoHint(true);
    }, 3000);

    // Detener las animaciones después de 20 segundos más (total 23 segundos)
    const timer2 = setTimeout(() => {
      setStopAnimations(true);
    }, 23000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleVideoClick = () => {
    if (onVideoClick) {
      onVideoClick();
    }
  };

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

      {/* Contenedor Unificado del Video - Solo mostrar si existe video_pitch */}
      {project.video_pitch && (
        <div className="absolute bottom-4 right-4 z-10">
          {/* Contenedor principal unificado */}
          <div className="flex flex-col items-center space-y-2">
            {/* Animación de Texto y Flecha - Solo cuando está visible */}
            <div className={`transition-all duration-1000 ${showVideoHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <div className="flex flex-col items-center">
                {/* Texto en cursiva */}
                <p className={`text-white text-xs italic mb-1 font-light ${!stopAnimations ? 'animate-pulse' : ''}`}>
                  Ver el video Pitch
                </p>
                
                {/* Flecha apuntando hacia el icono - Solo se muestra si no se han detenido las animaciones */}
                {!stopAnimations && (
                  <div className="relative">
                    <svg
                      className="w-4 h-6 text-lime-400 animate-bounce"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l-3 4h6l-3 4 3-4h-6l3-4zm0 8l-3 4h6l-3 4 3-4h-6l3-4z"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Icono de Video con efecto de blink unificado */}
            <button
              onClick={handleVideoClick}
              className={`bg-black/70 backdrop-blur-sm rounded-full p-3 border border-zinc-700 hover:bg-black/80 transition-all duration-300 cursor-pointer group hover:scale-110 hover:border-lime-400 ${
                showVideoHint && !stopAnimations ? 'animate-pulse' : ''
              }`}
              type="button"
            >
              <svg
                className="w-6 h-6 text-white group-hover:text-lime-400 transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
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
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface RecommendedProjectsSectionProps {
  currentProjectSlug: string;
}

interface Project {
  id: string;
  title: string;
  subtitle: string;
  actionText: string;
  imageUrl?: string;
  projectSlug: string;
  applicant_name?: string;
}

export default function RecommendedProjectsSection({ currentProjectSlug }: RecommendedProjectsSectionProps) {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        const response = await fetch('/api/projects/featured', {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`API responded with status ${response.status}`);
        }

        const projects = await response.json() as Record<string, unknown>[];

        // Convertir proyectos featured a formato requerido, excluyendo el proyecto actual
        const filteredProjects = projects.filter((project: Record<string, unknown>) => String(project.slug) !== currentProjectSlug);

        // Si hay más de 3 proyectos, seleccionar 3 aleatoriamente
        let selectedProjects = filteredProjects;
        if (filteredProjects.length > 3) {
          const shuffled = [...filteredProjects].sort(() => 0.5 - Math.random());
          selectedProjects = shuffled.slice(0, 3);
        } else {
          selectedProjects = filteredProjects.slice(0, 3);
        }

        const formattedProjects = selectedProjects.map((project: Record<string, unknown>, index: number) => ({
          id: String(project.id ?? `featured-${index}`),
          title: String(project.title ?? 'Proyecto sin título'),
          subtitle: String(project.tagline ?? project.description ?? 'Descripción no disponible'),
          actionText: 'Ver Proyecto',
          imageUrl: String(project.coverPhotoUrl || project.cover_photo_url || '/images/default-project.jpg'),
          projectSlug: String(project.slug ?? `project-${String(project.id)}`),
          applicant_name: String(project.applicant_name ?? 'Creador Anónimo'),
        }));

        setFeaturedProjects(formattedProjects);
      } catch (error) {
        console.error('Error fetching featured projects:', error);
        setFeaturedProjects([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchFeaturedProjects();
  }, [currentProjectSlug]);

  if (loading) {
    return (
      <div className="relative">
        <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
          <div className="border-t border-zinc-800 pt-16 mt-10">
            <h2 className="text-2xl font-bold text-white mb-8">TAMBIÉN TE RECOMENDAMOS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-zinc-800"></div>
                  <div className="p-4">
                    <div className="h-4 bg-zinc-800 rounded mb-2"></div>
                    <div className="h-3 bg-zinc-800 rounded mb-1"></div>
                    <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (featuredProjects.length === 0) {
    return null; // No mostrar la sección si no hay proyectos recomendados
  }

  return (
    <div className="relative">
      <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
        <div className="border-t border-zinc-800 pt-16 mt-10">
          <h2 className="text-2xl font-bold text-white mb-8">TAMBIÉN TE RECOMENDAMOS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featuredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.projectSlug}`} className="block">
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl overflow-hidden border hover:border-lime-500/50 transition-all duration-300 group flex flex-col w-full">
                  <div className="relative w-full bg-gray-200 dark:bg-zinc-700" style={{ paddingBottom: '56%' }}>
                    {project.imageUrl ? (
                      <Image
                        src={project.imageUrl}
                        alt={`Cover photo for ${project.title}`}
                        fill
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 text-zinc-500">📷</div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col flex-grow p-5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 text-xl">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow text-sm">
                      {project.subtitle}
                    </p>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-zinc-700 mt-auto">
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full">
                        Recomendado
                      </span>
                      <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Proyecto
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
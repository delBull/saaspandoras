'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sanitizeUrl } from "@/lib/project-utils";

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

        const formattedProjects = selectedProjects.map((project: Record<string, unknown>, index: number) => {
           const rawImg = String(project.coverPhotoUrl || project.cover_photo_url || project.logoUrl || project.logo_url || '/images/default-project.jpg');
           return {
              id: String(project.id ?? `featured-${index}`),
              title: String(project.title ?? 'Proyecto sin título'),
              subtitle: String(project.tagline ?? project.description ?? 'Descripción no disponible'),
              actionText: 'Ver Proyecto',
              imageUrl: sanitizeUrl(rawImg) || '/images/default-project.jpg',
              projectSlug: String(project.slug ?? `project-${String(project.id)}`),
              applicant_name: String((project.applicantName || project.applicant_name) ?? 'Creador Anónimo'),
            };
        });

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
            <h2 className="text-2xl font-bold text-white mb-8 uppercase tracking-tight">También te recomendamos</h2>
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
          <h2 className="text-2xl font-bold text-white mb-8 uppercase tracking-tight">También te recomendamos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featuredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.projectSlug}`} className="block">
                <div className="bg-gray-50 dark:bg-zinc-900/40 rounded-xl overflow-hidden border border-white/5 hover:border-lime-500/50 transition-all duration-300 group flex flex-col w-full backdrop-blur-sm">
                  <div className="relative w-full bg-gray-200 dark:bg-zinc-800 overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                    {project.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 text-zinc-500">📷</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60" />
                  </div>

                  <div className="flex flex-col flex-grow p-5">
                    <div className="flex items-center gap-2 mb-2 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                       <span className="w-1 h-1 bg-lime-500 rounded-full" />
                       {project.applicant_name}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 text-lg group-hover:text-lime-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-500 mb-4 line-clamp-2 flex-grow text-xs leading-relaxed">
                      {project.subtitle}
                    </p>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-white/5 mt-auto">
                      <span className="px-2 py-0.5 text-[10px] font-black bg-lime-500/10 text-lime-400 border border-lime-500/20 rounded uppercase tracking-tighter">
                        Recomendado
                      </span>
                      <div className="text-[10px] text-lime-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                        Ver Proyecto
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
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
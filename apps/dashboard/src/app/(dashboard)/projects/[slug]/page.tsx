'use client';

import { notFound } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Puzzle,
  Shield,
  Code,
  Ticket,
  Crown,
  PieChart,
} from "lucide-react";
import { ProjectNavigation } from "./components/ProjectNavigation";
import { ProjectContent } from "./components/ProjectContent";

// Type for project data
interface ProjectData {
  id: number | string;
  title: string;
  slug: string;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  tagline?: string | null;
  description: string;
  business_category?: string | null;
  video_pitch?: string | null;
  website?: string | null;
  whitepaper_url?: string | null;
  twitter_url?: string | null;
  discord_url?: string | null;
  telegram_url?: string | null;
  linkedin_url?: string | null;
  target_amount?: string | number | null;
  total_valuation_usd?: string | number | null;
  token_type?: string | null;
  total_tokens?: string | number | null;
  tokens_offered?: string | number | null;
  token_price_usd?: string | number | null;
  estimated_apy?: string | null;
  yield_source?: string | null;
  lockup_period?: string | null;
  fund_usage?: string | null;
  team_members?: string | null;
  advisors?: string | null;
  token_distribution?: string | null;
  contract_address?: string | null;
  treasury_address?: string | null;
  legal_status?: string | null;
  valuation_document_url?: string | null;
  fiduciary_entity?: string | null;
  due_diligence_report_url?: string | null;
  is_mintable?: boolean | null;
  is_mutable?: boolean | null;
  update_authority_address?: string | null;
  applicant_name?: string | null;
  applicant_position?: string | null;
  applicant_email?: string | null;
  applicant_phone?: string | null;
  applicant_wallet_address?: string | null;
  verification_agreement?: boolean | null;
  image_url?: string | null;
  socials?: string | null;
  raised_amount?: string | number | null;
  returns_paid?: string | number | null;
  status: string;
  featured?: boolean | null;
  featured_button_text?: string | null;
  created_at?: string | Date | null;
}



// Helper para parsear JSON de forma segura
function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return defaultValue;
  }
}

// Componente para proyectos recomendados
function RecommendedProjectsSection({ currentProjectSlug }: { currentProjectSlug: string }) {
  const [featuredProjects, setFeaturedProjects] = useState<{id: string; title: string; subtitle: string; actionText: string; imageUrl?: string; projectSlug: string; applicant_name?: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/projects/featured`, {
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
          imageUrl: String(project.coverPhotoUrl ?? project.cover_photo_url ?? '/images/default-project.jpg'),
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

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [activeTab, setActiveTab] = useState('campaign');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlug, setCurrentSlug] = useState<string>('');

  // Load project data on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const resolvedParams = await params;
        const slug = resolvedParams.slug;
        setCurrentSlug(slug);

        const response = await fetch(`/api/projects/${slug}`);
        if (response.ok) {
          const projectData = await response.json() as ProjectData;
          setProject(projectData);
        } else {
          notFound();
        }
      } catch (error) {
        console.error('Error loading project:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    void loadProject();
  }, [params]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  // --- Conversión de datos segura ---
  const raisedAmount = Number(project.raised_amount ?? 0);
  const targetAmount = Number(project.target_amount ?? 1);

  const raisedPercentage = (raisedAmount / targetAmount) * 100;

  return (
    <div className="min-h-screen pb-20 md:pb-6">
      {/* Navigation Header - Responsive */}
      <nav className="border-b border-zinc-800 backdrop-blur-sm top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center gap-4 md:gap-8">
              <div className="hidden md:flex items-center gap-6">
                  <a href="/applicants" className="text-gray-300 hover:text-white transition-colors text-sm md:text-base">Explore</a>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        {/* Main Layout with Sidebar */}
        <div className="relative">
          {/* Sidebar (Right side) - All cards in sequence */}
          <div className="hidden lg:block absolute right-0 top-0 w-72 h-full">
            {/* Non-sticky section - Investment & Creator cards */}
            <div className="space-y-6 mb-6">
              {/* Investment Card */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-white mb-2">
                    0
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
                    <div
                      className="bg-lime-400 h-full rounded-full transition-all duration-500"
                      style={{ width: '0%' }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm mb-6">
                    <span className="text-gray-400">Meta: {targetAmount.toLocaleString()} tokens</span>
                    <span className="text-gray-400">30 días restantes</span>
                  </div>

                  <button className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-6 rounded-lg transition-colors mb-4">
                    ACCESO
                  </button>

                  <div className="flex justify-center gap-3 mb-4">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18.303 4.742a1 1 0 011.414 0l.707.707a1 1 0 010 1.414l-6.01 6.01a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 010-1.414l.707-.707a1 1 0 011.414 0L14.95 10.05l5.353-5.308z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-xs text-gray-400">
                    Todo o nada. Esta creación solo será activada si alcanza su meta antes de la fecha límite.
                  </div>
                </div>
              </div>

              {/* Project Creator Card */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Creación Por</h3>
                <div className="text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">IMG</span>
                  </div>
                  <div className="text-white font-medium mb-1">{project.applicant_name ?? "Nombre del Creador"}</div>
                  <div className="text-gray-400 text-sm mb-3">
                    {(() => {
                      const createdDate = project.created_at ? new Date(project.created_at) : new Date();
                      const now = new Date();
                      const currentMonth = now.getMonth();
                      const currentYear = now.getFullYear();
                      const projectMonth = createdDate.getMonth();
                      const projectYear = createdDate.getFullYear();

                      if (projectMonth === currentMonth && projectYear === currentYear) {
                        return "Creado recientemente";
                      } else {
                        const monthNames = [
                          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                        ];
                        return `${monthNames[projectMonth]} ${projectYear}`;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky section - Tokenomics & Offers (from here down) */}
            <div className="sticky top-6 space-y-6">
              {/* Utility Protocol */}
              {project.total_tokens && project.tokens_offered && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Puzzle className="w-5 h-5 text-lime-400" /> {(() => {
                      const category = project.business_category;
                      if (!category) return "Protocolo de Utilidad";

                      // Convertir snake_case a Title Case
                      return category
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                    })()}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Supply Total</span>
                      <span className="text-white font-mono">{project.total_tokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tokens Ofrecidos</span>
                      <span className="text-white font-mono">{project.tokens_offered.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Meta de Tokens</span>
                      <span className="text-lime-400 font-mono">{targetAmount.toLocaleString()}</span>
                    </div>
                    {project.token_price_usd && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Costo de Acceso</span>
                        <span className="text-lime-400 font-mono">${Number(project.token_price_usd).toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Utility Offers Panel */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-blue-400" /> Ofertas de Utilidad
                </h3>
                <div className="space-y-4">
                  {/* Token Offer 1 */}
                  <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">Fase de Comunidad Inicial</h4>
                        <p className="text-gray-400 text-sm">Mínimo 10,000 tokens</p>
                      </div>
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Activa</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Valor:</span>
                      <span className="text-lime-400 font-mono">$0.0003</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Disponibles:</span>
                      <span className="text-white font-mono">500,000</span>
                    </div>
                    <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
                      Participar
                    </button>
                  </div>

                  {/* Token Offer 2 */}
                  <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-medium">Fase de Expansión</h4>
                        <p className="text-gray-400 text-sm">Mínimo 1,000 tokens</p>
                      </div>
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">Próxima</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Valor:</span>
                      <span className="text-lime-400 font-mono">$0.0005</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Disponibles:</span>
                      <span className="text-white font-mono">1,000,000</span>
                    </div>
                    <button className="w-full mt-3 bg-zinc-700 text-gray-400 py-2 px-4 rounded-lg text-sm font-medium cursor-not-allowed">
                      Próximamente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area (Left side) */}
          <div className="lg:mr-80 xl:mr-80 2xl:mr-80">
            {/* Project Title and Description */}
            <div className="mb-8">
              <p className="text-sm text-gray-400 mb-2">{project.business_category ?? "Sin Categoría"}</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {project.title}
              </h1>
              <p className="text-gray-300 text-lg">
                {project.tagline ?? "Insert short project description"}
              </p>
            </div>

            {/* Video Section */}
            {project.video_pitch && (
              <div className="mb-8">
                <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden">
                  {(() => {
                    console.log('🎥 ProjectPage: Processing video URL:', project.video_pitch);
                    let embedUrl = '';

                    if (project.video_pitch.includes('youtube.com') || project.video_pitch.includes('youtu.be')) {
                      console.log('🎥 ProjectPage: Detected YouTube URL');
                      let videoId = '';
                      if (project.video_pitch.includes('youtube.com')) {
                        const vParam = project.video_pitch.split('v=')[1];
                        videoId = vParam?.split('&')[0] ?? '';
                        console.log('🎥 ProjectPage: YouTube video ID from youtube.com:', videoId);
                      } else if (project.video_pitch.includes('youtu.be/')) {
                        const pathSegment = project.video_pitch.split('/').pop();
                        videoId = pathSegment?.split('?')[0] ?? '';
                        console.log('🎥 ProjectPage: YouTube video ID from youtu.be:', videoId);
                      }

                      if (videoId && videoId.length > 0) {
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                        console.log('🎥 ProjectPage: Generated YouTube embed URL:', embedUrl);
                      }
                    } else if (project.video_pitch.includes('vimeo.com')) {
                      console.log('🎥 ProjectPage: Detected Vimeo URL');
                      const videoId = project.video_pitch.split('/').pop();
                      if (videoId) {
                        embedUrl = `https://player.vimeo.com/video/${videoId}`;
                        console.log('🎥 ProjectPage: Generated Vimeo embed URL:', embedUrl);
                      }
                    }

                    if (embedUrl) {
                      return (
                        <iframe
                          src={embedUrl}
                          title={`${project.title} Video Pitch`}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      );
                    } else {
                      console.log('🎥 ProjectPage: No valid embed URL generated, showing fallback');
                      return (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-gray-400 mb-2">URL del video inválida</p>
                            <p className="text-xs text-gray-500">URL recibida: {project.video_pitch}</p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Project Navigation Component */}
            <ProjectNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Dynamic Project Content */}
            <ProjectContent activeTab={activeTab} project={project} />

            {/* Additional Dynamic Sections */}
            <div className="space-y-8">
              {/* Utility Protocol Details */}
              {(project.total_tokens ?? project.estimated_apy ?? project.yield_source) && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Puzzle className="w-5 h-5 text-lime-400" /> Detalles del Protocolo de Utilidad
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.total_tokens && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Supply Total</h4>
                        <p className="text-lime-400 text-xl font-mono">{Number(project.total_tokens).toLocaleString()}</p>
                        <p className="text-zinc-400 text-sm">Tokens disponibles en total</p>
                      </div>
                    )}
                    {project.estimated_apy && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Recompensa Estimada</h4>
                        <p className="text-lime-400 text-xl font-mono">{project.estimated_apy}%</p>
                        <p className="text-zinc-400 text-sm">Rendimiento anual estimado</p>
                      </div>
                    )}
                    {project.yield_source && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Fuente de Recompensas</h4>
                        <p className="text-white">{project.yield_source}</p>
                        <p className="text-zinc-400 text-sm">Cómo se generan las recompensas</p>
                      </div>
                    )}
                    {project.fund_usage && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Uso de Recursos</h4>
                        <p className="text-white text-sm">{project.fund_usage}</p>
                        <p className="text-zinc-400 text-sm">Cómo se utilizarán los fondos</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Parameters */}
              {(project.is_mintable !== null || project.is_mutable !== null || project.contract_address) && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Code className="w-5 h-5 text-lime-400" /> Parámetros Técnicos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.contract_address && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Dirección del Contrato</h4>
                        <p className="text-lime-400 text-sm font-mono break-all">{project.contract_address}</p>
                        <p className="text-zinc-400 text-sm">Contrato inteligente desplegado</p>
                      </div>
                    )}
                    {project.treasury_address && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Tesorería</h4>
                        <p className="text-lime-400 text-sm font-mono break-all">{project.treasury_address}</p>
                        <p className="text-zinc-400 text-sm">Dirección donde se reciben los fondos</p>
                      </div>
                    )}
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Contrato Acuñable</h4>
                      <p className="text-white">{project.is_mintable ? 'Sí' : 'No'}</p>
                      <p className="text-zinc-400 text-sm">Puede crear más tokens después del lanzamiento</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2">Metadatos Mutables</h4>
                      <p className="text-white">{project.is_mutable ? 'Sí' : 'No'}</p>
                      <p className="text-zinc-400 text-sm">Los metadatos pueden modificarse</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transparency & Legal */}
              {(project.legal_status ?? project.fiduciary_entity ?? project.valuation_document_url ?? project.due_diligence_report_url) && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-lime-400" /> Transparencia y Legal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.legal_status && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Estatus Legal</h4>
                        <p className="text-white">{project.legal_status}</p>
                        <p className="text-zinc-400 text-sm">Jurisdicción y estructura legal</p>
                      </div>
                    )}
                    {project.fiduciary_entity && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Entidad Fiduciaria</h4>
                        <p className="text-white">{project.fiduciary_entity}</p>
                        <p className="text-zinc-400 text-sm">Custodia de activos del mundo real</p>
                      </div>
                    )}
                    {project.valuation_document_url && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Documento de Valuación</h4>
                        <a href={project.valuation_document_url} target="_blank" rel="noopener noreferrer"
                           className="text-lime-400 hover:text-lime-300 underline text-sm">
                          Ver documento →
                        </a>
                        <p className="text-zinc-400 text-sm">Análisis de valuación del proyecto</p>
                      </div>
                    )}
                    {project.due_diligence_report_url && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Reporte de Due Diligence</h4>
                        <a href={project.due_diligence_report_url} target="_blank" rel="noopener noreferrer"
                           className="text-lime-400 hover:text-lime-300 underline text-sm">
                          Ver reporte →
                        </a>
                        <p className="text-zinc-400 text-sm">Análisis de riesgos y validación</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Creator Information */}
              {(project.applicant_name ?? project.applicant_position ?? project.applicant_email) && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-lime-400" /> Información del Creador
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.applicant_name && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Nombre</h4>
                        <p className="text-white">{project.applicant_name}</p>
                        <p className="text-zinc-400 text-sm">Persona responsable del proyecto</p>
                      </div>
                    )}
                    {project.applicant_position && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Rol</h4>
                        <p className="text-white">{project.applicant_position}</p>
                        <p className="text-zinc-400 text-sm">Posición en el proyecto</p>
                      </div>
                    )}
                    {project.applicant_email && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Contacto</h4>
                        <a href={`mailto:${project.applicant_email}`}
                           className="text-lime-400 hover:text-lime-300 underline">
                          {project.applicant_email}
                        </a>
                        <p className="text-zinc-400 text-sm">Email para contacto directo</p>
                      </div>
                    )}
                    {project.applicant_phone && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Teléfono</h4>
                        <p className="text-white">{project.applicant_phone}</p>
                        <p className="text-zinc-400 text-sm">Contacto urgente</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Token Distribution */}
              {(() => {
                const tokenDist = safeJsonParse(project.token_distribution as string | null, {});
                const hasDistribution = Object.values(tokenDist).some((value: unknown) => {
                  const numValue = Number(value);
                  return numValue && numValue > 0;
                });
                return hasDistribution ? (
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-lime-400" /> Distribución de Tokens
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(tokenDist).map(([key, value]: [string, unknown]) => {
                        const numValue = Number(value);
                        if (!numValue || numValue <= 0) return null;
                        const percentage = numValue;
                        const labels: Record<string, string> = {
                          communitySale: 'Venta Comunidad',
                          teamFounders: 'Equipo/Fundadores',
                          treasury: 'Tesorería',
                          marketing: 'Marketing'
                        };
                        return (
                          <div key={key} className="bg-zinc-800/50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-lime-400 mb-1">{percentage}%</div>
                            <div className="text-white text-sm">{labels[key] ?? key}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Empty State for Missing Information */}
              {!project.total_tokens && !project.estimated_apy && !project.yield_source &&
               !project.contract_address && !project.treasury_address &&
               !project.legal_status && !project.fiduciary_entity &&
               !project.applicant_name && !project.applicant_position && !project.applicant_email && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <div className="text-center py-8">
                    <Puzzle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Información Adicional No Disponible</h3>
                    <p className="text-zinc-400">
                      Esta creación aún no ha completado toda su información detallada.
                      Los detalles técnicos y de transparencia se mostrarán aquí cuando estén disponibles.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Mobile Investment Card - Show only on mobile */}
          <div className="lg:hidden mb-8">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-white mb-2">
                  US ${raisedAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400 mb-4">
                  participantes de {targetAmount.toLocaleString()} meta
                </div>

                <div className="w-full bg-zinc-800 rounded-full h-3 mb-4">
                  <div
                    className="bg-lime-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(raisedPercentage, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm mb-6">
                  <span className="text-gray-400">1,000 participantes</span>
                  <span className="text-gray-400">30 días restantes</span>
                </div>

                <button className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 px-6 rounded-lg transition-colors mb-4">
                  GET THE NFT
                </button>

                <div className="flex justify-center gap-3 mb-4">
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18.303 4.742a1 1 0 011.414 0l.707.707a1 1 0 010 1.414l-6.01 6.01a1 1 0 01-1.414 0l-3.536-3.536a1 1 0 010-1.414l.707-.707a1 1 0 011.414 0L14.95 10.05l5.353-5.308z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="text-xs text-gray-400">
                  All or nothing. This project will only be funded if it reaches its goal by Sat, October 31 2020 11:59 PM UTC +00:00.
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Recommended Projects Section */}
        <RecommendedProjectsSection currentProjectSlug={currentSlug} />
      </div>
    </div>
  );
}

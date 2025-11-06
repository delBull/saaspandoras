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
  Briefcase,
  Star,
  ExternalLink,
  Globe
} from "lucide-react";
import type { ProjectData } from "../types";

// Helper para parsear JSON de forma segura
function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return defaultValue;
  }
}

// --- COMPONENTES MODULARES PARA EL NUEVO ENFOQUE DE UTILITY ---

// 1. Cabecera del Proyecto (Hero Section)
const ProjectHeader = ({ project }: { project: ProjectData }) => {
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
};



// 3. Contenido Dinámico por Tabs (Mecánica, Sostenibilidad, Transparencia)
interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const ProjectContentTabs = ({ project }: { project: ProjectData }) => {
  // Parsear el estimated_apy JSON para mostrar la tabla de recompensas
  let rewardsStructure;
  try {
    rewardsStructure = safeJsonParse(project.estimated_apy as string | null, {});
  } catch {
    rewardsStructure = {};
  }

  const tabs: Tab[] = [
    // --- TAB 0: CAMPAÑA (La Presentación) ---
    {
      id: 'campaign',
      label: 'Campaña',
      icon: Star,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Descripción del Proyecto" icon={Star}>
            <p className="text-zinc-300 whitespace-pre-line text-lg leading-relaxed">
              {project.description ?? 'No hay descripción disponible para este proyecto.'}
            </p>
          </SectionCard>

          {(() => {
            // Acceso seguro a propiedades opcionales
            const projectObj = project as unknown as Record<string, unknown>;
            const hasLinks = projectObj.website_url || projectObj.whitepaper_url || projectObj.twitter_url || projectObj.discord_url || projectObj.telegram_url || projectObj.video_pitch;

            return hasLinks ? (
              <SectionCard title="Enlaces y Recursos" icon={ExternalLink}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Website */}
                  {typeof projectObj.website_url === 'string' && projectObj.website_url && (
                    <a
                      href={projectObj.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <Globe className="w-5 h-5 text-lime-400 group-hover:text-lime-300" />
                      <div>
                        <p className="text-white font-medium">Sitio Web</p>
                        <p className="text-zinc-400 text-sm">Visitar website oficial</p>
                      </div>
                    </a>
                  )}

                  {/* Whitepaper/Litepaper */}
                  {typeof projectObj.whitepaper_url === 'string' && projectObj.whitepaper_url && (
                    <a
                      href={projectObj.whitepaper_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <div>
                        <p className="text-white font-medium">Whitepaper</p>
                        <p className="text-zinc-400 text-sm">Documentación técnica</p>
                      </div>
                    </a>
                  )}

                  {/* Twitter */}
                  {typeof projectObj.twitter_url === 'string' && projectObj.twitter_url && (
                    <a
                      href={projectObj.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium">Twitter</p>
                        <p className="text-zinc-400 text-sm">Síguenos en Twitter</p>
                      </div>
                    </a>
                  )}

                  {/* Discord */}
                  {typeof projectObj.discord_url === 'string' && projectObj.discord_url && (
                    <a
                      href={projectObj.discord_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium">Discord</p>
                        <p className="text-zinc-400 text-sm">Únete a la comunidad</p>
                      </div>
                    </a>
                  )}

                  {/* Telegram */}
                  {typeof projectObj.telegram_url === 'string' && projectObj.telegram_url && (
                    <a
                      href={projectObj.telegram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium">Telegram</p>
                        <p className="text-zinc-400 text-sm">Canal oficial</p>
                      </div>
                    </a>
                  )}

                  {/* Video Pitch - si existe */}
                  {typeof projectObj.video_pitch === 'string' && projectObj.video_pitch && (
                    <button
                      onClick={() => {
                        // Scroll to video section
                        const videoSection = document.querySelector('[data-video-section]');
                        videoSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-3 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors group text-left"
                    >
                      <svg className="w-5 h-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <div>
                        <p className="text-white font-medium">Video Pitch</p>
                        <p className="text-zinc-400 text-sm">Ver presentación del proyecto</p>
                      </div>
                    </button>
                  )}
                </div>
              </SectionCard>
            ) : null;
          })()}
        </div>
      ),
    },
    // --- TAB 1: MECÁNICA DE UTILIDAD ---
    {
      id: 'utility',
      label: 'Mecánica de Utilidad',
      icon: Puzzle,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Estructura de Recompensa Recurrente" icon={Star}>
            {Object.keys(rewardsStructure).length > 0 ? (
              <ul className="space-y-3">
                {Object.entries(rewardsStructure).map(([type, value]) => (
                  <li key={type} className="p-3 bg-zinc-700/50 rounded-lg">
                    <p className="font-semibold text-white">{type.toUpperCase().replace(/_/g, ' ')}</p>
                    <p className="text-lime-400">{String(value)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-400">No hay recompensas recurrentes definidas en esta Creación.</p>
            )}
          </SectionCard>

          <SectionCard title="Mecanismo de Recompensa (Labor/Work-to-Earn)" icon={Briefcase}>
            <p className="text-zinc-300 whitespace-pre-line">{project.applicant_name ?? 'No especificado'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Esta información define qué acciones son validadas como contribución a la Creación.
            </p>
          </SectionCard>
        </div>
      ),
    },
    // --- TAB 2: ESTRATEGIA Y SOSTENIBILIDAD (El Plan de Negocio) ---
    {
      id: 'strategy',
      label: 'Estrategia y Sostenibilidad',
      icon: Shield,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Sostenibilidad de la Utilidad a Largo Plazo" icon={Globe}>
            <p className="text-zinc-300 whitespace-pre-line">{project.lockup_period ?? 'No especificada'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Detalla el roadmap de utilidad para mantener el valor de acceso.
            </p>
          </SectionCard>

          <SectionCard title="Modelo de Monetización (Ingresos del Protocolo)" icon={ExternalLink}>
            <p className="text-zinc-300 whitespace-pre-line">{project.fiduciary_entity ?? 'No especificado'}</p>
            <p className="mt-4 text-sm text-lime-400">
              *Este modelo financia la utilidad recurrente.
            </p>
          </SectionCard>

          <SectionCard title="Estrategia de Adopción (Go-To-Market)" icon={Star}>
            <p className="text-zinc-300 whitespace-pre-line">{project.valuation_document_url ?? 'No especificada'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Detalla el plan inicial de distribución de Artefactos (Airdrop, Venta Fija, Mérito).
            </p>
          </SectionCard>

          <SectionCard title="Planes de Integración Tecnológica" icon={Code}>
            <p className="text-zinc-300 whitespace-pre-line">{project.is_mintable ? 'Sí, integraremos con Discord para verificar la tenencia del Artefacto y con Shopify para aplicar descuentos automáticos en mercancía.' : 'No especificados'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Integraciones con Discord, e-commerce, o servicios Web3 que amplían el uso.
            </p>
          </SectionCard>
        </div>
      ),
    },
    // --- TAB 3: TRANSPARENCIA Y LEGAL (La Confianza) ---
    {
      id: 'compliance',
      label: 'Transparencia y Legal',
      icon: Shield,
      content: (
        <div className="space-y-8 mb-8">
          <SectionCard title="Estatus Legal y Jurisdicción" icon={Briefcase}>
            <p className="text-zinc-300">Estatus: <span className="font-semibold text-white">{project.legal_status ?? 'No especificado'}</span></p>
          </SectionCard>

          <SectionCard title="Mitigación de Riesgo Operativo y Fraude" icon={Shield}>
            <p className="text-zinc-300 whitespace-pre-line">{project.due_diligence_report_url ?? 'No especificada'}</p>
            <p className="mt-4 text-sm text-zinc-400">
              *Plan del Creador para manejar el fraude interno y el riesgo de uso de la comunidad.
            </p>
          </SectionCard>

          <SectionCard title="Parámetros de Contrato (Smart Contract)" icon={Code}>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li><span className="font-semibold text-white">Tipo de Artefacto:</span> {project.token_type ?? 'ERC-721'}</li>
              <li><span className="font-semibold text-white">Mutabilidad de Reglas:</span> {project.is_mutable ? 'Mutable (Las reglas pueden actualizarse)' : 'Inmutable (Reglas fijas)'}</li>
              <li><span className="font-semibold text-white">Dirección de Autoridad:</span> {project.update_authority_address ?? project.contract_address ?? 'No especificada'}</li>
            </ul>
          </SectionCard>

          <SectionCard title="Información del Creador" icon={Crown}>
            <p className="text-zinc-300"><span className="font-semibold text-white">Nombre del Solicitante:</span> {project.applicant_name ?? 'No especificado'}</p>
            <p className="text-zinc-300"><span className="font-semibold text-white">Posición:</span> {project.applicant_position ?? 'No especificada'}</p>
          </SectionCard>
        </div>
      ),
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id ?? 'utility');
  const activeTabData = tabs.find(t => t.id === activeTab);
  const activeContent = activeTabData?.content;

  return (
    <div className="mt-12">
      {/* Navigación de Tabs */}
      <div className="flex border-b border-zinc-700/50 mb-8 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 text-sm md:text-md font-semibold flex items-center gap-2 transition-colors duration-200
              ${activeTab === tab.id
                ? 'text-lime-400 border-b-2 border-lime-400'
                : 'text-zinc-400 hover:text-white hover:border-b-2 hover:border-zinc-500'
              }
            `}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido Activo */}
      <div>
        {activeContent}
      </div>
    </div>
  );
};

// Componente auxiliar para estilizar secciones
const SectionCard = ({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: React.ElementType }) => (
  <div className="p-6 bg-zinc-800 rounded-xl border border-zinc-700/50">
    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
      <Icon className="w-5 h-5 text-lime-400" />
      {title}
    </h3>
    <div className="text-zinc-300 space-y-3">
      {children}
    </div>
  </div>
);

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

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
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
            {/* Project Header Component */}
            <ProjectHeader project={project} />

            {/* Video Section */}
            {project.video_pitch && (
              <div className="mb-8" data-video-section>
                <div className="aspect-video bg-zinc-900 rounded-xl overflow-hidden">
                  {(() => {
                    console.log('🎥 ProjectPage: Processing video URL:', project.video_pitch);
                    let embedUrl = '';

                    if (project.video_pitch && (project.video_pitch.includes('youtube.com') || project.video_pitch.includes('youtu.be'))) {
                      console.log('🎥 ProjectPage: Detected YouTube URL');
                      let videoId = '';
                      if (project.video_pitch.includes('youtube.com')) {
                        const vParam = project.video_pitch.split('v=')?.[1];
                        videoId = vParam?.split('&')?.[0] ?? '';
                        console.log('🎥 ProjectPage: YouTube video ID from youtube.com:', videoId);
                      } else if (project.video_pitch.includes('youtu.be/')) {
                        const pathSegment = project.video_pitch.split('/')?.pop();
                        videoId = pathSegment?.split('?')?.[0] ?? '';
                        console.log('🎥 ProjectPage: YouTube video ID from youtu.be:', videoId);
                      }

                      if (videoId && videoId.length > 0) {
                        embedUrl = `https://www.youtube.com/embed/${videoId}`;
                        console.log('🎥 ProjectPage: Generated YouTube embed URL:', embedUrl);
                      }
                    } else if (project.video_pitch && project.video_pitch.includes('vimeo.com')) {
                      console.log('🎥 ProjectPage: Detected Vimeo URL');
                      const videoId = project.video_pitch.split('/')?.pop();
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

            {/* New Utility-Focused Content Tabs */}
            <ProjectContentTabs project={project} />

            {/* Additional Dynamic Sections */}
            <div className="space-y-8">
              {/* Utility Protocol Details */}
              {(project.total_tokens ?? project.estimated_apy ?? project.yield_source ?? project.fund_usage ?? project.lockup_period) && (
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
                        <h4 className="font-semibold text-white mb-2">Mecánica del Protocolo</h4>
                        <p className="text-white text-sm">{project.fund_usage}</p>
                        <p className="text-zinc-400 text-sm">Regla fundamental de valor para holders</p>
                      </div>
                    )}
                    {project.lockup_period && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Utilidad Continua</h4>
                        <p className="text-white text-sm">{project.lockup_period}</p>
                        <p className="text-zinc-400 text-sm">Plan para mantener valor a largo plazo</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recurring Rewards Structure */}
              {(project.recurring_rewards ??
                project.staking_rewards_enabled ??
                project.revenue_sharing_enabled ??
                project.work_to_earn_enabled ??
                project.tiered_access_enabled ??
                project.discounted_fees_enabled) && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-lime-400" /> Estructura de Recompensa Recurrente
                  </h3>
                  <div className="space-y-4">
                    {project.recurring_rewards && (
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">Descripción General</h4>
                        <p className="text-white text-sm">{project.recurring_rewards}</p>
                        <p className="text-zinc-400 text-sm">Cómo se traducirá la utilidad en valor recurrente</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.staking_rewards_enabled && (
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <h4 className="font-semibold text-lime-400 mb-2">🏦 Staking Rewards</h4>
                          {project.staking_rewards_details && (
                            <p className="text-white text-sm">{project.staking_rewards_details}</p>
                          )}
                        </div>
                      )}
                      {project.revenue_sharing_enabled && (
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <h4 className="font-semibold text-lime-400 mb-2">💰 Revenue Sharing</h4>
                          {project.revenue_sharing_details && (
                            <p className="text-white text-sm">{project.revenue_sharing_details}</p>
                          )}
                        </div>
                      )}
                      {project.work_to_earn_enabled && (
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <h4 className="font-semibold text-lime-400 mb-2">⚡ Work-to-Earn</h4>
                          {project.work_to_earn_details && (
                            <p className="text-white text-sm">{project.work_to_earn_details}</p>
                          )}
                        </div>
                      )}
                      {project.tiered_access_enabled && (
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <h4 className="font-semibold text-lime-400 mb-2">🏆 Tiered Access</h4>
                          {project.tiered_access_details && (
                            <p className="text-white text-sm">{project.tiered_access_details}</p>
                          )}
                        </div>
                      )}
                      {project.discounted_fees_enabled && (
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <h4 className="font-semibold text-lime-400 mb-2">💎 Discounted Fees</h4>
                          {project.discounted_fees_details && (
                            <p className="text-white text-sm">{project.discounted_fees_details}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations */}
              {project.integration_details && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Code className="w-5 h-5 text-lime-400" /> Integraciones y Expansión
                  </h3>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Planes de Integración</h4>
                    <p className="text-white text-sm">{project.integration_details}</p>
                    <p className="text-zinc-400 text-sm">Cómo se conectará con otras plataformas y herramientas</p>
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

"use client";

import { useState, useEffect } from "react";
import { Button } from "@saasfly/ui/button";
import { PlusIcon, EyeIcon, ArrowLeftIcon, ImageIcon, Loader2, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

// Import the multi-step form
import { MultiStepForm } from "../admin/projects/[id]/edit/multi-step-form";

interface Project {
  id: number;
  title: string;
  description: string;
  slug: string;
  createdAt: string;
  status: string;
  coverPhotoUrl?: string | null;
  targetAmount?: string | number | null;
  raisedAmount?: string | number | null;
}

export default function ApplicantsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados para paneles
  const [isPendingPanelCollapsed, setIsPendingPanelCollapsed] = useState(false);
  const [showMobilePendingModal, setShowMobilePendingModal] = useState(false);

  // Fetch pending projects (placeholder - implement API if needed)
  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json() as Project[];
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("No se pudieron cargar los proyectos.");
      } finally {
        setLoading(false);
      }
    }
    void fetchProjects();
  }, [setProjects]);

  const handleApplyClick = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  const pendingProjects = projects.filter(p => p.status === 'pending');
  const approvedProjects = projects.filter(p => ['approved', 'live', 'completed'].includes(p.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen  text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-lime-500" />
          <p className="text-lg text-gray-400">Cargando Proyectos...</p>
        </div>
      </div>
    );
  }

  // --- Project Card Component ---
  // Tarjeta de proyecto (Ajustada para un grid)
  const ProjectCard = ({ project }: { project: Project }) => {
    const targetAmount = Number(project.targetAmount ?? 0);
    const raisedAmount = Number(project.raisedAmount ?? 0);
    const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;

    return (
      <div className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700 hover:border-lime-500/50 transition-all duration-300 group flex flex-col min-w-[300px]">
        <div className="relative h-48 w-full bg-zinc-700">
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
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{project.title}</h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2 h-10 flex-grow">{project.description}</p>
          
          {project.status !== 'pending' && (
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                <span>Recaudado</span>
                <span className="font-semibold text-white">${raisedAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-lime-500 to-emerald-500 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-right text-xs text-gray-400 mt-1">
                Meta: <span className="font-semibold text-white">${targetAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-sm pt-4 border-t border-zinc-700 mt-auto">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {project.status === 'pending' ? 'En Revisión' : 'Aprobado'}
            </span>
            <Link href={`/projects/${project.slug}`} className="flex items-center gap-1 text-lime-400 hover:text-lime-300 font-semibold">
              <EyeIcon className="w-4 h-4" />
              Ver Proyecto
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (showForm) {
    return (
      <div className="min-h-screen text-white">
        {/* Header with Cancel Button */}
        <div className="sticky top-0 z-10 flex items-center p-6 backdrop-blur">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-gray-400 hover:text-white hover:bg-zinc-700 mr-4 p-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Cancelar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Crear Nuevo Proyecto</h1>
            <p className="text-gray-400">Completa el formulario multi-step para enviar tu aplicación</p>
          </div>
        </div>

        {/* Form Content - Matching Admin Layout */}
        <section className="py-12 md:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-900/60 rounded-2xl p-6 md:p-8 border border-lime-400/20">
              <MultiStepForm
                project={null}
                isEdit={false}
                apiEndpoint="/api/projects/apply"
                isPublic={true}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      {/* --- AJUSTE DE LAYOUT DE ESCRITORIO --- */}
      <div className="hidden lg:block min-h-screen">

        {/* Fila 1: Header (con padding derecho dinámico) */}
        <div className={`sticky top-0 z-10 flex justify-between items-center px-6 py-6 gap-8 w-full transition-all duration-500 ease-in-out ${isPendingPanelCollapsed ? 'pr-16' : 'pr-[320px]'}`}>
          <div className="flex-row items-center gap-8">
            <h1 className="text-3xl font-bold text-white">Aplicantes</h1>
            <p className="text-gray-400 text-base">Proyectos aprobados listos para invertir</p>
          </div>
          <Button
            onClick={handleApplyClick}
            size="default"
            className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold px-6 py-3 shadow-lg flex-shrink-0 text-base whitespace-nowrap"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Aplicar Nuevo Proyecto
          </Button>
        </div>

        {/* Fila 2: Proyectos Aprobados (con padding derecho dinámico) */}
        <div className={`w-full px-8 py-8 transition-all duration-500 ease-in-out ${isPendingPanelCollapsed ? 'pr-16' : 'pr-[320px]'}`}>
          
          {/* Contenido - Proyectos Aprobados */}
          {approvedProjects.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-gray-400 text-xl">Aún no hay proyectos aprobados.</p>
              <p className="text-gray-500 text-lg mt-2">Vuelve pronto para ver nuevas oportunidades de inversión.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {approvedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel Derecho (Restaurado) - Proyectos en Revisión */}
      <div className={`hidden lg:flex fixed right-0 top-0 h-screen bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 transition-all duration-500 ease-in-out z-20 overflow-hidden flex-col ${isPendingPanelCollapsed ? 'w-16' : 'w-1/5 min-w-[280px] max-w-[320px]'}`}>

        {/* Panel Header (Sticky) */}
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800/50 p-4 flex-shrink-0">
          <div className={`flex items-center justify-between ${isPendingPanelCollapsed ? 'justify-center' : ''}`}>
            {!isPendingPanelCollapsed && (
              <h3 className="text-lg font-bold text-white">En Revisión</h3>
            )}
            <button
              onClick={() => setIsPendingPanelCollapsed(!isPendingPanelCollapsed)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors group"
              title={isPendingPanelCollapsed ? "Expandir panel" : "Colapsar panel"}
            >
              {isPendingPanelCollapsed ? (
                <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
              ) : (
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
              )}
            </button>
          </div>
          {!isPendingPanelCollapsed && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                {pendingProjects.length} proyectos
              </span>
            </div>
          )}
        </div>

        {/* Panel Content (Scrollable) */}
        <div className={`h-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent ${isPendingPanelCollapsed ? 'hidden' : ''}`}>
          <div className="p-4 space-y-4">
            {pendingProjects.length === 0 ? (
              <div className="text-center py-8 bg-zinc-800/30 rounded-xl border-2 border-dashed border-zinc-700">
                <EyeIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No hay proyectos en revisión</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingProjects.map((project) => (
                  <div key={project.id} className="group">
                    <Link href={`/projects/${project.slug}`}>
                      <div className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer">
                        <div className="relative h-32 bg-zinc-700">
                          {project.coverPhotoUrl ? (
                            <Image
                              src={project.coverPhotoUrl}
                              alt={`Cover photo for ${project.title}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-zinc-500" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-500/90 text-black rounded-full">
                              Pendiente
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-white text-sm mb-1 line-clamp-2">{project.title}</h4>
                          <p className="text-gray-400 text-xs mb-3 line-clamp-2">{project.description}</p>
                          <div className="flex items-center text-xs text-lime-400">
                            <EyeIcon className="w-3 h-3 mr-1" />
                            Ver detalles
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="lg:hidden min-h-screen text-white">
        {/* Header (Ajustado) */}
        <div className="sticky top-0 z-20 flex justify-between items-center px-4 py-6 gap-6 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">Aplicantes</h1>
            <p className="text-gray-400 text-sm truncate">Proyectos aprobados listo para invertir</p>
          </div>
          <Button
            onClick={handleApplyClick}
            size="sm"
            className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold shadow-lg flex-shrink-0 text-sm whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Aplicar
          </Button>
        </div>

        {/* Mobile Button for pending projects */}
        <div className="px-4 py-6">
          <button
            onClick={() => setShowMobilePendingModal(true)}
            className="w-full flex items-center justify-center px-3 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            {pendingProjects.length > 0
              ? `Ver ${pendingProjects.length} Proyectos en Revisión`
              : 'Proyectos de Revisión'}
          </button>
        </div>

        {/* Mobile Main Content - Approved Projects */}
        <div className="px-4 py-8">
          {approvedProjects.length === 0 ? (
            <div className="text-center py-16">
              <Sparkles className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Aún no hay proyectos aprobados.</p>
              <p className="text-gray-500 text-base mt-2">Sé el primero en aplicar con tu proyecto</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {approvedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Modal for Pending Projects (Sin cambios) */}
        {showMobilePendingModal && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMobilePendingModal(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl min-h-[90vh] overflow-hidden border-t border-zinc-800">
              <div className="flex items-center justify-between p-6">
                <h3 className="text-xl font-bold text-white">Proyectos en Revisión</h3>
                <button
                  onClick={() => setShowMobilePendingModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-81px)] p-6 pt-2">
                {pendingProjects.length === 0 ? (
                  <div className="text-center py-8 bg-zinc-800/30 rounded-xl border-2 border-dashed border-zinc-700">
                    <EyeIcon className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                    <p className="text-gray-400">No hay proyectos en revisión</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingProjects.map((project) => (
                      <div key={project.id} className="group">
                        <Link href={`/projects/${project.slug}`}>
                          <div className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer">
                            <div className="relative h-32 bg-zinc-700">
                              {project.coverPhotoUrl ? (
                                <Image
                                  src={project.coverPhotoUrl}
                                  alt={`Cover photo for ${project.title}`}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-zinc-500" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-500/90 text-black rounded-full">
                                  Pendiente
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h4 className="font-bold text-white text-base mb-2 line-clamp-2">{project.title}</h4>
                              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>
                              <div className="flex items-center text-sm text-lime-400">
                                <EyeIcon className="w-4 h-4 mr-2" />
                                Ver detalles
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

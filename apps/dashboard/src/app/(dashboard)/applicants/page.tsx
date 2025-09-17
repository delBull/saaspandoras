"use client";

import { useState, useEffect } from "react";
import { Button } from "@saasfly/ui/button";
import { PlusIcon, EyeIcon, ArrowLeftIcon, ImageIcon, Loader2 } from "lucide-react";
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
  }, []);

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
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-lime-500" />
          <p className="text-lg text-gray-400">Cargando Proyectos...</p>
        </div>
      </div>
    );
  }

  // --- Project Card Component ---
  const ProjectCard = ({ project }: { project: Project }) => {
    const targetAmount = Number(project.targetAmount ?? 0);
    const raisedAmount = Number(project.raisedAmount ?? 0);
    const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;

    return (
      <div className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700 hover:border-lime-500/50 transition-all duration-300 group flex flex-col">
        <div className="relative h-40 bg-zinc-700">
          {project.coverPhotoUrl ? (
            <Image
              src={project.coverPhotoUrl}
              alt={`Cover photo for ${project.title}`}
              layout="fill"
              objectFit="cover"
              className="group-hover:scale-105 transition-transform duration-300"
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
      <div className="min-h-screen bg-zinc-900 text-white">
        {/* Header with Cancel Button */}
        <div className="sticky top-0 z-10 flex items-center p-6 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
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
            <div className="bg-zinc-900/80 rounded-2xl p-6 md:p-8 border border-lime-400/20">
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
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header with Apply Button */}
      <div className="sticky top-0 z-10 flex justify-between items-center p-6 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold">Aplicantes</h1>
          <p className="text-gray-400 mt-1">Proyectos en revisión y opción para aplicar nuevo</p>
        </div>
        <Button
          onClick={handleApplyClick}
          size="lg"
          className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-black font-bold px-6 shadow-lg"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Aplicar Nuevo Proyecto
        </Button>
      </div>

      {/* Projects List */}
      <div className="p-6 space-y-12">
        {/* Proyectos en Revisión */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">En Revisión</h2>
          {pendingProjects.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800/30 rounded-lg border-2 border-dashed border-zinc-700">
              <p className="text-gray-400 text-lg">No hay proyectos en revisión actualmente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Proyectos Aprobados */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">Aprobados y Listos para Inversión</h2>
          {approvedProjects.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800/30 rounded-lg border-2 border-dashed border-zinc-700">
              <p className="text-gray-400 text-lg">Aún no hay proyectos aprobados.</p>
              <p className="text-gray-500 text-sm">Vuelve pronto para ver nuevas oportunidades de inversión.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {projects.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl mb-4">¡Aún no hay proyectos en la plataforma!</p>
            <p className="text-gray-500">Usa el botón de &quot;Aplicar Nuevo Proyecto&quot; para ser el primero.</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@saasfly/ui/button";
import { PlusIcon, EyeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Import the multi-step form
import { MultiStepForm } from "../admin/projects/[id]/edit/multi-step-form";

interface Project {
  id: number;
  title: string;
  description: string;
  slug: string;
  createdAt: string;
  status: string;
}

export default function ApplicantsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch pending projects (placeholder - implement API if needed)
  useEffect(() => {
    // TODO: Fetch from /api/projects?status=pending when API exists
    setProjects([]); // Placeholder
    setLoading(false);
  }, []);

  const handleApplyClick = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-8 text-white">Cargando proyectos...</div>;
  }

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
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No hay proyectos en revisión aún.</p>
            <p className="text-gray-500">¡Usa el botón de arriba para ser el primero en aplicar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 hover:border-lime-500/50 transition-all duration-200">
                <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">{project.title}</h3>
                <p className="text-gray-400 mb-4 line-clamp-3">{project.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">Pendiente</span>
                  <Link href={`/projects/${project.slug}`} className="flex items-center gap-1 text-lime-400 hover:text-lime-300">
                    <EyeIcon className="w-4 h-4" />
                    Ver Detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

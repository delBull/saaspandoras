'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MultiStepForm } from '@/app/()/admin/projects/[id]/edit/multi-step-form';
import { useActiveAccount } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Basic project interface for filtering
interface BasicProject {
  id: number;
  [key: string]: unknown;
}

export default function EditProjectPage() {
  const [projectData, setProjectData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const account = useActiveAccount();
  const router = useRouter();

  // Get project ID from URL
  const projectId = typeof window !== 'undefined'
    ? window.location.pathname.split('/')[3] // /profile/projects/[id]/edit → [id] is at index 3
    : null;

  useEffect(() => {
    if (!projectId) {
      setError('ID del proyecto no encontrado');
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      if (!account?.address) {
        toast.error('Debes conectar tu wallet para editar proyectos');
        router.push('/profile/projects');
        return;
      }

      try {
        // Get all user projects and filter by ID, since no individual GET endpoint exists
        const response = await fetch(`/api/projects`, {
          headers: {
            'Content-Type': 'application/json',
            'x-thirdweb-address': account.address,
            'x-wallet-address': account.address,
            'x-user-address': account.address,
          }
        });

        if (!response.ok) {
          const data = await response.json() as { message?: string };
          throw new Error(data?.message ?? `Error ${response.status}`);
        }

        const projects = await response.json() as BasicProject[];
        const project = projects.find((p: BasicProject) => p.id === Number(projectId));

        if (!project) {
          throw new Error('Proyecto no encontrado');
        }

        setProjectData(project);
      } catch (err) {
        console.error('Error al cargar proyecto:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        toast.error('No se pudo cargar el proyecto');
      } finally {
        setLoading(false);
      }
    };

    void fetchProject();
  }, [projectId, account?.address, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-xl font-bold text-white mb-4">Error al cargar proyecto</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link href="/profile/projects">
            <button className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-zinc-900 rounded-lg">
              Regresar a Mis Protocolos
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-xl font-bold text-white mb-4">Proyecto no encontrado</h1>
          <p className="text-gray-400 mb-6">El proyecto que intentas editar no existe o no tienes permisos para editarlo.</p>
          <Link href="/profile/projects">
            <button className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-zinc-900 rounded-lg">
              Regresar a Mis Protocolos
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/profile/projects">
              <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
                ← Regresar a Mis Protocolos
              </button>
            </Link>
          </div>

          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
            <MultiStepForm
              project={projectData}
              isEdit={!!projectData}
              isPublic={true}
              apiEndpoint={projectData ? `/api/admin/projects/${projectId}` : "/api/admin/projects"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

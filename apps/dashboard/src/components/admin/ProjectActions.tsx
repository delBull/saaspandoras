'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@saasfly/ui/button';
import { toast } from 'sonner';
import { CheckIcon, Loader2, TrashIcon } from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ProjectActionsProps {
  projectId: number;
  currentStatus: string;
}

export function ProjectActions({ projectId, currentStatus }: ProjectActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    setIsLoading(status);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('No se pudo actualizar el estado.');
      }

      toast.success(`Proyecto ${status === 'approved' ? 'aprobado' : 'rechazado'}.`);
      router.refresh(); // Recarga los datos del servidor en la página actual
    } catch (error) {
      toast.error('Error al actualizar el proyecto.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteProject = async () => {
    setIsLoading('delete');
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el proyecto.');
      }

      toast.success('Proyecto eliminado exitosamente.');
      router.refresh();
    } catch (error) {
      toast.error('Error al eliminar el proyecto.');
    } finally {
      setIsLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Status actions for pending projects */}
      {currentStatus === 'pending' && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-green-500 text-green-500 hover:bg-green-900/50 hover:text-green-400"
            onClick={() => handleUpdateStatus('approved')}
            disabled={!!isLoading}
          >
            {isLoading === 'approved' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleUpdateStatus('rejected')}
            disabled={!!isLoading}
          >
            {isLoading === 'rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XMarkIcon className="h-4 w-4" />}
          </Button>
        </>
      )}

      {/* Delete button for all projects */}
      <Button
        size="sm"
        variant="outline"
        className="border-red-500 text-red-500 hover:bg-red-900/50 hover:text-red-400"
        onClick={() => setShowDeleteConfirm(true)}
        disabled={!!isLoading}
      >
        {isLoading === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
      </Button>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Confirmar eliminación</h3>
            <p className="text-gray-300 mb-6">
              ¿Estás seguro que deseas eliminar este proyecto? Esta acción es definitiva y no se podrá revertir.
              Todos los datos asociados al proyecto se perderán permanentemente.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading === 'delete'}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
                disabled={isLoading === 'delete'}
              >
                {isLoading === 'delete' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar proyecto'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

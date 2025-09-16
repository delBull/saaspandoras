'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@saasfly/ui/button';
import { toast } from 'sonner';
import { CheckIcon, Loader2 } from 'lucide-react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ProjectActionsProps {
  projectId: number;
  currentStatus: string;
}

export function ProjectActions({ projectId, currentStatus }: ProjectActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);

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

  if (currentStatus !== 'pending') {
    return null; // No mostrar acciones si ya no está pendiente
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-green-500 text-green-500 hover:bg-green-900/50 hover:text-green-400"
        onClick={() => handleUpdateStatus('approved')}
        disabled={!!isLoading}
      >
        {isLoading === 'approved' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus('rejected')} disabled={!!isLoading}>
        {isLoading === 'rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XMarkIcon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
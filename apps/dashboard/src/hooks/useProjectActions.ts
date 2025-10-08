import type { ProjectStatus } from '@/types/admin';

interface ProjectActionsProps {
  setActionsLoading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function useProjectActions({ setActionsLoading }: ProjectActionsProps) {
  // Function to handle project deletion with confirmation
  const deleteProject = async (projectId: string, projectTitle: string) => {
    const confirmMessage = `¿Eliminar proyecto "${projectTitle}"?\n\nEsta acción NO SE PUEDE deshacer.`;
    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) return;

    const actionKey = `delete-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      console.log('Deleting project:', projectId);
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload page to update the list
        window.location.reload();
        alert('Proyecto eliminado exitosamente');
        console.log('Project deleted successfully');
      } else {
        const errorText = await response.text().catch(() => 'Error desconocido');
        let errorMessage = 'Error desconocido';
        if (errorText) {
          errorMessage = errorText;
        }
        alert(`Error al eliminar el proyecto: ${errorMessage}`);
        console.error('Failed to delete project:', response.status, errorMessage);
      }
    } catch (error) {
      alert('Error de conexión al eliminar el proyecto');
      console.error('Error deleting project:', error);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Function to approve a project
  const approveProject = async (projectId: string, projectTitle: string) => {
    const confirmMessage = `¿Aprobar el proyecto "${projectTitle}"?\n\nEl proyecto pasará al estado "approved" y podrá ir live.`;
    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) return;

    const actionKey = `approve-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        window.location.reload(); // Reload to update the list
        alert('Proyecto aprobado exitosamente');
      } else {
        alert('Error al aprobar el proyecto');
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error approving project:', error);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Function to reject/incomplete a project
  const rejectProject = async (projectId: string, projectTitle: string) => {
    const rejectionType = window.confirm(`Proyecto: "${projectTitle}"\n\n¿Es un "No completado" (continúa aplicando) o "Rechazado" definitivamente?`);

    const newStatus = 'rejected';
    const statusText = 'rechazado';

    const confirmMessage = `¿${statusText} el proyecto "${projectTitle}"?\n\n${
      rejectionType
        ? 'El solicitante tendrá que aplicar nuevamente.'
        : 'El solicitante podrá completar la información faltante.'
    }`;

    if (!window.confirm(confirmMessage)) return;

    const actionKey = `reject-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        window.location.reload(); // Reload to update the list
        alert(`Proyecto ${statusText} exitosamente`);
      } else {
        alert(`Error al ${statusText} el proyecto`);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error rejecting project:', error);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Function to change project status to any valid value (only DB ENUM values)
  const changeProjectStatus = async (projectId: string, projectTitle: string, newStatus: ProjectStatus) => {
    const statusLabels: Record<ProjectStatus, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      live: 'En Vivo',
      completed: 'Completado'
    };

    const confirmMessage = `¿Cambiar el status del proyecto "${projectTitle}" a "${statusLabels[newStatus]}"?`;

    if (!window.confirm(confirmMessage)) return;

    const actionKey = `change-status-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        window.location.reload(); // Reload to update the list
        alert('Status del proyecto actualizado exitosamente');
      } else {
        alert('Error al cambiar el status del proyecto');
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error changing project status:', error);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  return {
    deleteProject,
    approveProject,
    rejectProject,
    changeProjectStatus,
  };
}

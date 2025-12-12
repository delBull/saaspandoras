import { toast } from 'sonner';
import type { ProjectStatus } from '@/types/admin';
import type { DeploymentConfig } from '@/types/deployment';

interface ProjectActionsProps {
  setActionsLoading: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  walletAddress?: string;
  refreshCallback?: () => void | Promise<void>;
}

export function useProjectActions({ setActionsLoading, walletAddress, refreshCallback }: ProjectActionsProps) {
  // Function to handle project deletion with confirmation
  const deleteProject = async (projectId: string, projectTitle: string) => {
    const confirmMessage = `¿Eliminar proyecto "${projectTitle}"?\n\nEsta acción NO SE PUEDE deshacer.`;
    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) return;

    if (!walletAddress) {
      alert('Error: No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.');
      return;
    }

    const actionKey = `delete-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      console.log('Deleting project:', projectId);
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
      });

      if (response.ok) {
        toast.success('Proyecto eliminado exitosamente');
        console.log('Project deleted successfully');
        // Refresh data instead of reloading page
        if (refreshCallback) {
          await refreshCallback();
        }
      } else {
        const errorText = await response.text().catch(() => 'Error desconocido');
        let errorMessage = 'Error desconocido';
        if (errorText) {
          errorMessage = errorText;
        }
        toast.error(`Error al eliminar el proyecto: ${errorMessage}`);
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

    if (!walletAddress) {
      alert('Error: No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.');
      return;
    }

    const actionKey = `approve-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        toast.success('Proyecto aprobado exitosamente');
        // Refresh data instead of reloading page
        if (refreshCallback) {
          await refreshCallback();
        }
      } else {
        toast.error('Error al aprobar el proyecto');
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

    const confirmMessage = `¿${statusText} el proyecto "${projectTitle}"?\n\n${rejectionType
      ? 'El solicitante tendrá que aplicar nuevamente.'
      : 'El solicitante podrá completar la información faltante.'
      }`;

    if (!window.confirm(confirmMessage)) return;

    if (!walletAddress) {
      alert('Error: No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.');
      return;
    }

    const actionKey = `reject-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Proyecto ${statusText} exitosamente`);
        // Refresh data instead of reloading page
        if (refreshCallback) {
          await refreshCallback();
        }
      } else {
        toast.error(`Error al ${statusText} el proyecto`);
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

    if (!walletAddress) {
      alert('Error: No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.');
      return;
    }

    const actionKey = `change-status-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status del proyecto actualizado exitosamente');
        // Refresh data instead of reloading page
        if (refreshCallback) {
          await refreshCallback();
        }
      } else {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('Error response:', response.status, errorText);
        toast.error(`Error al cambiar el status del proyecto: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error changing project status:', error);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Function to transfer project ownership
  const transferProject = async (projectId: string, projectTitle: string, newOwnerWallet: string) => {
    const confirmMessage = `¿Transferir la propiedad del proyecto "${projectTitle}" a la wallet ${newOwnerWallet.substring(0, 8)}...?`;

    if (!window.confirm(confirmMessage)) return;

    if (!walletAddress) {
      alert('Error: No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.');
      return;
    }

    const actionKey = `transfer-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      console.log('🔄 CLIENT: Transfer request - walletAddress:', walletAddress);
      console.log('🔄 CLIENT: Transfer request - newOwnerWallet:', newOwnerWallet);

      const response = await fetch(`/api/admin/projects/${projectId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
        body: JSON.stringify({ newOwnerWallet }),
      });

      console.log('🔄 CLIENT: Transfer response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' })) as { message?: string };
        throw new Error(errorData.message ?? 'No se pudo transferir el proyecto.');
      }

      toast.success('Proyecto transferido exitosamente');
      // Refresh data instead of reloading page
      if (refreshCallback) {
        await refreshCallback();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al transferir el proyecto');
      console.error('Error transferring project:', error);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // ... (existing imports)

  // ...

  // Function to deploy protocol
  const deployProtocol = async (projectId: string, projectTitle: string, projectSlug: string | undefined, config?: DeploymentConfig) => {
    if (!projectSlug) {
      toast.error('Error: El proyecto no tiene un slug válido.');
      return;
    }

    // If config is provided, we assume confirmation happened in the modal. 
    // If not, we show the legacy confirmation (though UI should prevent this).
    if (!config) {
      const confirmMessage = `¿Estás seguro de desplegar el protocolo para "${projectTitle}" sin configuración personalizada?\n\nEsta acción ejecutará transacciones on-chain y es irreversible.`;
      if (!window.confirm(confirmMessage)) return;
    }

    if (!walletAddress) {
      alert('Error: No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.');
      return;
    }

    const actionKey = `deploy-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/deploy-protocol/${projectSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
        body: JSON.stringify({ config }),
      });

      if (response.ok) {
        toast.success('Protocolo desplegado exitosamente 🚀');
        // Refresh data instead of reloading page
        if (refreshCallback) {
          await refreshCallback();
        }
      } else {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('Error response:', response.status, errorText);
        toast.error(`Error al desplegar protocolo: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error deploying protocol:', error);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Function to certify sale
  const certifySale = async (projectId: string, projectTitle: string, projectSlug: string | undefined) => {
    if (!projectSlug) {
      toast.error('Error: El proyecto no tiene un slug válido.');
      return;
    }

    const confirmMessage = `¿Certificar la venta del proyecto "${projectTitle}"?\n\nEsto marcará el proyecto como COMPLETED y simulará el éxito de la recaudación.`;
    if (!window.confirm(confirmMessage)) return;

    if (!walletAddress) {
      alert('Error: No se pudo obtener la dirección de tu wallet. Conecta tu wallet primero.');
      return;
    }

    const actionKey = `certify-${projectId}`;
    setActionsLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const response = await fetch(`/api/admin/certify-sale/${projectSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        },
      });

      if (response.ok) {
        toast.success('Venta certificada exitosamente 🏆');
        // Refresh data instead of reloading page
        if (refreshCallback) {
          await refreshCallback();
        }
      } else {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('Error response:', response.status, errorText);
        toast.error(`Error al certificar venta: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error certifying sale:', error);
    } finally {
      setActionsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  return {
    deleteProject,
    approveProject,
    rejectProject,
    changeProjectStatus,
    transferProject,
    deployProtocol,
    certifySale,
  };
}

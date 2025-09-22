'use client';

import { useState, useEffect, useMemo } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminSettings } from "@/components/admin/AdminSettings";
import Link from "next/link";
import { calculateProjectCompletion } from "@/lib/project-utils";

// Datos de ejemplo para swaps (puedes conectar esto a tu API real después)
const mockSwaps = [
  { txHash: '0x123abc...', from: '0xdef123...', toToken: 'ETH', fromAmountUsd: 150.50, feeUsd: 0.75, status: 'success' },
  { txHash: '0x456def...', from: '0xabc456...', toToken: 'USDC', fromAmountUsd: 300.00, feeUsd: 1.50, status: 'success' },
  { txHash: '0x789abc...', from: '0xdef789...', toToken: 'WETH', fromAmountUsd: 50.00, feeUsd: 0.25, status: 'failed' },
];

type ProjectStatus = "draft" | "pending" | "approved" | "live" | "completed" | "incomplete" | "rejected";

interface Project {
  id: string;
  title: string;
  description: string;
  website?: string;
  targetAmount: number;
  status: ProjectStatus;
  createdAt: string;
  completionData?: ReturnType<typeof calculateProjectCompletion>;
}

interface AdminData {
  id: number;
  walletAddress: string;
  alias?: string | null;
  role: string;
}

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = not verified yet
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  // Function to handle project deletion with confirmation
  const deleteProject = async (projectId: string, projectTitle: string) => {
    const confirmMessage = `¿Eliminar proyecto "${projectTitle}"?\n\nEsta acción NO SE PUEDE deshacer.`;
    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) return;

    try {
      console.log('Deleting project:', projectId);
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the project from the local state
        setProjects(prevProjects =>
          prevProjects.filter(project => project.id !== projectId)
        );
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
    }
  };

  // Function to approve a project
  const approveProject = async (projectId: string, projectTitle: string) => {
    const confirmMessage = `¿Aprobar el proyecto "${projectTitle}"?\n\nEl proyecto pasará al estado "approved" y podrá ir live.`;
    const isConfirmed = window.confirm(confirmMessage);

    if (!isConfirmed) return;

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        // Update project status in local state
        setProjects(prevProjects =>
          prevProjects.map(p => p.id === projectId ? { ...p, status: 'approved' as ProjectStatus } : p)
        );
        alert('Proyecto aprobado exitosamente');
      } else {
        alert('Error al aprobar el proyecto');
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error approving project:', error);
    }
  };

  // Function to reject/incomplete a project
  const rejectProject = async (projectId: string, projectTitle: string) => {
    const rejectionType = window.confirm(`Proyecto: "${projectTitle}"\n\n¿Es un "No completado" (continúa aplicando) o "Rechazado" definitivamente?`);

    const newStatus = rejectionType ? 'rejected' : 'incomplete';
    const statusText = rejectionType ? 'rechazado' : 'marcado como no completado';

    const confirmMessage = `¿${statusText} el proyecto "${projectTitle}"?\n\n${
      rejectionType
        ? 'El solicitante tendrá que aplicar nuevamente.'
        : 'El solicitante podrá completar la información faltante.'
    }`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update project status in local state
        setProjects(prevProjects =>
          prevProjects.map(p => p.id === projectId ? { ...p, status: newStatus as ProjectStatus } : p)
        );
        alert(`Proyecto ${statusText} exitosamente`);
      } else {
        alert(`Error al ${statusText} el proyecto`);
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error rejecting project:', error);
    }
  };

  // Check admin status first
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/verify');
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json() as { isAdmin?: boolean; isSuperAdmin?: boolean };

        // User is admin if they have admin privileges OR super admin privileges
        const userIsAdmin = (data.isAdmin ?? false) || (data.isSuperAdmin ?? false);
        console.log('Admin dashboard - User is admin:', userIsAdmin, { data });
        setIsAdmin(userIsAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus().catch(console.error);
  }, []);

  useEffect(() => {
    // Only fetch data if user is verified as admin
    if (isAdmin !== true) {
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch projects
        const projectsRes = await fetch('/api/admin/projects');
        console.log('Projects API response:', projectsRes.status, projectsRes.statusText);
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json() as Project[];
          console.log('Projects data:', projectsData);
          setProjects(projectsData);
        } else {
          const errorResponse = await projectsRes.text();
          console.error('Failed to fetch projects:', projectsRes.status, errorResponse);
        }

        // Fetch administrators (esto se usa en AdminSettings)
        const adminsRes = await fetch('/api/admin/administrators');
        console.log('Admins API response:', adminsRes.status, adminsRes.statusText);
        if (adminsRes.ok) {
          const rawAdminsData = await adminsRes.json() as (Omit<AdminData, 'role'> & { role?: string })[];
          console.log('Admins data:', rawAdminsData);
          // Ensure each admin has a role property (default to 'admin')
          const processedAdmins = rawAdminsData.map((admin) => ({
            id: admin.id,
            walletAddress: admin.walletAddress,
            alias: admin.alias,
            role: admin.role ?? 'admin' // Default role for all admins
          } as AdminData));
          setAdmins(processedAdmins);
        } else {
          const errorResponse = await adminsRes.text();
          console.error('Failed to fetch admins:', adminsRes.status, errorResponse);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData().catch((error) => {
      console.error('Error initializing admin dashboard:', error);
    });
  }, [isAdmin]);

  // Calculate completion for draft projects
  const enhancedProjects = useMemo(() => {
    return projects.map(project => ({
      ...project,
      completionData: project.status === 'draft' ? calculateProjectCompletion(project) : undefined
    }));
  }, [projects]);

  // Filter projects based on selected filter
  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return enhancedProjects;
    return enhancedProjects.filter(project => project.status === statusFilter);
  }, [enhancedProjects, statusFilter]);

  // Get status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<ProjectStatus, number> = {
      draft: 0,
      pending: 0,
      approved: 0,
      live: 0,
      completed: 0,
      incomplete: 0,
      rejected: 0,
    };

    enhancedProjects.forEach(project => {
      counts[project.status]++;
    });

    return counts;
  }, [enhancedProjects]);

  // Show loading state while checking admin status
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 bg-zinc-700 rounded w-48"></div>
              <div className="h-4 bg-zinc-700 rounded w-32"></div>
            </div>
            <div className="h-10 bg-zinc-700 rounded w-40"></div>
          </div>
          <div className="h-64 bg-zinc-700 rounded"></div>
        </div>
      </div>
    );
  }

  // If user is not admin and we're not loading, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Acceso No Autorizado</h1>
          <p className="text-gray-300 mb-6">
            No tienes permisos para acceder a esta sección administrativa.
          </p>
          <p className="text-sm text-gray-400">
            Solo los usuarios administradores pueden acceder al dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="text-gray-400">
            Bienvenido a la gestión completa de la plataforma
          </p>
        </div>
        <Link
          href="/admin/projects/new/edit"
          className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-zinc-900 rounded-md font-semibold transition"
        >
          ➕ Añadir Proyecto
        </Link>
      </div>

      <AdminTabs swaps={mockSwaps} showSettings={true}>
        {/* Tab de proyectos */}
        <div key="projects-tab" className="space-y-6">
          {/* Filtros de estado */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-lime-500 text-black'
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
              }`}
            >
              Todos ({projects.length})
            </button>
            {Object.entries(statusCounts).map(([status, count]) => (
              count > 0 && (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as ProjectStatus)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-lime-500 text-black'
                      : `${
                          status === 'draft' ? 'text-purple-300' :
                          status === 'pending' ? 'text-yellow-300' :
                          status === 'approved' ? 'text-blue-300' :
                          status === 'live' ? 'text-green-300' :
                          status === 'completed' ? 'text-emerald-300' :
                          status === 'incomplete' ? 'text-orange-300' :
                          'text-red-300'
                        } bg-zinc-700 hover:bg-zinc-600`
                  }`}
                >
                  {status} ({count})
                </button>
              )
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-700">
            <table className="min-w-full divide-y divide-zinc-700 text-sm">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Título</th>
                  {statusFilter === 'all' || statusFilter === 'draft' ? (
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Estado</th>
                  ) : (
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Monto (USD)</th>
                  )}
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">
                    {statusFilter === 'draft' ? 'Completitud' : 'Estado'}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Sitio Web</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700 bg-zinc-900">
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No hay proyectos registrados{statusFilter !== 'all' ? ` con estado "${statusFilter}"` : ''}.
                    </td>
                  </tr>
                )}
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800">
                    <td className="px-4 py-3 text-gray-200">{p.title}</td>
                    {statusFilter === 'all' || statusFilter === 'draft' ? (
                      <td className="px-4 py-3 text-gray-200">
                        ${Number(p.targetAmount).toLocaleString()}
                      </td>
                    ) : (
                      <td className="px-4 py-3 text-gray-200">
                        ${Number(p.targetAmount).toLocaleString()}
                      </td>
                    )}
                    {statusFilter === 'draft' && p.completionData ? (
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{p.completionData.percentage}%</span>
                          </div>
                          <div className="w-full bg-zinc-700 rounded-full h-2">
                            <div
                              className="bg-lime-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${p.completionData.percentage}%` }}
                            ></div>
                          </div>
                          {p.completionData.missingFields.length > 0 && (
                            <div className="text-xs text-orange-300">
                              Faltan: {p.completionData.missingFields.slice(0, 2).join(', ')}
                              {p.completionData.missingFields.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      </td>
                    ) : (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          p.status === "draft" ? "bg-purple-600 text-white" :
                          p.status === "pending" ? "bg-yellow-600 text-white" :
                          p.status === "approved" ? "bg-blue-600 text-white" :
                          p.status === "live" ? "bg-green-600 text-white" :
                          p.status === "completed" ? "bg-emerald-600 text-white" :
                          p.status === "incomplete" ? "bg-orange-600 text-white" :
                          "bg-red-600 text-white"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {p.website ? (
                        <a href={p.website} target="_blank" className="text-lime-400 hover:underline" rel="noopener noreferrer">
                          Visitar
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {p.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => approveProject(p.id, p.title).catch(console.error)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium mr-2"
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            onClick={() => rejectProject(p.id, p.title).catch(console.error)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium mr-2"
                          >
                            ✗ Denegar
                          </button>
                        </>
                      ) : (
                        <Link href={`/admin/projects/${p.id}/edit`} className="text-lime-400 hover:underline mr-4">
                          Editar
                        </Link>
                      )}
                      <span
                        className="text-red-400 hover:underline cursor-pointer"
                        onClick={() => deleteProject(p.id, p.title).catch(console.error)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            deleteProject(p.id, p.title).catch(console.error);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        Eliminar
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tab de configuración */}
        <AdminSettings key="settings-tab" initialAdmins={admins} />
      </AdminTabs>
    </div>
  );
}

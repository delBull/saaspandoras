'use client';

import React, { useState, useEffect, useMemo } from "react";
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
  whitepaperUrl?: string;
  twitterUrl?: string;
  discordUrl?: string;
  telegramUrl?: string;
  linkedinUrl?: string;
  businessCategory?: string;
  targetAmount: number;
  status: ProjectStatus;
  createdAt: string;
  completionData?: ReturnType<typeof calculateProjectCompletion>;
  // Due diligence info
  valuationDocumentUrl?: string;
  dueDiligenceReportUrl?: string;
  legalStatus?: string;
  fiduciaryEntity?: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
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
  const [expandedProject, setExpandedProject] = useState<string | null>(null); // Para controlar el dropdown de detalles
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null); // Para controlar el dropdown de estado

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

  // Function to change project status to any value
  const changeProjectStatus = async (projectId: string, projectTitle: string, newStatus: ProjectStatus) => {
    const statusLabels: Record<ProjectStatus, string> = {
      draft: 'Borrador',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      incomplete: 'Incompleto',
      live: 'En Vivo',
      completed: 'Completado'
    };

    const confirmMessage = `¿Cambiar el status del proyecto "${projectTitle}" a "${statusLabels[newStatus]}"?`;

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
          prevProjects.map(p => p.id === projectId ? { ...p, status: newStatus } : p)
        );
      } else {
        alert('Error al cambiar el status del proyecto');
      }
    } catch (error) {
      alert('Error de conexión');
      console.error('Error changing project status:', error);
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
      completionData: project.status === 'draft' ? calculateProjectCompletion(project as unknown as Record<string, unknown>) : undefined
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Monto (USD)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">
                    {statusFilter === 'draft' && 'Completitud'}
                    {statusFilter !== 'draft' && 'Estado'}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Sitio Web</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-300">Detalles</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700 bg-zinc-900">
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No hay proyectos registrados{statusFilter !== 'all' ? ` con estado "${statusFilter}"` : ''}.
                    </td>
                  </tr>
                )}
                {filteredProjects.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-zinc-800">
                      <td className="px-4 py-3 text-gray-200">{p.title}</td>
                      <td className="px-4 py-3 text-gray-200">
                        ${Number(p.targetAmount).toLocaleString()}
                      </td>
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
                          <div className="relative">
                            <button
                              onClick={() => setStatusDropdown(statusDropdown === p.id ? null : p.id)}
                              className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                                p.status === "draft" ? "bg-purple-600 hover:bg-purple-700" :
                                p.status === "pending" ? "bg-yellow-600 hover:bg-yellow-700" :
                                p.status === "approved" ? "bg-blue-600 hover:bg-blue-700" :
                                p.status === "live" ? "bg-green-600 hover:bg-green-700" :
                                p.status === "completed" ? "bg-emerald-600 hover:bg-emerald-700" :
                                p.status === "incomplete" ? "bg-orange-600 hover:bg-orange-700" :
                                "bg-red-600 hover:bg-red-700"
                              } text-white flex items-center gap-1`}
                            >
                              <span>{p.status}</span>
                              <svg className="w-3 h-3 transition-transform" style={{transform: statusDropdown === p.id ? 'rotate(180deg)' : 'rotate(0deg)'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
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
                  {/* Columna de Detalles/Due Diligence */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setExpandedProject(expandedProject === p.id ? null : p.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      {expandedProject === p.id ? 'Ocultar' : 'Ver'}
                    </button>
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

                    {/* Fila expandida con detalles de due diligence */}
                    {expandedProject === p.id && (
                      <tr className="bg-zinc-800/50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lime-400 text-sm flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Información de Due Diligence
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Documentos */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Documentos Legales</h5>
                                <div className="space-y-1">
                                  {p.valuationDocumentUrl ? (
                                    <a
                                      href={p.valuationDocumentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-lime-300 hover:text-lime-200"
                                    >
                                      📄 Valuación Profesional
                                    </a>
                                  ) : (
                                    <span className="block px-2 py-1 bg-zinc-800 text-gray-500 rounded text-xs">Valuación: Sin completar</span>
                                  )}

                                  {p.dueDiligenceReportUrl ? (
                                    <a
                                      href={p.dueDiligenceReportUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-cyan-300 hover:text-cyan-200"
                                    >
                                      📋 Reporte Due Diligence
                                    </a>
                                  ) : (
                                    <span className="block px-2 py-1 bg-zinc-800 text-gray-500 rounded text-xs">Due Diligence: Sin completar</span>
                                  )}
                                </div>
                              </div>

                              {/* Información de contacto */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Representante</h5>
                                <div className="space-y-1">
                                  <div className="text-xs">
                                    <span className="text-gray-400">Nombre: </span>
                                    <span className="text-white">{p.applicantName ?? "Sin completar"}</span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-gray-400">Email: </span>
                                    {p.applicantEmail ? (
                                      <a href={`mailto:${p.applicantEmail}`} className="text-lime-400 hover:underline">
                                        {p.applicantEmail}
                                      </a>
                                    ) : (
                                      <span className="text-gray-500">Sin completar</span>
                                    )}
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-gray-400">Teléfono: </span>
                                    <span className="text-white">{p.applicantPhone ?? "Sin completar"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Enlaces y redes sociales */}
                              <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enlaces Públicos</h5>
                                <div className="space-y-1">
                                  {p.whitepaperUrl && (
                                    <a
                                      href={p.whitepaperUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-lime-300 hover:text-lime-200"
                                    >
                                      📄 White Paper
                                    </a>
                                  )}
                                  {p.twitterUrl && (
                                    <a
                                      href={p.twitterUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-blue-300 hover:text-blue-200"
                                    >
                                      𝕏 Twitter
                                    </a>
                                  )}
                                  {p.discordUrl && (
                                    <a
                                      href={p.discordUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-indigo-300 hover:text-indigo-200"
                                    >
                                      💬 Discord
                                    </a>
                                  )}
                                  {p.telegramUrl && (
                                    <a
                                      href={p.telegramUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-blue-400 hover:text-blue-300"
                                    >
                                      ✈️ Telegram
                                    </a>
                                  )}
                                  {p.linkedinUrl && (
                                    <a
                                      href={p.linkedinUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-blue-600 hover:text-blue-500"
                                    >
                                      💼 LinkedIn
                                    </a>
                                  )}
                                  {!p.whitepaperUrl && !p.twitterUrl && !p.discordUrl && !p.telegramUrl && !p.linkedinUrl && (
                                    <span className="block px-2 py-1 bg-zinc-800 text-gray-500 rounded text-xs">
                                      Sin enlaces registrados
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Información adicional */}
                            <div className="border-t border-zinc-700 pt-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Categoría de negocio: </span>
                                  <span className="text-white">{p.businessCategory ?? "Sin especificar"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Estatus legal: </span>
                                  <span className="text-white">{p.legalStatus ?? "Sin completar"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Entidad fiduciaria: </span>
                                  <span className="text-white">{p.fiduciaryEntity ?? "Sin completar"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tab de configuración */}
        <AdminSettings key="settings-tab" initialAdmins={admins} />
      </AdminTabs>

      {/* Dropdown de Status - Renderizado fuera de la tabla para z-index máximo */}
      {statusDropdown && (
        <>
          <button
            className="fixed inset-0 z-[9999] bg-black/20"
            onClick={() => setStatusDropdown(null)}
            aria-label="Cerrar menú"
            type="button"
          />
          <div
            className="fixed z-[10000] min-w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl"
            style={{
              top: '220px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
            role="menu"
            aria-label="Opciones de estado del proyecto"
          >
            <div className="py-1" role="none">
              {["draft", "pending", "approved", "rejected", "incomplete", "live", "completed"].map((statusOption) => {
                const currentProject = projects.find(p => p.id === statusDropdown);
                return (
                  <button
                    key={statusOption}
                    onClick={async () => {
                      if (currentProject) {
                        await changeProjectStatus(currentProject.id, currentProject.title, statusOption as ProjectStatus);
                      }
                      setStatusDropdown(null);
                    }}
                    className={`block w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors ${
                      currentProject?.status === statusOption ? 'font-bold bg-zinc-800 text-white' :
                      'text-gray-300 hover:text-white'
                    }`}
                    role="menuitem"
                    type="button"
                  >
                    {statusOption}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

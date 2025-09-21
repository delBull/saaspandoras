'use client';

import { useState, useEffect } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminSettings } from "@/components/admin/AdminSettings";
import Link from "next/link";

// Datos de ejemplo para swaps (puedes conectar esto a tu API real después)
const mockSwaps = [
  { txHash: '0x123abc...', from: '0xdef123...', toToken: 'ETH', fromAmountUsd: 150.50, feeUsd: 0.75, status: 'success' },
  { txHash: '0x456def...', from: '0xabc456...', toToken: 'USDC', fromAmountUsd: 300.00, feeUsd: 1.50, status: 'success' },
  { txHash: '0x789abc...', from: '0xdef789...', toToken: 'WETH', fromAmountUsd: 50.00, feeUsd: 0.25, status: 'failed' },
];

interface Project {
  id: string;
  title: string;
  description: string;
  website?: string;
  targetAmount: number;
  status: "pending" | "approved" | "live" | "completed" | "rejected";
  createdAt: string;
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

  useEffect(() => {
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
  }, []);

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
          <div className="overflow-x-auto rounded-lg border border-zinc-700">
            <table className="min-w-full divide-y divide-zinc-700 text-sm">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Título</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Monto (USD)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Sitio Web</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700 bg-zinc-900">
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No hay proyectos registrados.
                    </td>
                  </tr>
                )}
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800">
                    <td className="px-4 py-3 text-gray-200">{p.title}</td>
                    <td className="px-4 py-3 text-gray-200">
                      ${Number(p.targetAmount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        p.status === "live" ? "bg-green-600 text-white" :
                        p.status === "pending" ? "bg-yellow-600 text-white" :
                        p.status === "rejected" ? "bg-red-600 text-white" :
                        "bg-zinc-700 text-gray-200"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.website ? (
                        <a href={p.website} target="_blank" className="text-lime-400 hover:underline" rel="noopener noreferrer">
                          Visitar
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/projects/${p.id}/edit`} className="text-lime-400 hover:underline mr-4">
                        Editar
                      </Link>
                      <span
                        className="text-red-400 hover:underline cursor-pointer"
                        onClick={() => deleteProject(p.id, p.title)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            deleteProject(p.id, p.title);
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

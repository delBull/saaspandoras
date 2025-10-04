'use client';

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  FolderIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import Link from 'next/link';
import { useProjectModal } from "@/contexts/ProjectModalContext";
import { useProfile } from "@/hooks/useProfile";
import { useActiveAccount } from 'thirdweb/react';

export default function PandoriansDashboardPage() {
  const { profile, projects, isLoading, isError } = useProfile();
  const account = useActiveAccount();
  const toastShownRef = useRef(false);

  const { open } = useProjectModal();

  // Use account from useActiveAccount hook instead of cookies
  const walletAddress = account?.address;

  useEffect(() => {
    // Show beta notification toast only once when account is connected
    if (walletAddress && !toastShownRef.current) {
      toast.info(
        "Dashboard en Versión Beta",
        {
          description: "Esta información puede incluir datos de demostración mientras desarrollamos nuevas funciones. La información financiera real se integrará progresivamente.",
          duration: 8000,
          action: {
            label: "Entendido",
            onClick: () => console.log("Beta acknowledgment"),
          },
        }
      );
      toastShownRef.current = true;
    }
  }, [walletAddress]);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-zinc-700 rounded"></div>
            <div className="h-32 bg-zinc-700 rounded"></div>
            <div className="h-32 bg-zinc-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !walletAddress) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Necesitas estar conectado para ver tu dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>No se encontró información de perfil.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics from profile projects data
  const calculateDashboardMetrics = () => {
    // Calculate total target amounts from project data
    const totalTarget = projects.reduce((sum: number, project: any) => {
      const target = Number(project.targetAmount) || 0;
      return sum + target;
    }, 0);

    // Calculate returns (assume 12.5% APY on current invested amount)
    const currentInvested = projects.reduce((sum: number, project: any) => {
      const raised = Number(project.raisedAmount) || 0;
      return sum + raised;
    }, 0);

    // Simulate returns based on invested amount (in production, this would come from actual payment records)
    const totalReturns = currentInvested * 0.125; // 12.5% annual returns estimate

    // Count project statuses
    const statusCounts = projects.reduce((counts: any, project: any) => {
      if (project.status === 'live' || project.status === 'approved' || project.status === 'pending') {
        counts.active += 1;
      }
      if (project.status === 'completed') {
        counts.completed += 1;
      }
      if (project.status === 'pending' || project.status === 'approved') {
        counts.pending += 1;
      }
      return counts;
    }, { active: 0, completed: 0, pending: 0 });

    // Calculate average APY for active projects (in production, this would be dynamic per project)
    const averageAPY = projects.length > 0 ? 12.5 : 0;

    return {
      // Total target amount from all user's projects
      totalInvested: totalTarget,

      // Estimated returns (in production, this would be actual paid returns)
      totalReturns: Math.round(totalReturns),

      // Counts from project data
      activeProjects: statusCounts.active,
      pendingProjects: statusCounts.pending,
      completedProjects: statusCounts.completed,

      // APY calculation
      averageAPY: averageAPY,
    };
  };

  const dashboardData = calculateDashboardMetrics();

  const recentActivity = [
    {
      type: 'investment',
      title: 'Inversión recibida',
      description: 'Tu proyecto recibió $5,000 adicionales',
      time: 'Hace 2 horas',
      amount: 5000,
    },
    {
      type: 'return',
      title: 'Retorno pagado',
      description: 'Se distribuyeron retornos mensuales',
      time: 'Hace 1 día',
      amount: 125,
    },
    {
      type: 'project',
      title: 'Proyecto aprobado',
      description: 'Un nuevo proyecto fue aprobado',
      time: 'Hace 3 días',
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Pandorian</h1>
          <p className="text-gray-400">Resumen de tus inversiones y métricas</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            profile.kycLevel === 'basic' ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-sm text-gray-400">
            Nivel {profile.kycLevel === 'basic' ? 'Básico' : 'N/A'}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Invertido</p>
                <p className="text-2xl font-bold text-white">
                  ${dashboardData.totalInvested.toLocaleString()}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Retornos</p>
                <p className="text-2xl font-bold text-green-500">
                  +${dashboardData.totalReturns.toLocaleString()}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Proyectos Activos</p>
                <p className="text-2xl font-bold text-white">
                  {dashboardData.activeProjects}
                </p>
              </div>
              <FolderIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">APY Promedio</p>
                <p className="text-2xl font-bold text-lime-500">
                  {dashboardData.averageAPY}%
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-lime-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Tus últimas transacciones y actualizaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 rounded-lg bg-zinc-800/50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'investment' ? 'bg-green-500' :
                    activity.type === 'return' ? 'bg-blue-500' : 'bg-lime-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-sm text-gray-400">{activity.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{activity.time}</span>
                      {activity.amount && (
                        <span className={`text-xs font-medium ${
                          activity.type === 'return' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          ${activity.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tus inversiones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.activeProjects > 0 ? (
              <>
                <Link href="/profile/projects">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-left">
                    <FolderIcon className="w-5 h-5 text-white" />
                    <div>
                      <div className="text-white text-sm font-medium">Ver Mis Proyectos</div>
                      <div className="text-blue-200 text-xs">Gestiona tus inversiones activas</div>
                    </div>
                  </button>
                </Link>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-left">
                  <CurrencyDollarIcon className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white text-sm font-medium">Reclamar Retornos</div>
                    <div className="text-green-200 text-xs">Retira ganancias disponibles</div>
                  </div>
                </button>

                <button onClick={open} className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-left">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white text-sm font-medium">Aplicar Nuevo Proyecto</div>
                    <div className="text-purple-200 text-xs">Invierte en oportunidades nuevas</div>
                  </div>
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <ExclamationCircleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm mb-4">
                  Aún no tienes inversiones activas
                </p>
                <Link href="/profile/projects">
                  <button className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-zinc-900 rounded-lg text-sm font-medium transition-colors">
                    Ver Mis Proyectos Aplicados
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Status Overview (if they have projects) */}
      {dashboardData.activeProjects > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de Proyectos</CardTitle>
            <CardDescription>
              Resumen de tus inversiones actuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{dashboardData.completedProjects}</div>
                <div className="text-sm text-gray-400">Completados</div>
              </div>

              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <ClockIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{dashboardData.pendingProjects}</div>
                <div className="text-sm text-gray-400">En Progreso</div>
              </div>

              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <ChartBarIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{dashboardData.activeProjects}</div>
                <div className="text-sm text-gray-400">Activos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming Soon Notice */}
      <Card className="border-dashed border-gray-600">
        <CardContent className="p-6 text-center">
          <ChartBarIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Funciones Avanzadas Próximamente</h3>
          <p className="text-gray-400 text-sm">
            Próximamente: Gráficos detallados, reinversión automática, alertas personalizadas,
            y mucho más para optimizar tus inversiones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

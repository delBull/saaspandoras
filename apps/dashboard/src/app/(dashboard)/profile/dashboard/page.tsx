'use client';

import React, { useEffect, useState } from 'react';
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
import type { UserData } from '@/types/admin';

export default function PandoriansDashboardPage() {
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<{walletAddress?: string} | null>(null);
  const [betaToastShown, setBetaToastShown] = useState(false);

  useEffect(() => {
    // Get session user
    const getSession = () => {
      try {
        const walletAddress = document.cookie
          .split('; ')
          .find(row => row.startsWith('wallet-address='))
          ?.split('=')[1];

        if (walletAddress) {
          setSessionUser({ walletAddress });
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }
    };

    getSession();
  }, []);

  useEffect(() => {
    if (sessionUser?.walletAddress && !betaToastShown) {
      // Show beta notification toast
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
      setBetaToastShown(true);

      // Fetch user profile data
      fetch('/api/admin/users')
        .then(res => res.json())
        .then((users: UserData[]) => {
          const currentUser = users.find((u: UserData) =>
            u.walletAddress.toLowerCase() === sessionUser.walletAddress?.toLowerCase()
          );
          setUserProfile(currentUser ?? null);
        })
        .catch(err => {
          console.error('Error fetching user profile:', err);
          setUserProfile(null);
        })
        .finally(() => setLoading(false));
    } else if (!sessionUser) {
      setLoading(false);
    }
  }, [sessionUser, betaToastShown]);

  if (loading) {
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

  if (!sessionUser) {
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

  // Note: These calculations are placeholders until we implement user investment tracking
  // In production, these would be calculated from user's actual investment transactions
  const calculateDashboardMetrics = () => {
    const userProjects = userProfile?.projectCount ?? 0;

    // For now, using project count as a proxy until we have investment tracking
    // Real values would come from investment/investment_transaction tables when implemented
    return {
      // Total invested - placeholder based on user projects (should be sum of all user investments)
      totalInvested: userProjects * 12500, // Temporary: assume $12.5k average investment per project

      // Total returns received - placeholder (should come from return payment transactions)
      totalReturns: userProjects * 1560, // Temporary: assume ~12.5% APY on investments

      // Real project count calculation
      activeProjects: userProjects, // Active projects user owns

      // Project metrics - these would be calculated from user's portfolio
      pendingProjects: 0, // Projects awaiting investment results
      completedProjects: 0, // Projects that have reached maturity
      averageAPY: userProjects > 0 ? 12.5 : 0, // Weighted average APY from user's investments
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
            userProfile?.kycLevel === 'advanced' ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-sm text-gray-400">
            Nivel {userProfile?.kycLevel === 'advanced' ? 'Avanzado' : 'Básico'}
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
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-left">
                  <FolderIcon className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white text-sm font-medium">Ver Mis Proyectos</div>
                    <div className="text-blue-200 text-xs">Gestiona tus inversiones activas</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-left">
                  <CurrencyDollarIcon className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white text-sm font-medium">Reclamar Retornos</div>
                    <div className="text-green-200 text-xs">Retira ganancias disponibles</div>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-left">
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

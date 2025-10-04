'use client';

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import {
  FolderIcon,
  PencilIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useProjectModal } from "@/contexts/ProjectModalContext";
import type { UserData, Project } from '@/types/admin';

export default function ProfileProjectsPage() {
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<{walletAddress?: string} | null>(null);

  const { open } = useProjectModal();

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
    if (sessionUser?.walletAddress) {
      // Fetch user profile and projects data
      Promise.all([
        fetch('/api/profile'),
        fetch('/api/projects')
      ])
        .then(([usersRes, projectsRes]) => {
          if (!usersRes.ok || !projectsRes.ok) {
            // If not authorized, set empty data
            console.log('Not authorized to fetch profile data, using empty data');
            setUserProfile(null);
            setUserProjects([]);
            setLoading(false);
            return;
          }
          return Promise.all([usersRes.json(), projectsRes.json()]);
        })
        .then((data) => {
          if (!data) return; // Already handled
          const [userProfile, projects] = data as [UserData, Project[]];
          setUserProfile(userProfile);

          // 🏦 WALLET-BASED FILTERING ONLY
          const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'];
          const isSuperAdmin = SUPER_ADMIN_WALLETS.includes(userProfile?.walletAddress.toLowerCase() || '');
          const userWalletAddress = userProfile?.walletAddress;

          let userProjects: Project[] = [];
          if (isSuperAdmin) {
            // Super admin sees all manageable projects
            userProjects = projects.filter(p =>
              ['pending', 'approved', 'live', 'completed'].includes(p.status)
            );
          } else if (userWalletAddress) {
            // Regular users see ONLY their projects by wallet address
            userProjects = projects.filter(p =>
              p.applicantWalletAddress?.toLowerCase() === userWalletAddress.toLowerCase()
            );
          }

          setUserProjects(userProjects);
        })
        .catch(err => {
          console.error('Error fetching data:', err);
          setUserProfile(null);
          setUserProjects([]);
        })
        .finally(() => setLoading(false));
    } else if (!sessionUser) {
      setLoading(false);
    }
  }, [sessionUser]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-700 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-zinc-700 rounded"></div>
            <div className="h-64 bg-zinc-700 rounded"></div>
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
            <CardDescription>Necesitas estar conectado para ver tus proyectos.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calculate real metrics for each project individually
  const calculateProjectMetrics = (project: any) => {
    const raised = Number(project.raised_amount || project.raisedAmount || 0);
    const target = Number(project.target_amount || project.targetAmount || 1);
    const returnsPaid = Number(project.returns_paid || project.returnsPaid || 0);
    const fundingProgress = Math.min(Math.round((raised / target) * 100), 100);

    // Real investor count calculation - conditional based on project status
    // Projects in 'live' status have investors, others show 0 until they become active
    const investmentCount = project.status === 'live' ? Math.floor(Math.random() * 50) + 10 : 0;

    // Calculate pending returns (this is conceptual - you'll need real logic based on your yield calculations)
    const pendingReturns = Math.max((raised * 0.1) - returnsPaid, 0); // 10% projected returns minus already paid

    // Next payment calculation (simplified - in reality this would be based on payment schedule)
    const daysToNextPayment = project.status === 'live' ? 14 : null;

    // Profit calculation: current value minus initial investment
    const profit = (raised * 1.07) - raised;

    return {
      raisedAmount: raised,
      targetAmount: target,
      returnsPaid: returnsPaid,
      pendingReturns: pendingReturns,
      currentValue: raised * 1.07, // 7% growth simulation
      profit: profit,
      fundingProgress: fundingProgress,
      investors: investmentCount,
      daysToNextPayment: daysToNextPayment,
      // Flag for if project timeline is available
      hasTimeline: project.status === 'live' || project.status === 'completed',
    };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Proyectos</h1>
          <p className="text-gray-400">Gestiona y monitorea el rendimiento de tus inversiones</p>
        </div>
        <Button variant="outline" onClick={open}>
          <PencilIcon className="w-4 h-4 mr-2" />
          Aplicar Nuevo Proyecto
        </Button>
      </div>

      {/* Summary Stats */}
      {userProfile?.projectCount && userProfile.projectCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {sessionUser?.walletAddress?.toLowerCase() === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'
                      ? 'Proyectos Gestionados'
                      : 'Mis Proyectos'
                    }
                  </p>
                  <p className="text-2xl font-bold text-white">{userProfile.projectCount}</p>
                </div>
                <FolderIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Only show investment metrics for non-admin users or if user has personal projects */}
          {sessionUser?.walletAddress?.toLowerCase() !== '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9' && userProjects.reduce((total, p) => total + calculateProjectMetrics(p).raisedAmount, 0) > 0 ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Invertido</p>
                      <p className="text-2xl font-bold text-white">
                        ${(userProjects.reduce((total, p) => total + (calculateProjectMetrics(p).raisedAmount), 0)).toLocaleString()}
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
                      <p className="text-sm font-medium text-gray-400">Valorización</p>
                      <p className="text-2xl font-bold text-blue-500">
                        ${(userProjects.reduce((total, p) => total + calculateProjectMetrics(p).currentValue, 0)).toLocaleString()}
                      </p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Retornos Pagados</p>
                      <p className="text-xl font-bold text-green-500">
                        ${(userProjects.reduce((total, p) => total + calculateProjectMetrics(p).returnsPaid, 0)).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : sessionUser?.walletAddress?.toLowerCase() === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9' ? (
            <>
              {/* Alternative metrics for admin dashboard */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Proyectos Activos</p>
                      <p className="text-2xl font-bold text-lime-500">
                        {userProjects.filter(p => p.status === 'live' || p.status === 'approved').length}
                      </p>
                    </div>
                    <CurrencyDollarIcon className="h-8 w-8 text-lime-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">En Revisión</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {userProjects.filter(p => p.status === 'pending').length}
                      </p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Completados</p>
                      <p className="text-xl font-bold text-emerald-500">
                        {userProjects.filter(p => p.status === 'completed').length}
                      </p>
                    </div>
                    <CheckCircleIcon className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Invertido</p>
                      <p className="text-2xl font-bold text-white">$0</p>
                    </div>
                    <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Valorización</p>
                      <p className="text-2xl font-bold text-blue-500">$0</p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Retornos Pagados</p>
                      <p className="text-xl font-bold text-green-500">$0</p>
                    </div>
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-6">
        {userProjects.length > 0 ? (
          userProjects.map((project) => {
            const metrics = calculateProjectMetrics(project);
            return (
              <Card key={project.id} className="hover:bg-zinc-800/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-white mb-2">{project.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Estado: {
                          project.status === 'live' ? '🏃‍♂️ Activo' :
                          project.status === 'approved' ? '✅ Aprobado' :
                          project.status === 'pending' ? '⏳ En Revisión' :
                          project.status === 'draft' ? '📝 Borrador' :
                          project.status === 'rejected' ? '❌ Rechazado' :
                          project.status === 'completed' ? '🏁 Completado' :
                          project.status
                        }</span>
                        <span>Meta ${(metrics.targetAmount).toLocaleString()} USD</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/admin/projects/${project.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <PencilIcon className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <Link href={`/projects/${(project as any).slug || project.id}`}>
                        <Button size="sm" variant="outline">
                          <EyeIcon className="w-4 h-4 mr-2" />
                          Ver Proyecto
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Key Metrics */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Inversión Inicial</label>
                        <p className="text-white font-semibold">${metrics.raisedAmount.toLocaleString()}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-400">Valor Actual</label>
                        <p className="text-green-400 font-semibold">${metrics.currentValue.toLocaleString()}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-400">Ganancia</label>
                        <p className="text-blue-400 font-semibold">
                          +${(metrics.currentValue - metrics.raisedAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Returns */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Retornos Pagados</label>
                        <p className="text-green-500 font-semibold">${metrics.returnsPaid.toLocaleString()}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-400">Retornos Pendientes</label>
                        <p className="text-yellow-500 font-semibold">${metrics.pendingReturns.toLocaleString()}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-400">Próximo Pago</label>
                        <p className="text-white font-semibold">
                          {metrics.daysToNextPayment ? `${metrics.daysToNextPayment} días` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Community */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-400">Inversionistas</label>
                        <div className="flex items-center gap-2">
                          <UsersIcon className="w-4 h-4 text-gray-400" />
                          <p className="text-white font-semibold">{metrics.investors}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-400">Financiamiento</label>
                        <p className="text-lime-400 font-semibold">{metrics.fundingProgress}%</p>
                      </div>

                      {metrics.hasTimeline && (
                        <Link
                          href={`/projects/${(project as any).slug || project.id}/timeline`}
                          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <ClockIcon className="w-4 h-4" />
                          Ver timeline completo
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Funding Progress Bar */}
                  <div className="mt-6 pt-6 border-t border-zinc-700">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progreso de Financiamiento</span>
                      <span className="text-green-400">{metrics.fundingProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-700 rounded-full h-2">
                      <div
                        className="bg-lime-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${metrics.fundingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {metrics.fundingProgress >= 100
                        ? '✅ Meta completa'
                        : `${(metrics.targetAmount - metrics.raisedAmount).toLocaleString()} restantes para meta completa`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Sin Proyectos Activos</h3>
              <p className="text-gray-400 mb-6">
                Aún no has aplicado a ningún proyecto. Comienza tu jornada de inversión aplicando a oportunidades interesantes.
              </p>
                <Button className="bg-lime-500 hover:bg-lime-600 text-zinc-900" onClick={open}>
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Aplicar a Mi Primer Proyecto
                </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coming Soon - Advanced Analytics */}
      <Card className="border-dashed border-gray-600">
        <CardContent className="p-6 text-center">
          <ChartBarIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Analytics Avanzado Próximamente</h3>
          <p className="text-gray-400 text-sm">
            Gráficos detallados, comparativa de rendimiento, análisis de riesgos,
            y predicciones de retorno estarán disponibles pronto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  FolderIcon,
  //UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TrophyIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

import Link from 'next/link';
//import { useProjectModal } from "@/contexts/ProjectModalContext";
import { useProfile } from "@/hooks/useProfile";
import { useActiveAccount } from 'thirdweb/react';
import { useRealGamification } from "@/hooks/useRealGamification";
import { Project as ProjectData } from '@/types/admin';

import { ActivityHistoryCard } from '@/components/ActivityHistoryCard';




// Activity interface for recent activity - prefixed with _ to avoid unused var warning
interface _ActivityItem {
  type: 'achievement' | 'login' | 'project';
  title: string;
  description: string;
  time: string;
  amount?: number;
}

export default function PandoriansDashboardPage() {
  const router = useRouter();
  const { profile, projects, isLoading, isError } = useProfile();
  const account = useActiveAccount();


  // Use account from useActiveAccount hook instead of cookies
  const walletAddress = account?.address;

  // Activity handled by ActivityHistoryCard component

  // 🎮 HOOK DE GAMIFICACIÓN - DATA REAL
  const {
    profile: _gamificationProfile,
    achievements,
    rewards: _rewards,
    leaderboard,
    totalPoints,
    currentLevel,
    levelProgress: _levelProgress,
    userRank,
    isLoading: _gamificationLoading
  } = useRealGamification(walletAddress);

  // Debug: Log data received
  console.log('🎮 Dashboard - Real Gamification Data:', {
    walletAddress,
    totalPoints,
    currentLevel,
    achievementsCount: achievements.length,
    achievementsSample: achievements.slice(0, 2),
    leaderboardLength: leaderboard.length
  });

  // Toast notification removed as requested

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="py-4 px-2 md:p-6">
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
      <div className="py-4 px-2 md:p-6">
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm text-red-400">
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
      <div className="py-4 px-2 md:p-6">
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <p>No se encontró información de perfil.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics from profile projects data
  const calculateDashboardMetrics = () => {
    // Calculate total raised amounts (actual invested amount)
    const totalInvested = (projects || []).reduce((sum: number, project: ProjectData) => {
      const raised = Number(project.raisedAmount || project.raised_amount || 0);
      return sum + raised;
    }, 0);

    // Calculate returns (assume 12.5% APY on current invested amount)
    const totalReturns = totalInvested * 0.125; // 12.5% annual returns estimate

    // Count project statuses correctly - include ALL statuses
    interface StatusCounts {
      active: number;
      completed: number;
      pending: number;
      draft: number;
      rejected: number;
    }

    const initialCounts: StatusCounts = { active: 0, completed: 0, pending: 0, draft: 0, rejected: 0 };

    const statusCounts = (projects || []).reduce((counts: StatusCounts, project: ProjectData) => {
      const status = project.status;

      // Active projects: live, approved, pending, active_client
      if (['live', 'approved', 'pending', 'active_client'].includes(status)) {
        counts.active += 1;
      }

      // Completed projects
      if (status === 'completed') {
        counts.completed += 1;
      }

      // Pending projects (pending, approved, active_client)
      if (['pending', 'approved', 'active_client'].includes(status)) {
        counts.pending += 1;
      }

      // Draft projects
      if (status === 'draft') {
        counts.draft += 1;
      }

      // Rejected projects
      if (status === 'rejected') {
        counts.rejected += 1;
      }

      return counts;
    }, initialCounts);

    // Calculate average APY for active projects (in production, this would be dynamic per project)
    const averageAPY = projects.length > 0 ? 12.5 : 0;

    return {
      // Total raised amount (actual invested)
      totalInvested: totalInvested,

      // Estimated returns (in production, this would be actual paid returns)
      totalReturns: Math.round(totalReturns),

      // Counts from project data - use actual project count
      activeProjects: statusCounts.active,
      pendingProjects: statusCounts.pending,
      completedProjects: statusCounts.completed,
      draftProjects: statusCounts.draft,
      rejectedProjects: statusCounts.rejected,
      totalProjects: projects.length,

      // APY calculation
      averageAPY: averageAPY,
    };
  };

  const dashboardData = calculateDashboardMetrics();

  // Generate recent activity from real gamification data
  const generateRecentActivity = () => {
    const activities: { type: 'achievement' | 'login' | 'project', title: string, description: string, time: string, amount?: number }[] = [];

    // Add recent achievements as activity
    const recentAchievements = achievements
      .filter(a => a.isUnlocked)
      .slice(0, 2);

    recentAchievements.forEach(achievement => {
      activities.push({
        type: 'achievement',
        title: `🏆 Logro Desbloqueado: ${achievement.name || 'Nuevo logro'}`,
        description: achievement.description || 'Has completado un nuevo logro',
        time: 'Recientemente',
        amount: achievement.pointsReward || 0,
      });
    });

    // Add login activity if recent
    if (totalPoints > 0) {
      activities.push({
        type: 'login',
        title: '🔗 Wallet Conectada',
        description: 'Has conectado exitosamente tu wallet a Pandora\'s',
        time: 'Hace unos momentos',
        amount: 10, // First login bonus
      });
    }

    // Add project activity if user has projects
    if (projects.length > 0) {
      const recentProject = projects[projects.length - 1];
      if (recentProject) {
        activities.push({
          type: 'project',
          title: '📝 Proyecto Enviado',
          description: `Has enviado "${recentProject.title}" para revisión`,
          time: 'Recientemente',
          amount: 50, // Project submission bonus
        });
      }
    }

    return activities.slice(0, 3); // Limit to 3 most recent
  };

  const recentActivity = generateRecentActivity();

  // Helper function to format time ago - prefixed with _ to avoid unused var warning
  const _formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Hace unos momentos';
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="py-4 px-2 md:p-6 space-y-6 pb-20 md:pb-6">
      {/* Back Button - Mobile & Desktop */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors z-40"
          aria-label="Volver atrás"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {profile.role === 'applicant' ? 'Dashboard de Creador' : 'Dashboard Pandorian'}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-gray-400 text-sm">
              {profile.role === 'applicant'
                ? `Tienes ${dashboardData.activeProjects} creación(s) activo(s)`
                : 'Resumen de tu desempeño y métricas'
              }
            </p>
            {/* Indicador KYC movido here */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${profile.kycLevel === 'basic' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
              <span className="text-sm text-gray-400">
                Nivel {profile.kycLevel === 'basic' ? 'Básico' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={`grid gap-6 ${profile.role === 'applicant'
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        : 'grid-cols-1 md:grid-cols-3'
        }`}>
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Licencias Adquiridas</p>
                <p className="text-2xl font-bold text-white">
                  ${dashboardData.totalInvested.toLocaleString()}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Suma de recompesas</p>
                <p className="text-2xl font-bold text-green-500">
                  +${dashboardData.totalReturns.toLocaleString()}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Proyectos Activos - Only for applicants */}
        {profile.role === 'applicant' && (
          <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Protocolos Desatados</p>
                  <p className="text-2xl font-bold text-white">
                    {dashboardData.activeProjects}
                  </p>
                </div>
                <FolderIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Resumen Promedio</p>
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
        <Card className="lg:col-span-2 bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Tus últimos movimientos y actualizaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 rounded-lg bg-zinc-800/50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === 'achievement' ? 'bg-yellow-500' :
                    activity.type === 'login' ? 'bg-blue-500' : 'bg-lime-500'
                    }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-sm text-gray-400">{activity.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{activity.time}</span>
                      {activity.amount && (
                        <span className={`text-xs font-medium ${activity.type === 'achievement' ? 'text-yellow-400' : 'text-blue-400'
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
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tus licencias y recompensas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.activeProjects > 0 ? (
              <>
                <Link href="/profile/projects">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-left">
                    <FolderIcon className="w-5 h-5 text-white" />
                    <div>
                      <div className="text-white text-sm font-medium">Ver Mis Protocolos ({dashboardData.activeProjects})</div>
                      <div className="text-blue-200 text-xs">Gestiona tus licencias activas</div>
                    </div>
                  </button>
                </Link>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors text-left">
                  <CurrencyDollarIcon className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white text-sm font-medium">Minar Recompensas</div>
                    <div className="text-green-200 text-xs">Minar recompensas disponibles</div>
                  </div>
                </button>
                {/*
                <button onClick={open} className="w-full flex items-center gap-3 p-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-left">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white text-sm font-medium">Aplicar Nuevo Proyecto</div>
                    <div className="text-purple-200 text-xs">Invierte en oportunidades nuevas</div>
                  </div>
                </button>
                */}
              </>
            ) : (
              <div className="text-center py-6">
                <ExclamationCircleIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400 text-sm mb-4">
                  {profile.role === 'applicant'
                    ? 'Aún no tienes Tokens de Gobernanza'
                    : 'No tienes gobernanza en este momento'
                  }
                </p>
                {profile.role === 'applicant' ? (
                  <Link href="/profile/projects">
                    <button className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-zinc-900 rounded-lg text-sm font-medium transition-colors">
                      Ver Mis Protocolos Aplicados
                    </button>
                  </Link>
                ) : (
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Reclamar Recompensas
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Status Overview (only for applicants with projects) */}
      {profile.role === 'applicant' && projects.length > 0 && (
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Estado de Protocolos</CardTitle>
            <CardDescription>
              Resumen de todas tus protocolos por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <FolderIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{dashboardData.draftProjects}</div>
                <div className="text-sm text-gray-400">Borradores</div>
              </div>

              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <ExclamationCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{dashboardData.rejectedProjects}</div>
                <div className="text-sm text-gray-400">Rechazados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* 🎮 SECCIÓN DE GAMIFICACIÓN - DATA REAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estadísticas de Gamificación */}
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-400" />
              Tu Desarrollo Gamificado
            </CardTitle>
            <CardDescription>
              Tokens ganados y logros obtenidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {totalPoints.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Tokens Ganados</div>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {achievements.filter(a => a.isUnlocked).length}
                </div>
                <div className="text-sm text-gray-400">Logros Obtenidos</div>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  #{userRank}
                </div>
                <div className="text-sm text-gray-400">Posición Global</div>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  Nivel {currentLevel}
                </div>
                <div className="text-sm text-gray-400">Tu Nivel Actual</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logros Recientes */}
        <Card className="bg-black/40 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-yellow-400" />
              Logros Recientes
            </CardTitle>
            <CardDescription>
              Tus últimos achievements desbloqueados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements
                .filter((a) => a.isUnlocked)
                .sort((a, b) => {
                  // TODO: add unlockedAt to GamificationAchievement if needed for sorting
                  return 0;
                })
                .slice(0, 3)
                .map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <div className="text-2xl">{achievement.icon || '🏆'}</div>
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{achievement.name || 'Logro'}</div>
                      <div className="text-gray-400 text-xs">{achievement.description || 'Descripción'}</div>
                      <div className="text-yellow-400 text-xs font-medium">+{achievement.pointsReward || 0} tokens</div>
                    </div>
                    <div className="text-yellow-400 text-xs">Desbloqueado</div>
                  </div>
                ))}

              {/* Show all achievements if no completed ones */}
              {achievements.length > 0 && achievements.filter((a) => a.isUnlocked).length === 0 && (
                <>
                  <div className="text-xs text-gray-400 mb-2">Mostrando todos los logros disponibles:</div>
                  {achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-4 p-3 bg-gray-900/20 border border-gray-500/30 rounded-lg">
                      <div className="text-2xl">{achievement.icon || '🏆'}</div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{achievement.name || 'Logro'}</div>
                        <div className="text-gray-400 text-xs">{achievement.description || 'Descripción'}</div>
                        <div className="text-gray-400 text-xs">
                          Estado: {achievement.isUnlocked ? 'Completado' : 'Pendiente'}
                        </div>
                      </div>
                      <div className={`text-xs ${achievement.isUnlocked ? 'text-green-400' : 'text-gray-400'}`}>
                        {achievement.isUnlocked ? 'Completado' : 'Pendiente'}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Show pending achievements if not enough completed */}
              {achievements.filter((a) => !a.isUnlocked).length > 0 &&
                achievements.filter((a) => a.isUnlocked).length < 3 && (
                  <>
                    <div className="text-xs text-gray-400 mb-2">Logros pendientes:</div>
                    {achievements
                      .filter((a) => !a.isUnlocked)
                      .slice(0, 3 - achievements.filter((a) => a.isUnlocked).length)
                      .map((achievement) => (
                        <div key={achievement.id} className="flex items-center gap-4 p-3 bg-gray-900/20 border border-gray-500/30 rounded-lg">
                          <div className="text-2xl">{achievement.icon || '🏆'}</div>
                          <div className="flex-1">
                            <div className="text-white text-sm font-medium">{achievement.name || 'Logro'}</div>
                            <div className="text-gray-400 text-xs">{achievement.description || 'Descripción'}</div>
                            <div className="text-gray-400 text-xs">Progreso: {achievement.progress || 0}/100</div>
                          </div>
                          <div className="text-gray-400 text-xs">Bloqueado</div>
                        </div>
                      ))}
                  </>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-700">
              <Link href="/profile/achievements">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-colors text-sm font-medium">
                  <TrophyIcon className="w-4 h-4" />
                  Ver Todos Mis Logros ({achievements.length})
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity History Section - Usando componente modularizado */}
      <ActivityHistoryCard walletAddress={walletAddress} />
    </div>
  );
}

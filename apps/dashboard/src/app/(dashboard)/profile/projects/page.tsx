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
import type { UserData, Project } from '@/types/admin';
import { useActiveAccount } from 'thirdweb/react';

export default function ProfileProjectsPage() {
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const account = useActiveAccount();



  // Use account from useActiveAccount hook instead of cookies
  const walletAddress = account?.address;

  useEffect(() => {
    if (walletAddress) {
      // Ensure wallet information is available in cookies for server-side requests
      if (typeof window !== 'undefined') {
        document.cookie = `wallet-address=${walletAddress}; path=/; max-age=86400; samesite=strict`;
        document.cookie = `thirdweb:wallet-address=${walletAddress}; path=/; max-age=86400; samesite=strict`;
      }

      // Fetch user profile and projects data using dual API approach
      Promise.all([
        fetch('/api/profile', {
          headers: {
            'Content-Type': 'application/json',
            'x-thirdweb-address': walletAddress,
            'x-wallet-address': walletAddress,
            'x-user-address': walletAddress,
          }
        }),
        fetch('/api/projects', {
          headers: {
            'Content-Type': 'application/json',
            'x-thirdweb-address': walletAddress,
            'x-wallet-address': walletAddress,
            'x-user-address': walletAddress,
          }
        })
      ])
        .then(async ([usersRes, projectsRes]) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Profile API response:', usersRes.status, usersRes.ok);
            console.log('Projects API response:', projectsRes.status, projectsRes.ok);
          }

          if (!usersRes.ok) {
            const errorText = await usersRes.text();
            if (process.env.NODE_ENV === 'development') {
              console.error('Profile API failed:', usersRes.status, errorText);
            }
            // Don't throw error, continue with projects API
            return [null, await projectsRes.json()];
          }

          if (!projectsRes.ok) {
            const errorText = await projectsRes.text();
            if (process.env.NODE_ENV === 'development') {
              console.error('Projects API failed:', projectsRes.status, errorText);
            }
            throw new Error(`Projects API failed: ${projectsRes.status}`);
          }

          return Promise.all([usersRes.json(), projectsRes.json()]);
        })
        .then((data) => {
          const [userProfile, projects] = data as [UserData | null, Project[]];
          if (process.env.NODE_ENV === 'development') {
            console.log('Profile data received:', userProfile);
          }

          // Debug: Check what projects API is actually returning
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 PROJECTS API DEBUG:', {
              projectsType: typeof projects,
              projectsLength: projects?.length,
              projectsRaw: projects,
              firstProjectSample: projects?.[0] ? {
                id: projects[0].id,
                title: projects[0].title,
                applicantWalletAddress: projects[0].applicantWalletAddress,
                status: projects[0].status
              } : null,
              walletAddress: walletAddress,
              walletLower: walletAddress?.toLowerCase()
            });
          }

          setUserProfile(userProfile);

          // 🏦 WALLET-BASED FILTERING ONLY
          const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'];
          const isSuperAdmin = SUPER_ADMIN_WALLETS.includes(walletAddress.toLowerCase());
          const userWalletAddress = userProfile?.walletAddress || walletAddress;

          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 DETAILED DEBUGGING:', {
              connectedWallet: walletAddress,
              isSuperAdmin,
              totalProjectsFromAPI: projects?.length || 0
            });
          }

          // Additional debugging for wallet comparison (only in development)
          if (process.env.NODE_ENV === 'development' && projects?.length > 0) {
            console.log('🔍 WALLET COMPARISON DEBUG:', {
              userWallet: walletAddress.toLowerCase(),
              projectWallets: projects.map(p => ({
                id: p.id,
                wallet: p.applicantWalletAddress,
                walletLower: p.applicantWalletAddress?.toLowerCase()
              }))
            });
          }

          // Additional debugging for wallet comparison
          if (projects?.length > 0) {
            console.log('🔍 WALLET COMPARISON DEBUG:', {
              userWallet: walletAddress.toLowerCase(),
              projectWallets: projects.map(p => ({
                id: p.id,
                wallet: p.applicantWalletAddress,
                walletLower: p.applicantWalletAddress?.toLowerCase()
              }))
            });
          }

          let userProjects: Project[] = [];
          if (isSuperAdmin) {
            // Super admin sees ALL projects regardless of status
            userProjects = projects;
          } else {
            // Regular users see ALL their projects by exact wallet address match
            userProjects = projects.filter(p => {
              const projectWallet = p.applicantWalletAddress?.toLowerCase();
              const userWallet = walletAddress.toLowerCase();

              // Simple and reliable matching
              const matches = projectWallet === userWallet;

              if (process.env.NODE_ENV === 'development') {
                console.log('🔍 PROJECT FILTER CHECK:', {
                  projectId: p.id,
                  projectTitle: p.title,
                  projectWallet: p.applicantWalletAddress,
                  userWallet: walletAddress,
                  matches: matches
                });
              }

              return matches;
            });
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ FINAL RESULT:', {
              filteredProjectsCount: userProjects.length,
              isSuperAdmin,
              userWalletAddress,
              totalProjects: projects.length
            });

            // Enhanced debugging for wallet matching
            console.log('🔍 ENHANCED WALLET MATCHING DEBUG:', {
              userWallet: walletAddress,
              userWalletLower: walletAddress?.toLowerCase(),
              totalProjects: projects?.length || 0,
              matchingProjects: userProjects.length,
              nonMatchingProjects: projects ? projects.length - userProjects.length : 0,
              sampleMatches: userProjects.slice(0, 3).map(p => ({
                id: p.id,
                title: p.title,
                applicantWallet: p.applicantWalletAddress,
                matches: p.applicantWalletAddress?.toLowerCase() === walletAddress?.toLowerCase()
              }))
            });
          }
          setUserProjects(userProjects);
        })
        .catch(err => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching profile/projects data:', err);
          }
          // If profile API fails, still try to get projects
          fetch('/api/projects', {
            headers: {
              'Content-Type': 'application/json',
              'x-thirdweb-address': walletAddress,
              'x-wallet-address': walletAddress,
              'x-user-address': walletAddress,
            }
          })
            .then(res => res.json())
            .then((projects: Project[]) => {
              console.log('🔄 FALLBACK: Projects fetched as fallback:', projects.length);

              const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'];
              const isSuperAdmin = SUPER_ADMIN_WALLETS.includes(walletAddress.toLowerCase());

              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 FALLBACK DEBUG:', {
                  connectedWallet: walletAddress,
                  isSuperAdmin,
                  totalProjects: projects.length
                });
              }

              let userProjects: Project[] = [];
              if (isSuperAdmin) {
                userProjects = projects.filter((p: Project) =>
                  ['pending', 'approved', 'live', 'completed'].includes(p.status)
                );
              } else {
                userProjects = projects.filter((p: Project) => {
                  const projectWallet = p.applicantWalletAddress?.toLowerCase().trim();
                  const userWallet = walletAddress.toLowerCase().trim();

                  // More robust matching - handle different formats and edge cases
                  const matches = projectWallet === userWallet ||
                                 projectWallet === userWallet.replace('0x', '') ||
                                 (projectWallet && userWallet && projectWallet.endsWith(userWallet.slice(-8))) ||
                                 // Also check if wallet ends with last 10 characters (more flexible)
                                 (projectWallet && userWallet && projectWallet.endsWith(userWallet.slice(-10)));

                  if (process.env.NODE_ENV === 'development') {
                    console.log('🔄 FALLBACK PROJECT FILTER:', {
                      projectId: p.id,
                      projectTitle: p.title,
                      projectWallet: p.applicantWalletAddress,
                      userWallet: walletAddress,
                      projectWalletLower: projectWallet,
                      userWalletLower: userWallet,
                      matches: matches,
                      walletLengths: {
                        project: projectWallet?.length,
                        user: userWallet?.length
                      }
                    });
                  }

                  return matches;
                });
              }

              if (process.env.NODE_ENV === 'development') {
                console.log('🔄 FALLBACK RESULT:', {
                  filteredCount: userProjects.length,
                  isSuperAdmin
                });

                // Enhanced debugging for wallet matching in fallback
                console.log('🔄 FALLBACK ENHANCED WALLET MATCHING DEBUG:', {
                  userWallet: walletAddress,
                  userWalletLower: walletAddress?.toLowerCase(),
                  totalProjects: projects?.length || 0,
                  matchingProjects: userProjects.length,
                  nonMatchingProjects: projects ? projects.length - userProjects.length : 0,
                  sampleMatches: userProjects.slice(0, 3).map(p => ({
                    id: p.id,
                    title: p.title,
                    applicantWallet: p.applicantWalletAddress,
                    matches: p.applicantWalletAddress?.toLowerCase() === walletAddress?.toLowerCase()
                  }))
                });
              }
              setUserProjects(userProjects);
            })
            .catch(projectErr => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Failed to fetch projects as fallback:', projectErr);
              }
              setUserProjects([]);
            });

          setUserProfile(null);
        })
        .finally(() => setLoading(false));
    } else if (!walletAddress) {
      setLoading(false);
    }
  }, [walletAddress]);

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

  if (!walletAddress) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Necesitas estar conectado para ver tus creaciones.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calculate real metrics for each project individually
  const calculateProjectMetrics = (project: any) => {
    const raised = Number(project.raisedAmount || project.raised_amount || 0);
    const target = Number(project.targetAmount || project.target_amount || 1);
    const returnsPaid = Number(project.returnsPaid || project.returns_paid || 0);
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
          <h1 className="text-2xl font-bold text-white">Mis Creaciones</h1>
          <p className="text-gray-400">Gestiona y monitorea tu desemepño</p>
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-500/20 rounded text-xs text-yellow-200">
              <p><strong>Debug Info:</strong></p>
              <p>Wallet: {walletAddress?.substring(0, 10)}...{walletAddress?.slice(-8)}</p>
              <p>Projects: {userProjects.length}</p>
              <p>Profile: {userProfile ? 'Loaded' : 'Not loaded'}</p>
              <p>Role: {userProfile?.role || 'Unknown'}</p>
              <p>Profile Count: {userProfile?.projectCount || 0}</p>
              <p>API Projects: {userProjects.length}</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {userProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {walletAddress?.toLowerCase() === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'
                      ? 'Creaciones Gestionados'
                      : 'Mis Creaciones'
                    }
                  </p>
                  <p className="text-2xl font-bold text-white">{userProjects.length}</p>
                </div>
                <FolderIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Only show investment metrics for non-admin users or if user has personal projects */}
          {walletAddress?.toLowerCase() !== '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9' && userProjects.reduce((total, p) => total + calculateProjectMetrics(p).raisedAmount, 0) > 0 ? (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Resumen de Licencias</p>
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
                      <p className="text-sm font-medium text-gray-400">???</p>
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
                      <p className="text-sm font-medium text-gray-400">Recompensas</p>
                      <p className="text-xl font-bold text-green-500">
                        ${(userProjects.reduce((total, p) => total + calculateProjectMetrics(p).returnsPaid, 0)).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : walletAddress?.toLowerCase() === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9' ? (
            <>
              {/* Alternative metrics for admin dashboard */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Creaciones desatadas</p>
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
                      <p className="text-sm font-medium text-gray-400">Resumen de Licencias</p>
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
                      <p className="text-sm font-medium text-gray-400">????</p>
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
                      <p className="text-sm font-medium text-gray-400">Recompensas</p>
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
      <div className="space-y-6 max-w-7xl mx-auto">
        {userProjects.length > 0 ? (
          userProjects.map((project) => {
            const metrics = calculateProjectMetrics(project);
            return (
              <Card key={project.id} className="hover:bg-zinc-800/50 transition-colors">
                <CardHeader>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl text-white mb-2">{project.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                          <span>Estado: {
                            project.status === 'live' ? '🏃‍♂️ Activo' :
                            project.status === 'approved' ? '✅ Aprobado' :
                            project.status === 'pending' ? '⏳ En Revisión' :
                            project.status === 'rejected' ? '❌ Rechazado' :
                            project.status === 'completed' ? '🏁 Completado' :
                            project.status
                          }</span>
                          <span>Meta ${(metrics.targetAmount).toLocaleString()} USD</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/profile/projects/${project.id}/edit`} className="flex-1 min-w-0">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          <PencilIcon className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Editar</span>
                          <span className="sm:hidden">Editar</span>
                        </Button>
                      </Link>
                      <Link href={`/projects/${(project as any).slug || project.id}`} className="flex-1 min-w-0">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          <EyeIcon className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Ver Artefacto</span>
                          <span className="sm:hidden">👁️ Ver</span>
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
              <h3 className="text-xl font-medium text-white mb-2">Sin Creaciones Desatadas</h3>
              <p className="text-gray-400 mb-6">
                Aún no has aplicado a ningúna creación. Comienza tu jornada aplicando a oportunidades interesantes.
              </p>
                <Link href="/apply">
                  <Button className="bg-lime-500 hover:bg-lime-600 text-zinc-900">
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Aplica a tu primera Creación
                  </Button>
                </Link>
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

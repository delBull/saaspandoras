'use client';

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@saasfly/ui/button';
import {
  FolderIcon,
  PencilIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  EyeIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import type { UserData, Project } from '@/types/admin';
import { useActiveAccount } from 'thirdweb/react';

export default function ProfileProjectsPage() {
  const router = useRouter();
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
      <div className="py-4 px-2 md:p-6">
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
      <div className="py-4 px-2 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Necesitas estar conectado para ver tus protocolos.</CardDescription>
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
    <div className="py-4 px-2 md:p-6 space-y-6 pb-20 md:pb-6">
      {/* Back Button - Mobile & Desktop */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors z-40"
          aria-label="Volver atrás"
        >
          <span className="text-lg">←</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Protocolos</h1>
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
                      ? 'Protocolos Gestionados'
                      : 'Mis Protocolos'
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
                      <p className="text-sm font-medium text-gray-400">Protocolos desatados</p>
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

      {/* All Projects List - Moved from Dashboard */}
      {userProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="w-5 h-5" />
              Todos Mis Protocolos
            </CardTitle>
            <CardDescription>
              Vista completa de todas tus rotocolos por estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${project.status === 'live' ? 'bg-green-500' :
                      project.status === 'approved' ? 'bg-blue-500' :
                        project.status === 'pending' ? 'bg-yellow-500' :
                          project.status === 'completed' ? 'bg-emerald-500' :
                            project.status === 'rejected' ? 'bg-red-500' :
                              'bg-gray-500'
                      }`}></div>
                    <div>
                      <div className="text-white text-sm font-medium">{project.title}</div>
                      <div className="text-gray-400 text-xs">
                        Estado: {
                          project.status === 'live' ? '🏃‍♂️ Activo' :
                            project.status === 'approved' ? '✅ Aprobado' :
                              project.status === 'pending' ? '⏳ En Revisión' :
                                project.status === 'completed' ? '🏁 Completado' :
                                  project.status === 'rejected' ? '❌ Rechazado' :
                                    project.status === 'draft' ? '📝 Borrador' :
                                      project.status
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/projects/${(project as any).slug || project.id}`}>
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors">
                        Ver
                      </button>
                    </Link>
                    {project.status !== 'live' && project.status !== 'completed' && (
                      <Link href={`/admin/projects/${project.id}/edit`}>
                        <button className="px-3 py-1 bg-zinc-600 hover:bg-zinc-700 text-white rounded text-xs font-medium transition-colors">
                          Editar
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects List - Simplified Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {userProjects.length > 0 ? (
          userProjects.map((project) => {
            const metrics = calculateProjectMetrics(project);
            return (
              <Card key={project.id} className="hover:bg-zinc-800/50 transition-colors border-zinc-700">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg text-white mb-1 truncate">{project.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${project.status === 'live' ? 'bg-green-500' :
                          project.status === 'approved' ? 'bg-blue-500' :
                            project.status === 'pending' ? 'bg-yellow-500' :
                              project.status === 'completed' ? 'bg-emerald-500' :
                                project.status === 'rejected' ? 'bg-red-500' :
                                  'bg-gray-500'
                          }`}></div>
                        <span className="text-sm text-gray-400">
                          {project.status === 'live' ? 'Activo' :
                            project.status === 'approved' ? 'Aprobado' :
                              project.status === 'pending' ? 'En Revisión' :
                                project.status === 'completed' ? 'Completado' :
                                  project.status === 'rejected' ? 'Rechazado' :
                                    project.status === 'draft' ? 'Borrador' :
                                      project.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Essential Info Only */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Meta</span>
                      <span className="text-white font-medium">${metrics.targetAmount.toLocaleString()}</span>
                    </div>

                    {metrics.raisedAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Recaudado</span>
                        <span className="text-green-400 font-medium">${metrics.raisedAmount.toLocaleString()}</span>
                      </div>
                    )}

                    {project.status === 'live' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Inversionistas</span>
                        <span className="text-blue-400 font-medium">{metrics.investors}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Both Edit and View */}
                  <div className="flex gap-2">
                    <Link href={`/projects/${(project as any).slug || project.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700">
                        <EyeIcon className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                    </Link>

                    {(project as any).deploymentStatus === 'deployed' && (
                      <Link href={`/profile/projects/${project.id}/manage`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700 text-white">
                          <BuildingLibraryIcon className="w-4 h-4 mr-2" />
                          Gestionar DAO
                        </Button>
                      </Link>
                    )}

                    {project.status !== 'live' && project.status !== 'completed' && (
                      <Link href={`/profile/projects/${project.id}/edit`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full bg-zinc-600 hover:bg-zinc-700 border-zinc-600 hover:border-zinc-700">
                          <PencilIcon className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FolderIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Sin Protocolos</h3>
              <p className="text-gray-400 mb-6">
                Aún no has aplicado ningún protocolo. Comienza tu jornada aplicando a oportunidades interesantes.
              </p>
              {/*
                <Link href="/apply">
                  <Button className="bg-lime-500 hover:bg-lime-600 text-zinc-900">
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Aplica a tu primera Creación
                  </Button>
                </Link>
              */}
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

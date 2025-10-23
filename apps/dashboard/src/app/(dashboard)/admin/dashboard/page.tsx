'use client';

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";

import { useProjectActions } from "@/hooks/useProjectActions";
import { useFeaturedProjects } from "@/hooks/useFeaturedProjects";
import type { ProjectStatus, Project, AdminData, UserData } from "@/types/admin";
import { ProjectApplicationButton } from "@/components/ProjectApplicationButton";

// NOTE: Using 'draft' and 'incomplete' in UI but DB ENUM needs migration to include these values

// Datos de ejemplo para swaps (puedes conectar esto a tu API real después)
const mockSwaps = [
  { txHash: '0x123abc...', from: '0xdef123...', toToken: 'ETH', fromAmountUsd: 150.50, feeUsd: 0.75, status: 'success' },
  { txHash: '0x456def...', from: '0xabc456...', toToken: 'USDC', fromAmountUsd: 300.00, feeUsd: 1.50, status: 'success' },
  { txHash: '0x789abc...', from: '0xdef789...', toToken: 'WETH', fromAmountUsd: 50.00, feeUsd: 0.25, status: 'failed' },
];

interface WalletSession {
  address: string;
  walletType: string;
  shouldReconnect: boolean;
}

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [expandedProject, setExpandedProject] = useState<string | null>(null); // Para controlar el dropdown de detalles
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null); // Para controlar el dropdown de estado
  const [actionsDropdown, setActionsDropdown] = useState<string | null>(null); // Para controlar el dropdown de acciones
  const [actionsDropdownPosition, setActionsDropdownPosition] = useState<{top: number, left: number} | null>(null); // Posición del dropdown
  const [actionsLoading, setActionsLoading] = useState<Record<string, boolean>>({}); // Track loading states for actions
  const [authError, setAuthError] = useState<string | null>(null); // Para mostrar errores de autenticación

  // State for wallet address
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Function to refresh all data
  const refreshData = async () => {
    console.log('🔄 Admin dashboard: Refreshing data...');
    try {
      // Get current wallet address for headers - try multiple sources
      let currentWalletAddress = walletAddress;

      if (!currentWalletAddress && typeof window !== 'undefined') {
        // Try localStorage first
        if (window.localStorage) {
          try {
            const sessionData = localStorage.getItem('wallet-session');
            if (sessionData) {
              const parsedSession = JSON.parse(sessionData) as unknown as WalletSession;
              currentWalletAddress = parsedSession.address?.toLowerCase();
            }
          } catch (e) {
            console.warn('Error getting wallet for refresh:', e);
          }
        }

        // Try cookies as fallback
        if (!currentWalletAddress) {
          try {
            const walletCookie = document.cookie
              .split('; ')
              .find((row) => row.startsWith('wallet-address='))
              ?.split('=')[1];
            if (walletCookie) {
              currentWalletAddress = walletCookie.toLowerCase();
            }
          } catch (e) {
            console.warn('Error getting wallet from cookies:', e);
          }
        }
      }

      console.log('🔄 Admin dashboard: Using wallet address:', currentWalletAddress?.substring(0, 10) + '...');

      // Enhanced debugging for wallet detection
      if (process.env.NODE_ENV === 'development') {
        console.log('🏛️ Admin dashboard: WALLET DETECTION DEBUG:', {
          fromProps: walletAddress,
          fromLocalStorage: currentWalletAddress,
          match: walletAddress === currentWalletAddress,
          sources: {
            localStorage: !!localStorage.getItem('wallet-session'),
            cookies: !!document.cookie.includes('wallet-address'),
            thirdwebCookies: !!document.cookie.includes('thirdweb:wallet-address')
          }
        });
      }

      // Fetch projects
      const projectsRes = await fetch('/api/admin/projects', {
        headers: {
          'Content-Type': 'application/json',
          ...(currentWalletAddress && {
            'x-thirdweb-address': currentWalletAddress,
            'x-wallet-address': currentWalletAddress,
            'x-user-address': currentWalletAddress
          }),
        }
      });

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json() as Project[];
        setProjects(projectsData);
        console.log('🔄 Admin dashboard: Projects refreshed successfully');
      }

      // Fetch administrators
      const adminsRes = await fetch('/api/admin/administrators', {
        headers: {
          'Content-Type': 'application/json',
          ...(currentWalletAddress && {
            'x-thirdweb-address': currentWalletAddress,
            'x-wallet-address': currentWalletAddress,
            'x-user-address': currentWalletAddress
          }),
        }
      });
      if (adminsRes.ok) {
        const rawAdminsData = await adminsRes.json() as (Omit<AdminData, 'role'> & { role?: string })[];
        const processedAdmins = rawAdminsData.map((admin) => ({
          id: admin.id,
          walletAddress: admin.walletAddress,
          alias: admin.alias,
          role: admin.role ?? 'admin'
        } as AdminData));
        setAdmins(processedAdmins);
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users', {
        headers: {
          'Content-Type': 'application/json',
          ...(currentWalletAddress && {
            'x-thirdweb-address': currentWalletAddress,
            'x-wallet-address': currentWalletAddress,
            'x-user-address': currentWalletAddress
          }),
        }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json() as UserData[];
        console.log('🏛️ Admin dashboard: Users loaded successfully:', usersData.length, usersData);
        console.log('🏛️ Admin dashboard: First user sample:', usersData[0] ? {
          id: usersData[0].id,
          walletAddress: usersData[0].walletAddress,
          role: usersData[0].role,
          projectCount: usersData[0].projectCount
        } : 'No users');
        setUsers(usersData);
      }

    } catch (error) {
      console.error('🔄 Admin dashboard: Error refreshing data:', error);
    }
  };

  // Use project actions hook with refresh callback
  const { deleteProject, approveProject, rejectProject, changeProjectStatus, transferProject } = useProjectActions({
    setActionsLoading,
    walletAddress: walletAddress ?? undefined,
    refreshCallback: refreshData,
  });

  // Use global featured projects hook
  const { toggleFeatured, isFeatured } = useFeaturedProjects();

  // �‍♂️ IMPORTANT: This page requires CONFIRMED admin status, not tentative
  // Sidebars can show based on initial server props, but this endpoint requires API verification

  // Check admin status first with timeout fallback - ONLY ONCE
  useEffect(() => {
    if (isAdmin !== null) return; // Don't run if already determined

    const checkAdminStatus = async () => {
      // If already determined, don't check again
      if (isAdmin !== null) return;

      try {
        // Try multiple sources for wallet address (client-side only)
        let walletAddress = null;
        if (typeof window !== 'undefined') {
          // 1. First try localStorage (most reliable)
          if (window.localStorage) {
            try {
              const sessionData = localStorage.getItem('wallet-session');
              if (sessionData) {
                const parsedSession = JSON.parse(sessionData) as unknown as WalletSession;
                walletAddress = parsedSession.address?.toLowerCase();
              }
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('❌ Error reading wallet session from localStorage:', e);
              }
            }
          }

          // 2. Fallback to cookies (multiple possible cookie names)
          if (!walletAddress) {
            try {
              // Try wallet-address cookie first
              walletAddress = document.cookie
                .split('; ')
                .find((row) => row.startsWith('wallet-address='))
                ?.split('=')[1];

              // If not found, try thirdweb specific cookie
              if (!walletAddress) {
                walletAddress = document.cookie
                  .split('; ')
                  .find((row) => row.startsWith('thirdweb:wallet-address='))
                  ?.split('=')[1];
              }

              // If still not found, search for any cookie containing wallet address
              if (!walletAddress) {
                const allCookies = document.cookie.split('; ');
                const walletCookie = allCookies.find(cookie => {
                  const parts = cookie.split('=');
                  return parts.length === 2 &&
                         parts[0] &&
                         parts[0].includes('wallet') &&
                         parts[0].includes('address') &&
                         parts[1] &&
                         parts[1].startsWith('0x') &&
                         parts[1].length === 42;
                });
                if (walletCookie) {
                  walletAddress = walletCookie.split('=')[1];
                }
              }
            } catch (e) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('❌ Error reading wallet address from cookies:', e);
              }
            }
          }
        }

        if (!walletAddress) {
          setAuthError('No se pudo obtener dirección de wallet');
          setIsAdmin(false);
          return;
        }

        // Store wallet address for use in hooks
        setWalletAddress(walletAddress);

        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-thirdweb-address': walletAddress,
          'x-wallet-address': walletAddress,
          'x-user-address': walletAddress,
        };

        const response = await fetch('/api/admin/verify', {
          headers: requestHeaders,
        });

        if (!response.ok) {
          setAuthError(`Verificación fallida: ${response.status}`);
          setIsAdmin(false);
          return;
        }

        const data = await response.json() as { isAdmin?: boolean; isSuperAdmin?: boolean };

        // User is admin if they have admin privileges OR super admin privileges
        const userIsAdmin = (data.isAdmin ?? false) || (data.isSuperAdmin ?? false);
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🏛️ Admin dashboard auth result:', userIsAdmin, { data, walletAddress });

          // Enhanced debugging for admin verification
          console.log('🏛️ Admin dashboard: ENHANCED AUTH DEBUG:', {
            walletAddress,
            isSuperAdmin: walletAddress?.toLowerCase() === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
            apiResponse: data,
            finalIsAdmin: userIsAdmin
          });
        }

        setIsAdmin(userIsAdmin);
        setAuthError(null);

      } catch (error) {
        setAuthError('Error al verificar permisos administrativos');
        setIsAdmin(false);
      }
    };

    // Start admin verification without timeout - let it complete naturally
    void checkAdminStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Set loading to false immediately if user is not admin (prevents infinite loading)
    if (isAdmin === false) {
      setLoading(false);
      return;
    }

    // Only fetch data if user is verified as admin
    if (isAdmin !== true) {
      return;
    }

    const fetchData = async () => {
      try {
        console.log('🏛️ Admin dashboard: Starting data fetch...');
        // Get current wallet address for headers
        let currentWalletAddress = null;
        if (typeof window !== 'undefined') {
          if (window.localStorage) {
            try {
              const sessionData = localStorage.getItem('wallet-session');
              if (sessionData) {
                const parsedSession = JSON.parse(sessionData) as unknown as WalletSession;
                currentWalletAddress = parsedSession.address?.toLowerCase();
              }
            } catch (e) {
              console.warn('Error getting wallet for API calls:', e);
            }
          }
        }

        // Fetch projects - Send wallet authentication header
        console.log('🏛️ Admin dashboard: Calling /api/admin/projects with wallet:', currentWalletAddress?.substring(0, 10) + '...');

        // Enhanced debugging for API calls
        if (process.env.NODE_ENV === 'development') {
          console.log('🏛️ Admin dashboard: API CALL DEBUG:', {
            walletAddress: currentWalletAddress,
            headers: {
              'x-thirdweb-address': currentWalletAddress,
              'x-wallet-address': currentWalletAddress,
              'x-user-address': currentWalletAddress
            }
          });
        }
        const projectsRes = await fetch('/api/admin/projects', {
          headers: {
            'Content-Type': 'application/json',
            ...(currentWalletAddress && {
              'x-thirdweb-address': currentWalletAddress,
              'x-wallet-address': currentWalletAddress,
              'x-user-address': currentWalletAddress
            }),
          }
        });

        console.log('🏛️ Admin dashboard: Projects response status:', projectsRes.status, projectsRes.statusText);

        // Enhanced debugging for API response
        if (process.env.NODE_ENV === 'development') {
          console.log('🏛️ Admin dashboard: API RESPONSE DEBUG:', {
            status: projectsRes.status,
            statusText: projectsRes.statusText,
            walletAddress: currentWalletAddress,
            responseHeaders: Object.fromEntries(projectsRes.headers.entries())
          });
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json() as Project[];
          console.log('🏛️ Admin dashboard: Projects loaded successfully:', projectsData.length, projectsData);
          console.log('🏛️ Admin dashboard: First project applicantWalletAddress:', projectsData[0]?.applicantWalletAddress);
          console.log('🏛️ Admin dashboard: First project all fields:', projectsData[0] ? {
            id: projectsData[0].id,
            title: projectsData[0].title,
            applicantWalletAddress: projectsData[0].applicantWalletAddress,
            applicantName: projectsData[0].applicantName,
            status: projectsData[0].status,
            featured: projectsData[0].featured
          } : 'No projects');

          // Enhanced debugging for wallet matching in admin dashboard
          if (projectsData.length > 0 && currentWalletAddress) {
            console.log('🏛️ Admin dashboard: WALLET MATCHING DEBUG:', {
              adminWallet: currentWalletAddress,
              projectWallets: projectsData.slice(0, 5).map(p => ({
                id: p.id,
                title: p.title,
                applicantWallet: p.applicantWalletAddress,
                matches: p.applicantWalletAddress?.toLowerCase() === currentWalletAddress.toLowerCase()
              }))
            });
          }
          setProjects(projectsData);
        } else {
          const errorText = await projectsRes.text();
          console.error('🏛️ Admin dashboard: Failed to load projects:', {
            status: projectsRes.status,
            statusText: projectsRes.statusText,
            errorBody: errorText,
            walletAddress: currentWalletAddress,
            requestHeaders: {
              'x-thirdweb-address': currentWalletAddress,
              'x-wallet-address': currentWalletAddress,
              'x-user-address': currentWalletAddress
            }
          });

          // Enhanced debugging for API errors
          if (process.env.NODE_ENV === 'development') {
            console.log('🏛️ Admin dashboard: API ERROR DEBUG:', {
              error: errorText,
              status: projectsRes.status,
              walletAddress: currentWalletAddress,
              suggestion: projectsRes.status === 401 ? 'Authentication failed - check wallet address' :
                         projectsRes.status === 403 ? 'Authorization failed - check admin permissions' :
                         'Unknown error - check server logs'
            });
          }
        }

        // Fetch administrators - Send wallet authentication header
        const adminsRes = await fetch('/api/admin/administrators', {
          headers: {
            'Content-Type': 'application/json',
            ...(currentWalletAddress && {
              'x-thirdweb-address': currentWalletAddress,
              'x-wallet-address': currentWalletAddress,
              'x-user-address': currentWalletAddress
            }),
          }
        });
        if (adminsRes.ok) {
          const rawAdminsData = await adminsRes.json() as (Omit<AdminData, 'role'> & { role?: string })[];
          // Ensure each admin has a role property (default to 'admin')
          const processedAdmins = rawAdminsData.map((admin) => ({
            id: admin.id,
            walletAddress: admin.walletAddress,
            alias: admin.alias,
            role: admin.role ?? 'admin' // Default role for all admins
          } as AdminData));
          console.log('🏛️ Admin dashboard: Admins loaded successfully:', processedAdmins.length, processedAdmins);

          // Enhanced debugging for admin verification
          if (processedAdmins.length > 0 && currentWalletAddress) {
            console.log('🏛️ Admin dashboard: ADMIN VERIFICATION DEBUG:', {
              currentWallet: currentWalletAddress,
              isCurrentUserAdmin: processedAdmins.some(a => a.walletAddress?.toLowerCase() === currentWalletAddress.toLowerCase()),
              allAdmins: processedAdmins.map(a => ({
                wallet: a.walletAddress?.substring(0, 10) + '...' || 'undefined',
                alias: a.alias,
                role: a.role,
                isCurrentUser: a.walletAddress?.toLowerCase() === currentWalletAddress.toLowerCase()
              }))
            });
          }
          setAdmins(processedAdmins);
        } else {
          const errorText = await adminsRes.text();
          console.error('🏛️ Admin dashboard: Failed to load admins:', {
            status: adminsRes.status,
            statusText: adminsRes.statusText,
            errorBody: errorText,
            walletAddress: currentWalletAddress
          });
        }

        // Fetch users - Send wallet authentication header
        const usersRes = await fetch('/api/admin/users', {
          headers: {
            'Content-Type': 'application/json',
            ...(currentWalletAddress && {
              'x-thirdweb-address': currentWalletAddress,
              'x-wallet-address': currentWalletAddress,
              'x-user-address': currentWalletAddress
            }),
          }
        });
        console.log('🏛️ Admin dashboard: Users API response status:', usersRes.status, usersRes.statusText);

        if (usersRes.ok) {
          const usersData = await usersRes.json() as UserData[];
          console.log('🏛️ Admin dashboard: Users loaded successfully:', usersData.length, usersData);
          console.log('🏛️ Admin dashboard: First user sample:', usersData[0] ? {
            id: usersData[0].id,
            walletAddress: usersData[0].walletAddress,
            role: usersData[0].role,
            projectCount: usersData[0].projectCount
          } : 'No users');

          // Enhanced debugging for user roles and project counts
          if (usersData.length > 0 && currentWalletAddress) {
            console.log('🏛️ Admin dashboard: USER ROLES DEBUG:', {
              adminWallet: currentWalletAddress,
              usersWithProjects: usersData.filter(u => u.projectCount > 0).length,
              usersByRole: {
                applicant: usersData.filter(u => u.role === 'applicant').length,
                pandorian: usersData.filter(u => u.role === 'pandorian').length,
                admin: usersData.filter(u => u.role === 'admin').length
              },
              sampleUsers: usersData.slice(0, 3).map(u => ({
                wallet: u.walletAddress?.substring(0, 10) + '...' || 'undefined',
                role: u.role,
                projectCount: u.projectCount,
                isCurrentUser: u.walletAddress?.toLowerCase() === currentWalletAddress.toLowerCase()
              }))
            });
          } else {
            console.log('🏛️ Admin dashboard: No users received or no current wallet address');
          }
          setUsers(usersData);
        } else {
          const errorText = await usersRes.text();
          console.error('🏛️ Admin dashboard: Failed to load users:', {
            status: usersRes.status,
            statusText: usersRes.statusText,
            errorBody: errorText,
            walletAddress: currentWalletAddress,
            responseHeaders: Object.fromEntries(usersRes.headers.entries())
          });

          // Enhanced debugging for API errors
          console.log('🏛️ Admin dashboard: API ERROR DEBUG:', {
            url: usersRes.url,
            status: usersRes.status,
            statusText: usersRes.statusText,
            errorBody: errorText,
            suggestion: usersRes.status === 401 ? 'Authentication failed - check wallet address' :
                       usersRes.status === 403 ? 'Authorization failed - check admin permissions' :
                       usersRes.status === 500 ? 'Server error - check API logs' :
                       'Unknown error - check network tab'
          });
        }
      } catch (error) {
        console.error('🏛️ Admin dashboard: Error fetching data:', error);
        // Silent error handling in production
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [isAdmin]);

  // Enhanced projects with completion data (simplified for now)
  const enhancedProjects = useMemo(() => {
    return projects.map(project => ({
      ...project,
      completionData: undefined // Simplified - can be enhanced later if needed
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
      pending: 0,
      approved: 0,
      live: 0,
      completed: 0,
      rejected: 0,
    };

    enhancedProjects.forEach(project => {
      if (project.status in counts) {
        counts[project.status]++;
      }
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

  // If user is not admin and we're not loading, show unauthorized component
  if (!isAdmin && isAdmin !== null) {
    return <UnauthorizedAccess authError={authError} />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Gestionar plataforma
          </p>
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-500/20 rounded text-xs text-red-200">
              <p><strong>Admin Debug Info:</strong></p>
              <p>Wallet: {walletAddress?.substring(0, 10)}...{walletAddress?.slice(-8)}</p>
              <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
              <p>Auth Error: {authError ?? 'None'}</p>
              <p>Projects: {projects.length}</p>
              <p>Users: {users.length}</p>
            </div>
          )}
        </div>
        <ProjectApplicationButton
          buttonText="➕ Añadir Proyecto"
          className="px-3 sm:px-4 py-2 bg-lime-500 hover:bg-lime-600 text-zinc-900 rounded-md font-semibold transition text-sm sm:text-base whitespace-nowrap"
          variant="default"
        />
      </div>

      <AdminTabs swaps={mockSwaps} users={users} showSettings={true} showUsers={true}>
        {/* Tab de proyectos */}
        <div key="projects-tab" className="space-y-6">
          {/* Filtros de estado */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
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
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-lime-500 text-black'
                      : `${
                          status === 'pending' ? 'text-yellow-300' :
                          status === 'approved' ? 'text-blue-300' :
                          status === 'live' ? 'text-green-300' :
                          status === 'completed' ? 'text-emerald-300' :
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
                  <th className="px-4 py-3 text-left font-semibold text-gray-300">Estado</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-300">Featured</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-300">Detalles</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700 bg-zinc-900">
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No hay creaciones registrados{statusFilter !== 'all' ? ` con estado "${statusFilter}"` : ''}.
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
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() => setStatusDropdown(statusDropdown === p.id ? null : p.id)}
                            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                              p.status === "pending" ? "bg-yellow-600 hover:bg-yellow-700" :
                              p.status === "approved" ? "bg-blue-600 hover:bg-blue-700" :
                              p.status === "live" ? "bg-green-600 hover:bg-green-700" :
                              p.status === "completed" ? "bg-emerald-600 hover:bg-emerald-700" :
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

                      {/* Featured Column */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isFeatured(Number(p.id)) && (
                            <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                          )}
                          <button
                            onClick={() => {
                              try {
                                const projectId = Number(p.id);
                                const currentFeaturedStatus = isFeatured(projectId);
                                const newFeaturedStatus = !currentFeaturedStatus;
                                console.log('🔧 Admin: Toggling featured status for project:', projectId, 'from:', currentFeaturedStatus, 'to:', newFeaturedStatus);

                                // Use global featured hook
                                toggleFeatured(projectId);

                                // Update local state immediately for visual feedback
                                setProjects(prevProjects =>
                                  prevProjects.map(proj =>
                                    proj.id === p.id ? { ...proj, featured: newFeaturedStatus } : proj
                                  )
                                );

                                console.log('🔧 Admin: Featured status updated globally for project:', projectId);
                              } catch (error) {
                                console.error('🔧 Admin: Error updating featured status:', error);
                              }
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                              isFeatured(Number(p.id))
                                ? 'bg-lime-500 hover:bg-lime-600 text-black shadow-lg ring-2 ring-lime-400/30'
                                : 'bg-zinc-700 hover:bg-zinc-600 text-gray-300 hover:text-white border border-zinc-600 hover:border-zinc-500'
                            }`}
                          >
                            {isFeatured(Number(p.id)) ? '✓ Featured' : '☆ Feature'}
                          </button>
                        </div>
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
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              if (actionsDropdown === p.id) {
                                setActionsDropdown(null);
                                setActionsDropdownPosition(null);
                              } else {
                                setActionsDropdown(p.id);
                                setActionsDropdownPosition({
                                  top: rect.bottom + window.scrollY,
                                  left: rect.left + window.scrollX - 60
                                });
                              }
                            }}
                            className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-gray-300 hover:text-white rounded text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <span>Acciones</span>
                            <svg
                              className="w-3 h-3 transition-transform"
                              style={{transform: actionsDropdown === p.id ? 'rotate(180deg)' : 'rotate(0deg)'}}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
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
                                  {p.website && (
                                    <a
                                      href={p.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-emerald-300 hover:text-emerald-200"
                                    >
                                      🌐 Sitio Web
                                    </a>
                                  )}
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
                                  {!p.website && !p.whitepaperUrl && !p.twitterUrl && !p.discordUrl && !p.telegramUrl && !p.linkedinUrl && (
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
                                <div>
                                  <span className="text-gray-400">Propiedad: </span>
                                  <span className="text-white font-mono text-xs">
                                    {p.applicantWalletAddress ? `${p.applicantWalletAddress.substring(0, 6)}...${p.applicantWalletAddress.substring(38)}` : "Sin asignar"}
                                  </span>
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
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setStatusDropdown(null);
              }
            }}
            aria-label="Cerrar menú de estado"
            type="button"
            tabIndex={-1}
          />
          <div
            className="fixed z-[10000] min-w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl"
            style={{
              top: '200px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
            role="menu"
            aria-label="Opciones de estado del proyecto"
            tabIndex={-1}
          >
            <div className="py-1" role="none">
              {["pending", "approved", "rejected", "live", "completed"].map((statusOption) => {
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                    disabled={actionsLoading[`change-status-${statusDropdown}`]}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between ${
                      currentProject?.status === statusOption ? 'font-bold bg-zinc-800 text-white' :
                      'text-gray-300 hover:text-white'
                    }`}
                    role="menuitem"
                    type="button"
                    tabIndex={0}
                  >
                    <span>{statusOption}</span>
                    {actionsLoading[`change-status-${statusDropdown}`] && (
                      <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Dropdown de Acciones - Renderizado fuera de la tabla para z-index máximo */}
      {actionsDropdown && (
        <>
          <button
            className="fixed inset-0 z-[9999] bg-black/20"
            onClick={() => setActionsDropdown(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setActionsDropdown(null);
              }
            }}
            aria-label="Cerrar menú de acciones"
            type="button"
            tabIndex={-1}
          />
          <div
            className="fixed z-[10000] min-w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl"
            style={{
              top: (actionsDropdownPosition?.top ?? 0) + 4,
              left: actionsDropdownPosition?.left ?? 0,
            }}
            role="menu"
            aria-label="Opciones de acciones del proyecto"
            tabIndex={-1}
          >
            <div className="py-1" role="none">
              {(() => {
                const currentProject = projects.find(p => p.id === actionsDropdown);
                if (!currentProject) return null;

                const actions = [];

                // Agregar acciones comunes
                actions.push(
                  <button
                    key="delete"
                    onClick={async () => {
                      await deleteProject(currentProject.id, currentProject.title);
                      setActionsDropdown(null);
                    }}
                    disabled={actionsLoading[`delete-${currentProject.id}`]}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between text-red-400 hover:text-red-300`}
                    role="menuitem"
                    type="button"
                    tabIndex={0}
                  >
                    <span>🗑️ Eliminar</span>
                    {actionsLoading[`delete-${currentProject.id}`] && (
                      <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </button>
                );

                // Agregar acciones específicas según el status
                if (currentProject.status === 'pending') {
                  actions.unshift(
                    <button
                      key="approve"
                      onClick={async () => {
                        await approveProject(currentProject.id, currentProject.title);
                        setActionsDropdown(null);
                      }}
                      disabled={actionsLoading[`approve-${currentProject.id}`]}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between text-green-400 hover:text-green-300`}
                      role="menuitem"
                      type="button"
                      tabIndex={0}
                    >
                      <span>✓ Aprobar</span>
                      {actionsLoading[`approve-${currentProject.id}`] && (
                        <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  );

                  actions.splice(1, 0,
                    <button
                      key="reject"
                      onClick={async () => {
                        await rejectProject(currentProject.id, currentProject.title);
                        setActionsDropdown(null);
                      }}
                      disabled={actionsLoading[`reject-${currentProject.id}`]}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between text-orange-400 hover:text-orange-300`}
                      role="menuitem"
                      type="button"
                      tabIndex={0}
                    >
                      <span>✗ Denegar</span>
                      {actionsLoading[`reject-${currentProject.id}`] && (
                        <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  );
                } else {
                  // BOTÓN TRANSFERIR - disponible para TODOS los proyectos
                  actions.unshift(
                    <button
                      key="transfer"
                      onClick={async () => {
                        const newOwnerWallet = prompt('Introduce la dirección de wallet del nuevo propietario:');
                        if (newOwnerWallet && /^0x[a-fA-F0-9]{40}$/.test(newOwnerWallet)) {
                          await transferProject(currentProject.id, currentProject.title, newOwnerWallet);
                          setActionsDropdown(null);
                        } else if (newOwnerWallet) {
                          alert('Dirección de wallet inválida. Debe ser una dirección Ethereum válida (0x...).');
                        }
                      }}
                      disabled={actionsLoading[`transfer-${currentProject.id}`]}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between text-purple-400 hover:text-purple-300`}
                      role="menuitem"
                      type="button"
                      tabIndex={0}
                    >
                      <span>🔄 Transferir</span>
                      {actionsLoading[`transfer-${currentProject.id}`] && (
                        <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  );

                  // BOTÓN EDITAR - disponible para TODOS los proyectos que no estén pending
                  actions.splice(1, 0,
                    <Link
                      key="edit"
                      href={`/admin/projects/${currentProject.id}/edit`}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors flex items-center text-blue-400 hover:text-blue-300"
                      onClick={() => setActionsDropdown(null)}
                      title="Editar proyecto"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      ✏️ Editar
                    </Link>
                  );
                }

                return actions;
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

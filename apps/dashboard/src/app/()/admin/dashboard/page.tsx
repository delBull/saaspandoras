'use client';

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { AdminSettings } from "@/components/admin/AdminSettings";
import WhatsAppLeadsTab from "@/components/admin/WhatsAppLeadsTab";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";

import { useProjectActions } from "@/hooks/useProjectActions";
import { useFeaturedProjects } from "@/hooks/useFeaturedProjects";
import type { ProjectStatus, Project, AdminData, UserData } from "@/types/admin";
import { ProjectApplicationButton } from "@/components/ProjectApplicationButton";
import { ProjectTableView } from "@/components/ProjectTableView";
import { ProjectCardsView } from "@/components/ProjectCardsView";
import { ShortlinksAnalyticsTab } from "@/components/admin/ShortlinksAnalyticsTab";

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

// export const dynamic = 'force-dynamic'; // Optimization: Removed.

// CRÍTICO: Movemos TODAS las fetch calls al useEffect cliente-side
// ✅ Esto evita que se ejecuten durante el BUILD de Vercel

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  // statusFilter is now declared later in the component
  const [expandedProject, setExpandedProject] = useState<string | null>(null); // Para controlar el dropdown de detalles
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null); // Para controlar el dropdown de estado
  const [actionsDropdown, setActionsDropdown] = useState<string | null>(null); // Para controlar el dropdown de acciones
  const [actionsDropdownPosition, setActionsDropdownPosition] = useState<{ top: number, left: number } | null>(null); // Posición del dropdown
  const [actionsLoading, setActionsLoading] = useState<Record<string, boolean>>({}); // Track loading states for actions
  const [authError, setAuthError] = useState<string | null>(null); // Para mostrar errores de autenticación

  // New state for improved UX
  const [searchQuery, setSearchQuery] = useState(''); // Search/filter by title
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status' | 'title'>('date'); // Sorting options
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Sort direction
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table'); // View toggle
  // Pagination variables (for future use)
  const [_itemsPerPage] = useState(15); // Pagination limit
  const [_setCurrentPage] = useState<number>();

  // State for wallet address
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Status filter type - simplified to avoid redundant union
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Function to refresh all data
  const refreshData = async () => {
    try {
      let currentWalletAddress = walletAddress;
      if (!currentWalletAddress && typeof window !== 'undefined') {
        const sessionData = localStorage.getItem('wallet-session');
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData) as any;
          currentWalletAddress = parsedSession.address?.toLowerCase();
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        ...(currentWalletAddress && {
          'x-thirdweb-address': currentWalletAddress,
          'x-wallet-address': currentWalletAddress,
        }),
      };

      const [projectsRes, adminsRes, usersRes] = await Promise.all([
        fetch('/api/admin/projects', { headers }),
        fetch('/api/admin/administrators', { headers }),
        fetch('/api/admin/users', { headers })
      ]);

      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (adminsRes.ok) {
        const raw = await adminsRes.json() as any[];
        setAdmins(raw.map(a => ({ ...a, role: a.role ?? 'admin' })));
      }
      if (usersRes.ok) setUsers(await usersRes.json());

    } catch (error) {
      console.error('🔄 Admin dashboard: Error refreshing data:', error);
    }
  };

  // Use project actions hook with refresh callback
  const { deleteProject, approveProject, rejectProject, changeProjectStatus, transferProject, deployProtocol, certifySale } = useProjectActions({
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

        // ⚡ OPTIMISTIC CHECK: If wallet is Super Admin, bypass API check for instant hydration
        const SUPER_ADMIN = '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';
        if (walletAddress?.toLowerCase() === SUPER_ADMIN) {
          console.log('🏛️ Admin dashboard: ⚡ Optimistic Super Admin bypass triggered');
          setWalletAddress(walletAddress);
          setIsAdmin(true);
          setAuthError(null);
          return;
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
  }, []);

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
        let currentWalletAddress = null;
        if (typeof window !== 'undefined') {
          const sessionData = localStorage.getItem('wallet-session');
          if (sessionData) {
            const parsedSession = JSON.parse(sessionData) as any;
            currentWalletAddress = parsedSession.address?.toLowerCase();
          }
        }

        const headers = {
          'Content-Type': 'application/json',
          ...(currentWalletAddress && {
            'x-thirdweb-address': currentWalletAddress,
            'x-wallet-address': currentWalletAddress,
          }),
        };

        const fetchWithTimeout = async (url: string, timeout = 10000) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);
          try {
            const response = await fetch(url, { ...{ headers }, signal: controller.signal });
            clearTimeout(id);
            return response;
          } catch (e) {
            clearTimeout(id);
            console.warn(`⚠️ Fetch timeout or error for ${url}:`, e);
            return { ok: false, status: 408, json: () => Promise.resolve({}) } as any;
          }
        };

        const [projectsRes, adminsRes, usersRes] = await Promise.all([
          fetchWithTimeout('/api/admin/projects'),
          fetchWithTimeout('/api/admin/administrators'),
          fetchWithTimeout('/api/admin/users')
        ]);

        if (projectsRes.ok) setProjects(await projectsRes.json());
        if (adminsRes.ok) {
          const raw = await adminsRes.json() as any[];
          setAdmins(raw.map(a => ({ ...a, role: a.role ?? 'admin' })));
        }
        if (usersRes.ok) setUsers(await usersRes.json());

      } catch (error) {
        console.error('🏛️ Admin dashboard: Error fetching data:', error);
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

  // Filter and sort projects based on all filters
  const filteredProjects = useMemo(() => {
    let filtered = enhancedProjects;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        (project.applicantName?.toLowerCase().includes(query) ?? false) ||
        (project.businessCategory?.toLowerCase().includes(query) ?? false)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number = a.title;
      let bValue: string | number = b.title;

      switch (sortBy) {
        case 'amount':
          aValue = Number(a.targetAmount ?? 0);
          bValue = Number(b.targetAmount ?? 0);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'date':
          // For now, sort by ID (assuming higher ID = newer)
          aValue = Number(a.id);
          bValue = Number(b.id);
          break;
        case 'title':
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sorted;
  }, [enhancedProjects, statusFilter, searchQuery, sortBy, sortOrder]);

  // Get status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      approved: 0,
      live: 0,
      completed: 0,
      rejected: 0,
      draft: 0, // Add draft status to counts
    };

    enhancedProjects.forEach(project => {
      if (project.status && project.status in counts) {
        counts[project.status] = (counts[project.status] ?? 0) + 1;
      } else {
        console.warn('🔧 Status counts: Unknown status:', project.status, 'for project:', project.id);
      }
    });

    console.log('🔧 Status counts breakdown:', {
      total: enhancedProjects.length,
      pending: counts.pending,
      approved: counts.approved,
      live: counts.live,
      completed: counts.completed,
      rejected: counts.rejected,
      detailed: enhancedProjects.map(p => ({ id: p.id, status: p.status }))
    });

    return counts;
  }, [enhancedProjects]);

  // Find current user ID based on wallet
  const currentUserId = useMemo(() => {
    if (!walletAddress || users.length === 0) return undefined;
    const user = users.find(u => u.walletAddress?.toLowerCase() === walletAddress.toLowerCase());
    return user?.id;
  }, [users, walletAddress]);

  // No longer blocking the ENTIRE page with a full-screen skeleton if we can avoid it
  // But we still need to gate the sensitive content

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
        {/* <ProjectApplicationButton
          buttonText="➕"
          className="px-3 sm:px-4 py-2 mr-24 bg-lime-500 hover:bg-lime-600 text-zinc-900 rounded-md font-semibold transition text-sm sm:text-base whitespace-nowrap"
          variant="default"
        /> */}
      </div>

      <Suspense fallback={<div className="h-8 w-full animate-pulse bg-zinc-800 rounded" />}>
        {(!isAdmin && isAdmin !== null) ? (
          <UnauthorizedAccess authError={authError} />
        ) : (
          <AdminTabs swaps={mockSwaps} users={users} showSettings={true} showUsers={true} showShortlinks={true} showMarketing={true} currentUserId={currentUserId}>
            {/* Tab de proyectos */}
            <div key="projects-tab" className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  <div className="h-20 bg-zinc-800/50 animate-pulse rounded-lg" />
                  <div className="h-12 bg-zinc-800/50 animate-pulse rounded-lg" />
                  <div className="h-64 bg-zinc-800/50 animate-pulse rounded-lg" />
                </div>
              ) : (
                <>
                  {/* Barra de herramientas mejorada */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex flex-col xl:flex-row gap-4">
                      {/* Búsqueda */}
                      <div className="flex-1 min-w-0">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="🔍 Buscar proyecto por título..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 pl-10 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-gray-400 focus:border-lime-500 focus:outline-none transition-colors"
                          />
                          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>

                      {/* Controles */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        {/* Vista */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Vista:</span>
                          <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'table'
                              ? 'bg-lime-500 text-black'
                              : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                              }`}
                          >
                            📊 Tabla
                          </button>
                          <button
                            onClick={() => setViewMode('cards')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'cards'
                              ? 'bg-lime-500 text-black'
                              : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                              }`}
                          >
                            🃏 Cards
                          </button>
                        </div>

                        {/* Ordenamiento */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Orden:</span>
                          <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                              const [by, order] = e.target.value.split('-');
                              setSortBy(by as 'date' | 'amount' | 'status' | 'title');
                              setSortOrder(order as 'asc' | 'desc');
                            }}
                            className="px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:border-lime-500 focus:outline-none transition-colors text-sm"
                          >
                            <option value="date-desc">📅 Fecha ↓</option>
                            <option value="date-asc">📅 Fecha ↑</option>
                            <option value="title-asc">📝 Título A-Z</option>
                            <option value="title-desc">📝 Título Z-A</option>
                            <option value="amount-desc">💰 Monto ↓</option>
                            <option value="amount-asc">💰 Monto ↑</option>
                            <option value="status-desc">📊 Estado ↓</option>
                            <option value="status-asc">📊 Estado ↑</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filtros de estado mejorados */}
                  <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-200 mb-2 sm:mb-0">Filtrar por Estado</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setStatusFilter('all')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${statusFilter === 'all'
                            ? 'bg-lime-500 text-black shadow-lg'
                            : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600 hover:text-white'
                            }`}
                        >
                          Todos ({projects.length})
                        </button>
                        {Object.entries(statusCounts).map(([status, count]) => (
                          count > 0 && (
                            <button
                              key={status}
                              onClick={() => setStatusFilter(status)}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${statusFilter === status
                                ? 'bg-lime-500 text-black shadow-lg'
                                : `${status === 'pending' ? 'text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20' :
                                  status === 'approved' ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20' :
                                    status === 'live' ? 'text-green-300 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20' :
                                      status === 'completed' ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20' :
                                        status === 'draft' ? 'text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20' :
                                          'text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20'
                                } bg-zinc-700 hover:bg-zinc-600`
                                }`}
                            >
                              {status?.charAt(0)?.toUpperCase() + status?.slice(1) || status} ({count})
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas rápida */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Total Proyectos</p>
                          <p className="text-2xl font-bold text-white">{projects.length}</p>
                        </div>
                        <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
                          📊
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Monto Total Meta</p>
                          <p className="text-2xl font-bold text-lime-400">
                            ${(projects.reduce((total, p) => total + Number(p.targetAmount || 0), 0)).toLocaleString()}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
                          💰
                        </div>
                      </div>
                    </div>
                    {/* Count total por estado oculto */}
                    {/* 
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Aprobados</p>
                  <p className="text-2xl font-bold text-green-400">
                    {projects.filter(p => p.status === 'approved' || p.status === 'live' || p.status === 'completed').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  ✅
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">En Revisión</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {projects.filter(p => p.status === 'pending').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  ⏳
                </div>
              </div>
            </div>
            */}
                  </div>

                  {/* Vista usando componentes modularizados */}
                  {viewMode === 'cards' ? (
                    <ProjectCardsView
                      projects={filteredProjects}
                      expandedProject={expandedProject}
                      setExpandedProject={setExpandedProject}
                      setStatusDropdown={setStatusDropdown}
                      statusDropdown={statusDropdown}
                    />
                  ) : (
                    <ProjectTableView
                      projects={filteredProjects}
                      expandedProject={expandedProject}
                      setExpandedProject={setExpandedProject}
                      actionsDropdown={actionsDropdown}
                      setActionsDropdown={setActionsDropdown}
                      setActionsDropdownPosition={setActionsDropdownPosition}
                      isFeatured={isFeatured}
                      toggleFeatured={toggleFeatured}
                      setStatusDropdown={setStatusDropdown}
                      statusDropdown={statusDropdown}
                      onDeployProtocol={deployProtocol}
                      actionsLoading={actionsLoading}
                    />
                  )}
                </>
              )}
            </div>

            {/* Tab de configuración */}
            <AdminSettings key="settings-tab" initialAdmins={admins} />

            {/* Tab de Shortlinks Analytics */}
            <ShortlinksAnalyticsTab key="shortlinks-tab" />
          </AdminTabs>
        )}
      </Suspense>

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
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between ${currentProject?.status === statusOption ? 'font-bold bg-zinc-800 text-white' :
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

                // SCaaS Actions (High Priority)

                // 1. Deploy Protocol button
                // Show if project is approved/live but NOT deployed yet
                // checking status !== 'pending' && status !== 'rejected' implicit in approval flow?
                // Actually, let's allow it for approved/live projects.


                // 2. Certify Sale button
                // Show ONLY if deployed AND not completed
                if (currentProject.deploymentStatus === 'deployed' && currentProject.status !== 'completed') {
                  actions.push(
                    <button
                      key="certify"
                      onClick={async () => {
                        await certifySale(currentProject.id, currentProject.title, currentProject.slug);
                        setActionsDropdown(null);
                      }}
                      disabled={actionsLoading[`certify-${currentProject.id}`]}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between text-amber-400 hover:text-amber-300 font-semibold`}
                      role="menuitem"
                      type="button"
                      tabIndex={0}
                    >
                      <span>BS 🏆 Certificar Venta</span>
                      {actionsLoading[`certify-${currentProject.id}`] && (
                        <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </button>
                  );
                }

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

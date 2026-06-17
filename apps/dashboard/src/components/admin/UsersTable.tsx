'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { UserData, UserRole } from '@/types/admin';
import { UserKeyStatus } from './UserKeyStatus';
import { resolveIpfsUrl } from '@/lib/utils';

const USERS_PER_PAGE = 10;

interface UsersTableProps {
  users: UserData[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [usersPage, setUsersPage] = useState(1);

  // Ensure users is always an array - memoized to prevent unnecessary re-renders
  const usersArray = useMemo(() => Array.isArray(users) ? users : [], [users]);

  // Filtered users based on selected role filter
  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return usersArray;
    return usersArray.filter(user => user.role === roleFilter);
  }, [usersArray, roleFilter]);

  // Paginated slice
  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, usersPage]);
  const totalUsersPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  // Role counts for filter badges
  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      applicant: 0,
      pandorian: 0,
      admin: 0,
    };

    usersArray.forEach(user => {
      counts[user.role]++;
    });

    return counts;
  }, [usersArray]);

  // Function to get role display text and styling
  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case 'applicant':
        return { text: '🔍 Applicant', className: 'bg-green-600 text-white' };
      case 'pandorian':
        return { text: '✨ Pandorian', className: 'bg-blue-600 text-white' };
      case 'admin':
        return { text: '⚙️ Admin', className: 'bg-red-600 text-white' };
      default:
        return { text: role, className: 'bg-gray-600 text-white' };
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Usuarios</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Gestión completa de la comunidad
          </p>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          </svg>
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-400">{usersArray.length}</div>
            <div className="text-xs text-gray-400">Total Usuarios</div>
          </div>
        </div>
      </div>

      {/* Barra de herramientas mejorada */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <div className="flex flex-col xl:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Buscar usuario por nombre, email o wallet..."
                className="w-full px-4 py-2 pl-10 bg-zinc-900 border border-zinc-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            {/* Ordenamiento */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Orden:</span>
              <select className="px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm">
                <option>📅 Última conexión ↓</option>
                <option>📅 Última conexión ↑</option>
                <option>📝 Nombre A-Z</option>
                <option>📝 Nombre Z-A</option>
                <option>📊 Protocolos ↓</option>
                <option>📊 Protocolos ↑</option>
                <option>🔗 Conexiones ↓</option>
                <option>🔗 Conexiones ↑</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros por rol mejorados */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-200 mb-2 sm:mb-0">Filtrar por Rol</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${roleFilter === 'all'
                ? 'bg-cyan-500 text-black shadow-lg'
                : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600 hover:text-white'
                }`}
            >
              Todos ({users.length})
            </button>
            {(Object.entries(roleCounts) as [UserRole, number][]).map(([role, count]) => {
              const { text } = getRoleDisplay(role);
              return count > 0 ? (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${roleFilter === role
                    ? 'bg-cyan-500 text-black shadow-lg'
                    : `${role === 'applicant' ? 'text-green-300 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20' :
                      role === 'pandorian' ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20' :
                        'text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20'
                    } bg-zinc-700 hover:bg-zinc-600`
                    }`}
                >
                  {text} ({count})
                </button>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-700 text-sm">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Usuario</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Wallet</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Rol</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Protocolos</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Conexiones</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Última Conex.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700 bg-zinc-900">
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No hay usuarios registrados{roleFilter !== 'all' ? ` con rol "${roleFilter}"` : ''}.
                </td>
              </tr>
            )}
            {paginatedUsers.map((user) => {
              const roleDisplay = getRoleDisplay(user.role);
              return (
                <tr key={user.id} className="hover:bg-zinc-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image && (
                        <Image
                          src={resolveIpfsUrl(user.image) || '/images/avatars/onlybox2.png'}
                          alt="Avatar"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="text-white font-medium">
                          {user.name ?? 'Usuario sin nombre'}
                        </div>
                        {user.email && (
                          <div className="text-gray-400 text-xs">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-xs">
                    {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${roleDisplay.className}`}>
                      {roleDisplay.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-zinc-700 text-white text-xs rounded-full">
                      {user.projectCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-6 bg-cyan-700 text-white text-xs rounded-full font-semibold">
                      {user.connectionCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {formatDate(user.lastConnectionAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Users Pagination */}
      {totalUsersPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-700">
          <p className="text-xs text-zinc-500">
            Mostrando {((usersPage - 1) * USERS_PER_PAGE) + 1}–{Math.min(usersPage * USERS_PER_PAGE, filteredUsers.length)} de {filteredUsers.length} usuarios
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setUsersPage(p => Math.max(1, p - 1))}
              disabled={usersPage === 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalUsersPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalUsersPages || Math.abs(p - usersPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-zinc-600 text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setUsersPage(p as number)}
                    className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                      usersPage === p
                        ? 'bg-cyan-500 text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
              disabled={usersPage === totalUsersPages}
              className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Applicants</p>
              <p className="text-2xl font-bold text-lime-400">
                {roleCounts.applicant}
              </p>
            </div>
            <div className="w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center">
              🔍
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Pandorians</p>
              <p className="text-2xl font-bold text-blue-400">
                {roleCounts.pandorian}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              ✨
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Con Protocolos</p>
              <p className="text-2xl font-bold text-cyan-400">
                {users.filter(u => u.projectCount > 0).length}
              </p>
            </div>
            <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
              📊
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Conexiones</p>
              <p className="text-2xl font-bold text-orange-400">
                {users.reduce((total, user) => total + user.connectionCount, 0)}
              </p>
            </div>
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              🔗
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info in Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-4">
          <h4 className="text-yellow-300 font-semibold mb-2">🔧 Development Debug Info - Cálculos de Usuarios</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>📊 Conteo de Proyectos:</strong></p>
                <ul className="ml-2">
                  <li>Total usuarios: {usersArray.length}</li>
                  <li>Con proyectos: {usersArray.filter(u => u.projectCount > 0).length}</li>
                  <li>Sin proyectos: {usersArray.filter(u => u.projectCount === 0).length}</li>
                  <li>Con múltiples proyectos: {usersArray.filter(u => u.projectCount > 1).length}</li>
                </ul>
              </div>
              <div>
                <p><strong>🔑 Pandoras Key:</strong></p>
                <ul className="ml-2">
                  <li>Total con Key: {usersArray.filter(u => u.hasPandorasKey).length}</li>
                  <li>Total sin Key: {usersArray.filter(u => !u.hasPandorasKey).length}</li>
                  <li>% con Key: {usersArray.length > 0 ? Math.round((usersArray.filter(u => u.hasPandorasKey).length / usersArray.length) * 100) : 0}%</li>
                  <li>Para acceder requieren Key: <span className="text-green-400">✅ Correcto</span></li>
                </ul>
              </div>
            </div>
            <div className="mt-3">
              <p><strong>📝 Conteo por Usuario (Ejemplos):</strong></p>
              <ul className="ml-2">
                {usersArray.slice(0, 3).map((user, idx) => (
                  <li key={idx}>
                    {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}:
                    <span className="text-cyan-400"> {user.projectCount} proyectos</span>,
                    <span className={`ml-1 ${user.hasPandorasKey ? 'text-green-400' : 'text-red-400'}`}>
                      {user.hasPandorasKey ? '✓' : '✗'} Key
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

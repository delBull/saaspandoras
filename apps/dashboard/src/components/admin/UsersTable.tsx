'use client';

import { useState, useMemo } from 'react';
import { UserData, UserRole } from '@/types/admin';

interface UsersTableProps {
  users: UserData[];
}

export function UsersTable({ users }: UsersTableProps) {
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  // Filtered users based on selected role filter
  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return users;
    return users.filter(user => user.role === roleFilter);
  }, [users, roleFilter]);

  // Role counts for filter badges
  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      applicant: 0,
      pandorian: 0,
      admin: 0,
    };

    users.forEach(user => {
      counts[user.role]++;
    });

    return counts;
  }, [users]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Base de Datos de Usuarios</h2>
          <p className="text-gray-400 text-sm">
            Gestión completa de usuarios registrados en la plataforma
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-cyan-400">{users.length}</div>
          <div className="text-xs text-gray-400">Total Usuarios</div>
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            roleFilter === 'all'
              ? 'bg-cyan-500 text-black'
              : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
          }`}
        >
          Todos ({users.length})
        </button>
        {(Object.entries(roleCounts) as [UserRole, number][]).map(([role, count]) => {
          const { text, className } = getRoleDisplay(role);
          return count > 0 ? (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                roleFilter === role
                  ? 'bg-cyan-500 text-black'
                  : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
              }`}
            >
              <span>{text}</span>
              <span>({count})</span>
            </button>
          ) : null;
        })}
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-700 text-sm">
          <thead className="bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Usuario</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Wallet</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Rol</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Proyectos</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Registro</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">Pandoras Key</th>
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
            {filteredUsers.map((user) => {
              const roleDisplay = getRoleDisplay(user.role);
              return (
                <tr key={user.id} className="hover:bg-zinc-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.image && (
                        <img
                          src={user.image}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <div className="text-white font-medium">
                          {user.name || 'Usuario sin nombre'}
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
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.hasPandorasKey ? (
                        <span className="text-yellow-400 text-xs">✓ Sí</span>
                      ) : (
                        <span className="text-gray-500 text-xs">✗ No</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-lime-400 text-lg">🔍</div>
          <div className="text-2xl font-bold text-white">{roleCounts.applicant}</div>
          <div className="text-xs text-gray-400">Applicants</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-blue-400 text-lg">✨</div>
          <div className="text-2xl font-bold text-white">{roleCounts.pandorian}</div>
          <div className="text-xs text-gray-400">Pandorians</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-red-400 text-lg">⚙️</div>
          <div className="text-2xl font-bold text-white">{roleCounts.admin}</div>
          <div className="text-xs text-gray-400">Administradores</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-cyan-400 text-lg">📊</div>
          <div className="text-2xl font-bold text-white">{users.filter(u => u.projectCount > 0).length}</div>
          <div className="text-xs text-gray-400">Con Proyectos</div>
        </div>
      </div>
    </div>
  );
}

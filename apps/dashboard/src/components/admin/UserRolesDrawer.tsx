'use client';

import React, { useState, useTransition } from 'react';
import type { UserData } from '@/types/admin';
import { PlatformActor } from '@/lib/dash-contracts/admin';
import { CANONICAL_CAPABILITIES } from '@/lib/canonical-capabilities';
import { X, ShieldAlert, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserRolesDrawerProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  currentActor?: PlatformActor;
}

export function UserRolesDrawer({ user, isOpen, onClose, currentActor }: UserRolesDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<string>(user?.role || 'user');
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>(
    user?.capabilities || {}
  );
  const router = useRouter();

  // Reset state when user changes
  React.useEffect(() => {
    if (user) {
      setRole(user.role || 'user');
      setCapabilities(user.capabilities || {});
    }
  }, [user]);

  if (!isOpen || !user) return null;

  // Hierarchical Delegation Restriction:
  // - SUPER_ADMIN can edit anyone
  // - ADMIN can edit OPERATOR, MARKETING, VIEWER, USER, but CANNOT edit SUPER_ADMIN or other ADMINS
  const canEditRoles =
    currentActor?.role === 'SUPER_ADMIN' ||
    (currentActor?.role === 'ADMIN' && user.role !== 'super_admin' && user.role !== 'admin');

  const toggleCapability = (key: string) => {
    if (!canEditRoles) return;
    setCapabilities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!canEditRoles) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/admin/users/${user.id}/roles`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, capabilities })
        });

        if (!res.ok) throw new Error('Failed to update user roles');
        
        router.refresh();
        onClose();
      } catch (error) {
        console.error(error);
        alert('Hubo un error al actualizar los roles.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-bold text-white">Identidad & Acceso</h2>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
          {/* User Info */}
          <div>
            <div className="text-xs text-zinc-500 mb-1 font-mono">{user.walletAddress}</div>
            <h3 className="text-xl font-bold text-white mb-1">{user.name || 'Sin Nombre'}</h3>
            {user.email && <p className="text-zinc-400 text-sm">{user.email}</p>}
          </div>

          {!canEditRoles && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">
                <p className="font-semibold text-red-300 mb-1">Restricción de Delegación</p>
                <p>No tienes suficientes privilegios para editar a este usuario jerárquicamente superior o igual.</p>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Rol de Plataforma</h4>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={!canEditRoles}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white disabled:opacity-50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
            >
              <option value="user">Usuario Básico (user)</option>
              <option value="viewer">Viewer (viewer)</option>
              <option value="marketing">Marketing (marketing)</option>
              <option value="operator">Operador (operator)</option>
              <option value="admin">Administrador (admin)</option>
              <option value="super_admin">Super Admin (super_admin)</option>
            </select>
          </div>

          {/* Capabilities */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Capabilities (Permisos Finos)</h4>
            <div className="grid grid-cols-1 gap-2">
              {CANONICAL_CAPABILITIES.map(cap => (
                <label 
                  key={cap.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    capabilities[cap.id] 
                      ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-100' 
                      : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'
                  } ${!canEditRoles && 'opacity-50 cursor-not-allowed'}`}
                >
                  <input 
                    type="checkbox"
                    className="sr-only"
                    checked={capabilities[cap.id] || false}
                    onChange={() => toggleCapability(cap.id)}
                    disabled={!canEditRoles}
                  />
                  <div className={`w-4 h-4 rounded-sm border mr-3 flex items-center justify-center transition-colors ${
                    capabilities[cap.id] ? 'bg-cyan-500 border-cyan-500' : 'border-zinc-500'
                  }`}>
                    {capabilities[cap.id] && <div className="w-2 h-2 bg-black rounded-[1px]" />}
                  </div>
                  <span className="text-sm select-none">{cap.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canEditRoles || isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

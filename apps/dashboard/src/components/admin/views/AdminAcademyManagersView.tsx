'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, GraduationCap, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

interface Manager {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
  academyAdmin: boolean;
  lastAccessAt: string | null;
}

export function AdminAcademyManagersView() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingEmail, setAddingEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const res = await fetch('/api/admin/academy/managers');
      const data = await res.json();
      if (data.ok) {
        setManagers(data.managers);
      } else {
        toast.error('Error al cargar managers: ' + data.error);
      }
    } catch (err) {
      toast.error('Error de red al cargar managers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/academy/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addingEmail.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Manager agregado: ${addingEmail}`);
        setAddingEmail('');
        await fetchManagers();
      } else {
        toast.error('Error al agregar manager: ' + data.error);
      }
    } catch (err) {
      toast.error('Error de red al agregar manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeManager = async (id: number) => {
    if (!confirm('¿Estás seguro de revocar el acceso a este manager?')) return;

    try {
      const res = await fetch(`/api/admin/academy/managers?collaboratorId=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Acceso revocado exitosamente');
        await fetchManagers();
      } else {
        toast.error('Error al revocar manager: ' + data.error);
      }
    } catch (err) {
      toast.error('Error de red al revocar manager');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-400" />
          S'Narai Academy — Gestores y Administradores
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Asigna y revoca dinámicamente permisos para gestionar candidatos, currícula y acreditaciones on-chain en Academy.
        </p>
      </div>

      <div className="bg-[#0F0F16] border border-white/[0.08] rounded-xl overflow-hidden shadow-md">
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Agregar Administrador</h3>
        </div>
        <div className="p-5">
          <form onSubmit={handleAddManager} className="flex gap-4">
            <input
              type="email"
              placeholder="Email del colaborador en Nexus..."
              value={addingEmail}
              onChange={(e) => setAddingEmail(e.target.value)}
              required
              className="flex-1 bg-black/40 border border-white/[0.1] rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={isSubmitting || !addingEmail.trim()}
              className="px-6 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Asignar Permiso
            </button>
          </form>
        </div>
      </div>

      <div className="bg-[#0F0F16] border border-white/[0.08] rounded-xl overflow-hidden shadow-md">
        <div className="p-5 border-b border-white/[0.08]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Administradores Activos ({managers.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-10 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
          </div>
        ) : managers.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-sm">
            No hay managers asignados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase bg-black/20 border-b border-white/[0.05]">
                <tr>
                  <th className="px-6 py-4 font-medium text-zinc-300">Usuario</th>
                  <th className="px-6 py-4 font-medium text-zinc-300">Rol Base</th>
                  <th className="px-6 py-4 font-medium text-zinc-300">Permiso Academy</th>
                  <th className="px-6 py-4 font-medium text-zinc-300">Último Acceso</th>
                  <th className="px-6 py-4 text-right font-medium text-zinc-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {managers.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{m.name || 'Sin nombre'}</div>
                          <div className="text-xs text-zinc-500">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300">
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {m.academyAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Explicito
                        </span>
                      ) : m.role === 'MANAGER' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Heredado (Rol)
                        </span>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {m.lastAccessAt ? new Date(m.lastAccessAt).toLocaleDateString() : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.academyAdmin && (
                        <button
                          onClick={() => handleRevokeManager(m.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-2"
                          title="Revocar acceso explícito"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

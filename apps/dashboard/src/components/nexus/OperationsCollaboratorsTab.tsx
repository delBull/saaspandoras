'use client';

import { Fragment, useState, useEffect } from 'react';
import { Shield, User, Users, Lock, ShieldCheck, Mail, RefreshCw, Save, Loader2, Check, X } from 'lucide-react';

interface CollaboratorInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  capabilities: string[];
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

export function OperationsCollaboratorsTab({ isAdmin }: { isAdmin: boolean }) {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // ── Edición de rol y permisos (usa la API que ya existía) ──────────────────
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState('VIEWER');
  const [draftPerms, setDraftPerms] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ email: string; text: string; ok: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const storedToken = typeof window !== 'undefined' ? (localStorage.getItem('pandoras_nexus_token') ?? localStorage.getItem('nexus_token')) : null;
        const res = await fetch('/api/nexus/collaborators/list', {
          headers: {
            ...(storedToken ? { 'x-nexus-token': storedToken } : {}),
          }
        });
        interface ApiCollab {
          walletAddress?: string;
          id?: string;
          name?: string;
          email?: string;
          role?: string;
          permissions?: Record<string, boolean>;
          isActive?: boolean;
          status?: string;
        }
        const data = (await res.json()) as { ok?: boolean; collaborators?: ApiCollab[] };
        if (data.ok && Array.isArray(data.collaborators)) {
          const mapped: CollaboratorInfo[] = data.collaborators.map((c) => ({
            id: c.walletAddress ?? c.id ?? String(Math.random()),
            name: c.name ?? c.email?.split('@')[0] ?? 'Unknown',
            email: c.email ?? 'No email',
            role: c.role ?? 'GUEST',
            capabilities: Object.keys(c.permissions ?? {}).filter(k => c.permissions?.[k]),
            status: (c.status === 'ACTIVE' || c.isActive) ? 'ACTIVE' : (c.status === 'SUSPENDED' ? 'SUSPENDED' : 'PENDING')
          }));
          setCollaborators(mapped);
        }
      } catch (err) {
        console.error('Error fetching collaborators', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (isAdmin) {
      void fetchCollaborators();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, reloadKey]);
  /** Roles del motor de RBAC (nexus-rbac.ts). */
  const ROLES = [
    'SUPER_ADMIN', 'ADMIN', 'ADMIN_OPERATIONS', 'ADMIN_MARKETING', 'ADMIN_COMPLIANCE',
    'TENANT_ADMIN', 'COMMUNITY_MANAGER', 'OPERATOR', 'MARKETING', 'VIEWER',
  ] as const;

  /** Permisos de módulo que se pueden conceder por persona sin cambiar el rol. */
  const MODULE_PERMISSIONS = [
    { key: 'developer', label: 'Developer Hub' },
    { key: 'dealRoom', label: 'Deal Rooms' },
    { key: 'settings', label: 'Settings' },
    { key: 'hermesQa', label: 'Hermes QA' },
    { key: 'academyAdmin', label: 'Academy · Admin' },
    { key: 'academyCreator', label: 'Academy · Creador' },
  ] as const;

  const startEditing = (collab: CollaboratorInfo) => {
    setEditingEmail(collab.email);
    setDraftRole(collab.role.toUpperCase());
    setDraftPerms(Object.fromEntries(collab.capabilities.map((cap) => [cap, true])));
    setFeedback(null);
  };

  const savePermissions = async (email: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const storedToken = typeof window !== 'undefined'
        ? (localStorage.getItem('pandoras_nexus_token') ?? localStorage.getItem('nexus_token'))
        : null;
      const res = await fetch('/api/nexus/collaborators/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storedToken ? { 'x-nexus-token': storedToken } : {}),
        },
        body: JSON.stringify({ email, role: draftRole, permissions: draftPerms }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setFeedback({ email, text: data.error ?? 'No se pudieron guardar los permisos.', ok: false });
        return;
      }
      setFeedback({ email, text: 'Rol y permisos actualizados.', ok: true });
      setEditingEmail(null);
      setReloadKey((k) => k + 1);
    } catch {
      setFeedback({ email, text: 'Error de red al guardar.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyles = (status: CollaboratorInfo['status']) => {
    switch (status) {
      case 'ACTIVE': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'PENDING': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'SUSPENDED': return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
    }
  };

  return (
    <div className="p-5 overflow-y-auto flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.04]">
        <div>
          <p className="text-[11px] text-sky-300 font-mono uppercase font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>COHORTS & COLLABORATORS CENTER</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gestión de identidad, acceso de equipos operativos, cohortes y capacidades del sistema.
          </p>
        </div>
        {isAdmin && (
          <a 
            href="/nexus/settings"
            className="px-3.5 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-mono transition-colors shrink-0 text-center flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ INVITAR / GESTIONAR EN SETTINGS</span>
          </a>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
          OPERATIVE COHORTS
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { name: 'Core Contributors', members: 12, role: 'nexus.manage', color: 'sky' },
              { name: 'Marketing & Growth', members: 5, role: 'growth.manage', color: 'emerald' },
              { name: 'External Auditors', members: 2, role: 'viewer', color: 'amber' },
            ].map((cohort, i) => (
              <div key={i} className={`p-4 rounded-xl border border-${cohort.color}-500/20 bg-${cohort.color}-950/10`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`text-sm font-bold text-${cohort.color}-300`}>{cohort.name}</h5>
                  <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-zinc-400">{cohort.members} members</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">Role cap: {cohort.role}</p>
                {isAdmin && (
                  <a 
                    href="/nexus/settings"
                    className={`mt-3 block text-center w-full py-1.5 rounded bg-${cohort.color}-500/10 hover:bg-${cohort.color}-500/20 text-${cohort.color}-300 border border-${cohort.color}-500/30 text-[10px] font-mono transition-colors`}
                  >
                    GESTIONAR COHORTE EN SETTINGS
                  </a>
                )}
              </div>
            ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center justify-between">
          <span>Directorio de Colaboradores</span>
          <span className="text-[10px] text-zinc-500 font-normal">
            {isLoading ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : `Mostrando ${collaborators.length} identidades canónicas`}
          </span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 text-xs font-mono text-zinc-500 uppercase">
                <th className="font-normal px-4 py-3">Identidad</th>
                <th className="font-normal px-4 py-3">Status</th>
                <th className="font-normal px-4 py-3">Rol / Nivel</th>
                <th className="font-normal px-4 py-3">Capabilities</th>
                <th className="font-normal px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {collaborators.map(collab => (
                <Fragment key={collab.id}>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200">{collab.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {collab.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${getStatusStyles(collab.status)}`}>
                      {collab.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>{collab.role}</span>
                    </div>
                    {feedback?.email === collab.email && (
                      <p className={`mt-1 text-[10px] font-mono ${feedback.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {feedback.text}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {collab.capabilities.map(cap => (
                        <span key={cap} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => (editingEmail === collab.email ? setEditingEmail(null) : startEditing(collab))}
                        title="Editar rol y permisos"
                        className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] font-mono text-zinc-300 hover:border-sky-500/30 hover:text-sky-300 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {editingEmail === collab.email ? 'CERRAR' : 'EDITAR'}
                      </button>
                    ) : (
                      <button className="p-1.5 text-zinc-600 cursor-not-allowed rounded" disabled title="Solo Admin">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
                {editingEmail === collab.email && (
                  <tr className="bg-sky-500/[0.03]">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="grid gap-3 md:grid-cols-[200px_1fr_auto] md:items-start">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          Rol base
                          <select
                            value={draftRole}
                            onChange={(e) => setDraftRole(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-xs text-white"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </label>

                        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                          Permisos de módulo
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {MODULE_PERMISSIONS.map(({ key, label }) => {
                              const on = Boolean(draftPerms[key]);
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => setDraftPerms((prev) => ({ ...prev, [key]: !on }))}
                                  className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-normal normal-case tracking-normal transition-colors ${
                                    on
                                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                      : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {on ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:pt-4">
                          <button
                            type="button"
                            onClick={() => void savePermissions(collab.email)}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-[11px] font-bold text-black hover:bg-sky-400 disabled:opacity-40"
                          >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            GUARDAR
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-zinc-500 font-mono">
                        El rol define lo que puede hacer; los permisos de módulo abren un módulo concreto sin subir el rol.
                      </p>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

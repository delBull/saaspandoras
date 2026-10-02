'use client';

import { useState, useEffect } from 'react';
import { Shield, User, Users, Lock, MoreHorizontal, Settings2, ShieldCheck, Mail, RefreshCw } from 'lucide-react';

interface CollaboratorInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  capabilities: string[];
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
}

const MOCK_COLLABORATORS: CollaboratorInfo[] = [
  {
    id: 'user_1',
    name: 'Matute',
    email: 'matute@pandoras.finance',
    role: 'SUPER_ADMIN',
    capabilities: ['*'],
    status: 'ACTIVE'
  },
  {
    id: 'user_2',
    name: 'Marco',
    email: 'marco@pandoras.finance',
    role: 'ADMIN',
    capabilities: ['nexus.manage', 'growth.manage'],
    status: 'ACTIVE'
  },
  {
    id: 'user_3',
    name: 'Marketing Team',
    email: 'marketing@pandoras.finance',
    role: 'EDITOR',
    capabilities: ['growth.manage'],
    status: 'PENDING'
  }
];

export function OperationsCollaboratorsTab({ isAdmin }: { isAdmin: boolean }) {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        const storedToken = typeof window !== 'undefined' ? (localStorage.getItem('pandoras_nexus_token') || localStorage.getItem('nexus_token')) : null;
        const res = await fetch('/api/nexus/collaborators/list', {
          headers: {
            ...(storedToken ? { 'x-nexus-token': storedToken } : {}),
          }
        });
        const data = await res.json();
        if (data.ok && data.collaborators) {
          const mapped = data.collaborators.map((c: any) => ({
            id: c.walletAddress || c.id || String(Math.random()),
            name: c.name || c.email?.split('@')[0] || 'Unknown',
            email: c.email || 'No email',
            role: c.role || 'GUEST',
            capabilities: Object.keys(c.permissions || {}).filter(k => c.permissions[k]),
            status: c.isActive ? 'ACTIVE' : 'PENDING'
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
      fetchCollaborators();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);
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
          <button className="px-3.5 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-mono transition-colors shrink-0">
            + INVITAR COLABORADOR
          </button>
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
                  <button className={`mt-3 w-full py-1.5 rounded bg-${cohort.color}-500/10 hover:bg-${cohort.color}-500/20 text-${cohort.color}-300 border border-${cohort.color}-500/30 text-[10px] font-mono transition-colors`}>
                    GESTIONAR COHORTE
                  </button>
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
                <tr key={collab.id} className="hover:bg-white/[0.02] transition-colors">
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
                      <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded transition-colors">
                        <Settings2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="p-1.5 text-zinc-600 cursor-not-allowed rounded" disabled title="Solo Admin">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

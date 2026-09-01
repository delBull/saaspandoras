'use client';

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@saasfly/ui/card';
import type { UserData, Project } from '@/types/admin';
import { useActiveAccount } from 'thirdweb/react';
import { MissionControlDashboard } from '@/components/projects/MissionControlDashboard';
import { getProjectStatusConfig } from '@/lib/project-status';

export default function ProfileProjectsPage() {
  const router = useRouter();
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const account = useActiveAccount();

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
          if (!usersRes.ok) {
            return [null, await projectsRes.json()];
          }
          if (!projectsRes.ok) {
            throw new Error(`Projects API failed: ${projectsRes.status}`);
          }
          return Promise.all([usersRes.json(), projectsRes.json()]);
        })
        .then((data) => {
          const [userProfile, rawProjects] = data as [UserData | null, any];
          const projectsList = Array.isArray(rawProjects) ? rawProjects : [];

          // 🏦 WALLET-BASED FILTERING ONLY
          const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'];
          const isSuperAdmin = SUPER_ADMIN_WALLETS.includes(walletAddress.toLowerCase());

          let filteredProjects: Project[] = [];
          if (isSuperAdmin) {
            filteredProjects = projectsList;
          } else {
            filteredProjects = projectsList.filter((p: Project) => {
              const projectWallet = p?.applicantWalletAddress?.toLowerCase()?.trim();
              const userWallet = walletAddress.toLowerCase().trim();
              return Boolean(projectWallet && userWallet && projectWallet === userWallet);
            });
          }

          setUserProjects(filteredProjects);
        })
        .catch(() => {
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
            .then((rawProjects) => {
              const projectsList = Array.isArray(rawProjects) ? rawProjects : [];
              const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'];
              const isSuperAdmin = SUPER_ADMIN_WALLETS.includes(walletAddress.toLowerCase());

              let filteredProjects: Project[] = [];
              if (isSuperAdmin) {
                filteredProjects = projectsList.filter((p: Project) =>
                  ['pending', 'approved', 'live', 'completed'].includes(p?.status)
                );
              } else {
                filteredProjects = projectsList.filter((p: Project) => {
                  const projectWallet = p?.applicantWalletAddress?.toLowerCase()?.trim();
                  const userWallet = walletAddress.toLowerCase().trim();
                  if (!projectWallet || !userWallet) return false;
                  return projectWallet === userWallet ||
                    projectWallet === userWallet.replace('0x', '') ||
                    projectWallet.endsWith(userWallet.slice(-8)) ||
                    projectWallet.endsWith(userWallet.slice(-10));
                });
              }
              setUserProjects(filteredProjects);
            })
            .catch(() => {
              setUserProjects([]);
            });
        })
        .finally(() => setLoading(false));
    } else if (!walletAddress) {
      setLoading(false);
    }
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-500 font-mono text-sm tracking-widest uppercase">Inicializando Mission Control...</p>
        </div>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <Card className="bg-white/[0.02] border-white/10 backdrop-blur-md text-center max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-xl">Acceso Denegado</CardTitle>
            <CardDescription className="text-zinc-400">Necesitas estar conectado con tu wallet para acceder al Mission Control.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'];
  const isSuperAdmin = SUPER_ADMIN_WALLETS.includes(walletAddress.toLowerCase());

  const safeProjects = Array.isArray(userProjects) ? userProjects : [];
  const activeProjects = safeProjects.filter(p => ['approved', 'live', 'completed'].includes(p?.status));
  const pendingProjects = safeProjects.filter(p => ['pending'].includes(p?.status));
  const activeClientProjects = safeProjects.filter(p => ['active_client'].includes(p?.status));
  const draftProjects = safeProjects.filter(p => ['draft', 'incomplete'].includes(p?.status));
  const rejectedProjects = safeProjects.filter(p => ['rejected'].includes(p?.status));

  // 1. Pending Review State
  if (!isSuperAdmin && activeProjects.length === 0 && pendingProjects.length > 0) {
    const pendingProject = pendingProjects[0];
    const statusCfg = getProjectStatusConfig(pendingProject?.status);
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/[0.02] border border-white/10 rounded-3xl p-10 text-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(234,179,8,0.2)_360deg)] animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-[1px] bg-[#050505] rounded-3xl z-0" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mb-6">
              <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase mb-3 ${statusCfg.badgeClass}`}>
              {statusCfg.label}
            </span>

            <h2 className="text-2xl font-black text-white mb-2">Proyecto en Revisión</h2>
            <p className="text-zinc-400 mb-6">
              Tu proyecto <span className="text-yellow-400 font-bold">{pendingProject?.title}</span> está siendo procesado por nuestro equipo de validación (Compliance).
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Próximos Pasos</h3>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Revisión de documentación técnica y legal
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Evaluación de Tokenomics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" /> Aprobación y despliegue del contrato
                </li>
              </ul>
            </div>

            <p className="mt-8 text-xs text-zinc-500 max-w-sm">
              Te notificaremos una vez que el estado de tu aplicación sea actualizado. Este proceso suele tomar entre 24 y 48 horas hábiles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Client / Tier 1 Due Diligence State
  if (!isSuperAdmin && activeProjects.length === 0 && activeClientProjects.length > 0) {
    const clientProject = activeClientProjects[0];
    const statusCfg = getProjectStatusConfig('active_client');
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/[0.02] border border-cyan-500/20 rounded-3xl p-10 text-center relative overflow-hidden backdrop-blur-md">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mb-6 text-cyan-400">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase mb-3 ${statusCfg.badgeClass}`}>
              {statusCfg.label}
            </span>

            <h2 className="text-2xl font-black text-white mb-2">Due Diligence Institucional Activo</h2>
            <p className="text-zinc-400 mb-6">
              El análisis Tier 1 para <span className="text-cyan-400 font-bold">{clientProject?.title}</span> se encuentra en ejecución por el comité de riesgos.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full text-left space-y-2 text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Modelado financiero y valuación RWA
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Preparación de arquitectura SCaaS en Base
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-600" /> Aprobación final y asignación de pool
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Draft / Incomplete State
  if (!isSuperAdmin && activeProjects.length === 0 && draftProjects.length > 0) {
    const draftProject = draftProjects[0];
    const statusCfg = getProjectStatusConfig(draftProject?.status);
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/[0.02] border border-purple-500/20 rounded-3xl p-10 text-center backdrop-blur-md">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase mb-4 inline-block ${statusCfg.badgeClass}`}>
            {statusCfg.label}
          </span>
          <h2 className="text-2xl font-black text-white mb-3">{draftProject?.title}</h2>
          <p className="text-zinc-400 mb-6">
            {draftProject?.status === 'incomplete' 
              ? 'Tu aplicación requiere información adicional para completar el análisis de cumplimiento.'
              : 'Tu solicitud de tokenización está guardada como borrador.'}
          </p>
          <a
            href={`/apply?resume=${draftProject?.slug || draftProject?.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 text-sm"
          >
            Continuar Solicitud ↗
          </a>
        </div>
      </div>
    );
  }

  // 4. Rejected State
  if (!isSuperAdmin && activeProjects.length === 0 && rejectedProjects.length > 0) {
    const rejectedProject = rejectedProjects[0];
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/[0.02] border border-rose-500/20 rounded-3xl p-10 text-center backdrop-blur-md">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase mb-4 inline-block text-rose-300 bg-rose-500/10 border border-rose-500/20">
            Rechazado
          </span>
          <h2 className="text-2xl font-black text-white mb-3">{rejectedProject?.title}</h2>
          <p className="text-zinc-400">
            Tu solicitud no cumple con los criterios de admisión institucional vigentes en este ciclo. Puedes ponerte en contacto con soporte para mayor retroalimentación.
          </p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin && userProjects.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/[0.02] border border-white/10 rounded-3xl p-10 text-center backdrop-blur-md">
          <h2 className="text-2xl font-black text-white mb-3">Tu aplicación está en proceso</h2>
          <p className="text-zinc-400">
            Aquí aparecerá tu portal de proyecto una vez que tu aplicación sea aprobada.
            Te notificaremos cuando haya una actualización.
          </p>
        </div>
      </div>
    );
  }

  // Pass active projects to dashboard (or all if super admin)
  const projectsToDisplay = isSuperAdmin ? userProjects : (activeProjects.length > 0 ? activeProjects : userProjects);

  // If user has a single project with a slug, seamlessly navigate to the modern manage console
  useEffect(() => {
    if (projectsToDisplay.length === 1 && projectsToDisplay[0]?.slug) {
      router.replace(`/profile/projects/${projectsToDisplay[0].slug}/manage`);
    }
  }, [projectsToDisplay, router]);

  return <MissionControlDashboard projects={projectsToDisplay} />;
}

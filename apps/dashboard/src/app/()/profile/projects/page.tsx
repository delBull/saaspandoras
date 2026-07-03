'use client';

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@saasfly/ui/card';
import type { UserData, Project } from '@/types/admin';
import { useActiveAccount } from 'thirdweb/react';
import { MissionControlDashboard } from '@/components/projects/MissionControlDashboard';

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
          const [userProfile, projects] = data as [UserData | null, Project[]];

          // 🏦 WALLET-BASED FILTERING ONLY
          const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'];
          const isSuperAdmin = SUPER_ADMIN_WALLETS.includes(walletAddress.toLowerCase());

          let filteredProjects: Project[] = [];
          if (isSuperAdmin) {
            filteredProjects = projects;
          } else {
            filteredProjects = projects.filter(p => {
              const projectWallet = p.applicantWalletAddress?.toLowerCase();
              const userWallet = walletAddress.toLowerCase();
              return projectWallet === userWallet;
            });
          }

          setUserProjects(filteredProjects);
        })
        .catch(err => {
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
              const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'];
              const isSuperAdmin = SUPER_ADMIN_WALLETS.includes(walletAddress.toLowerCase());

              let filteredProjects: Project[] = [];
              if (isSuperAdmin) {
                filteredProjects = projects.filter((p: Project) =>
                  ['pending', 'approved', 'live', 'completed'].includes(p.status)
                );
              } else {
                filteredProjects = projects.filter((p: Project) => {
                  const projectWallet = p.applicantWalletAddress?.toLowerCase().trim();
                  const userWallet = walletAddress.toLowerCase().trim();
                  return projectWallet === userWallet ||
                    projectWallet === userWallet.replace('0x', '') ||
                    (projectWallet && userWallet && projectWallet.endsWith(userWallet.slice(-8))) ||
                    (projectWallet && userWallet && projectWallet.endsWith(userWallet.slice(-10)));
                });
              }
              setUserProjects(filteredProjects);
            })
            .catch(projectErr => {
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

  const activeProjects = userProjects.filter(p => ['approved', 'live', 'completed'].includes(p.status));
  const pendingProjects = userProjects.filter(p => ['draft', 'pending'].includes(p.status));

  if (!isSuperAdmin && activeProjects.length === 0 && pendingProjects.length > 0) {
    const pendingProject = pendingProjects[0];
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/[0.02] border border-white/10 rounded-3xl p-10 text-center relative overflow-hidden backdrop-blur-md">
          {/* Animated Background */}
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(168,85,247,0.2)_360deg)] animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-[1px] bg-[#050505] rounded-3xl z-0" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center mb-6">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>

            <h2 className="text-2xl font-black text-white mb-2">Proyecto en Revisión</h2>
            <p className="text-zinc-400 mb-6">
              Tu proyecto <span className="text-purple-400 font-bold">{pendingProject?.title}</span> está siendo procesado por nuestro equipo de validación (Compliance).
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

  // Pass active projects to dashboard (or all if super admin, though we might want to filter drafts out of the Mission Control for admins too if they clutter? Actually, for super admins, we pass all so they can approve/reject them if there's a feature for that, or we just pass activeProjects so Mission Control doesn't break).
  // Mission Control can break if it assumes live data, so let's pass all projects for super admin, but only active for users if they somehow have both.
  const projectsToDisplay = isSuperAdmin ? userProjects : (activeProjects.length > 0 ? activeProjects : userProjects);

  return <MissionControlDashboard projects={projectsToDisplay} />;
}

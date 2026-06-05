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

  return <MissionControlDashboard projects={userProjects} />;
}

'use client';

/**
 * ProjectDaoProtocolSection — Full On-Chain DAO Governance Component
 * apps/dashboard/src/app/()/profile/projects/[slug]/manage/components/ProjectDaoProtocolSection.tsx
 *
 * Embeds the complete DAO governance system from /projects/[slug]/dao directly into the
 * Tokenomics drawer/console, providing horizontal tabs for:
 * - Resumen DAO (Metrics & Treasury)
 * - Propuestas y Votación (On-chain Proposals & Voting)
 * - Foro Global (DAOChat)
 * - Beneficios y Recompensas (Staking & Yield)
 * - Miembros DAO (Members Directory)
 * - Documentación (DAODocs)
 * - Ayuda (Help & Rules)
 */

import React, { useState } from 'react';
import { DAODashboard } from '@/components/dao/DAODashboard';
import {
  HomeIcon,
  VoteIcon,
  CoinsIcon,
  UsersIcon,
  BookOpenIcon,
  HelpCircleIcon,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ProjectDaoProtocolSectionProps {
  project: any;
}

export function ProjectDaoProtocolSection({ project }: ProjectDaoProtocolSectionProps) {
  const [activeDaoView, setActiveDaoView] = useState<string>('overview');

  const daoTabs = [
    { id: 'overview', label: 'Resumen DAO', icon: HomeIcon },
    { id: 'proposals', label: 'Propuestas y Votación', icon: VoteIcon },
    { id: 'chat', label: 'Foro Global', icon: MessageSquare },
    { id: 'staking', label: 'Beneficios y Staking', icon: CoinsIcon },
    { id: 'members', label: 'Miembros DAO', icon: UsersIcon },
    { id: 'docs', label: 'Documentación', icon: BookOpenIcon },
    { id: 'info', label: 'Ayuda', icon: HelpCircleIcon },
  ];

  const governorAddress = project.governorContractAddress || project.w2eConfig?.governorAddress;
  const licenseAddress = project.licenseContractAddress;

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-zinc-900/60 to-black border border-emerald-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10 shrink-0">
            <VoteIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Gobernanza del Protocolo (DAO On-Chain)
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                SOVEREIGN DAO
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              Asamblea descentralizada, votación con poder de token y gestión de fondos de tesorería comunitaria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <Link
            href={`/projects/${project.slug}/dao`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl transition-all text-xs font-semibold"
            title="Abrir Vista Pública de la DAO"
          >
            <span>Ver Portal DAO</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── INTERNAL HORIZONTAL TABS ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 no-scrollbar">
        {daoTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeDaoView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDaoView(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10 font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500'} shrink-0`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── DAO CONTENT EMBEDDED ── */}
      <div className="bg-black/30 border border-white/5 rounded-3xl p-4 sm:p-6 backdrop-blur-xl">
        <DAODashboard project={project} activeView={activeDaoView} isOwner={true} />
      </div>
    </div>
  );
}

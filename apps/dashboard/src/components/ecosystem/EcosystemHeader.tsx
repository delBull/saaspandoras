'use client';

import React from 'react';
import Link from 'next/link';
import type { PortalOrganization } from '@/lib/portal/portal-types';
import { Layers, Bot, Rocket, Landmark, ShieldCheck, LogOut } from 'lucide-react';

interface EcosystemHeaderProps {
  organization: PortalOrganization;
  organizationSlug: string;
}

export function EcosystemHeader({ organization, organizationSlug }: EcosystemHeaderProps) {
  const handleLogout = () => {
    document.cookie = 'pandoras_portal_session=; Max-Age=0; path=/';
    window.location.href = `/portal/login`;
  };

  return (
    <header className="h-14 bg-[#09090D] border-b border-white/10 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-40 backdrop-blur-xl">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black text-xs shadow-lg shadow-amber-500/20">
          <Layers className="w-4 h-4 text-black" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-tight">{organization.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.2 bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded-full uppercase">
              Hub Central
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">Sovereign Mesh Orchestrator</p>
        </div>
      </div>

      {/* 3 Planes Navigation */}
      <div className="hidden md:flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
        <Link
          href={`/portal/${organizationSlug}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all text-xs font-semibold"
        >
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>Hermes AI OS</span>
        </Link>
        <div className="h-3 w-px bg-white/10" />
        <Link
          href={`/growth-os/organizations/${organizationSlug}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all text-xs font-semibold"
        >
          <Rocket className="w-4 h-4 text-violet-400" />
          <span>Growth OS</span>
        </Link>
        <div className="h-3 w-px bg-white/10" />
        <Link
          href={`/profile/projects/${organizationSlug}/manage`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all text-xs font-semibold"
        >
          <Landmark className="w-4 h-4 text-indigo-400" />
          <span>Tokenomics & Capital</span>
        </Link>
      </div>

      {/* Right User State */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-mono text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px]">Sovereign Mode</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

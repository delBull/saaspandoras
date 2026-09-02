'use client';

import React from 'react';
import Link from 'next/link';
import { Rocket, Layers, Bot, Landmark, ShieldCheck, Zap } from 'lucide-react';

interface GrowthOsHeaderProps {
  slugId: string;
  orgName: string;
}

export function GrowthOsHeader({ slugId, orgName }: GrowthOsHeaderProps) {
  return (
    <header className="h-12 bg-[#09090D] border-b border-white/10 flex items-center justify-between px-4 shrink-0 text-xs font-mono z-30 sticky top-0 backdrop-blur-xl">
      {/* Left: Brand Identity & Tenant */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20">
          <Rocket className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-bold text-violet-300 tracking-wider">GROWTH OS</span>
          <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded font-mono">ENGINE</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-[11px] text-zinc-300 font-semibold">{orgName}</span>
        </div>
      </div>

      {/* Center: Cross-Plane Seamless Switcher */}
      <div className="hidden md:flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
        <Link
          href={`/ecosystem/${slugId}`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all text-[11px] font-medium"
          title="Ecosystem Hub Central"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Ecosystem Hub</span>
        </Link>
        <div className="h-3 w-px bg-white/10" />
        <Link
          href={`/portal/${slugId}`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all text-[11px] font-medium"
          title="Hermes AI OS"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400" />
          <span>Hermes AI</span>
        </Link>
        <div className="h-3 w-px bg-white/10" />
        <Link
          href={`/profile/projects/${slugId}/manage`}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all text-[11px] font-medium"
          title="Protocol Tokenomics & Capital"
        >
          <Landmark className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tokenomics</span>
        </Link>
      </div>

      {/* Right User State */}
      <div className="flex items-center gap-2.5">
        <div className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-300 text-[10px] font-mono">
          ⚡ ACQUISITION ACTIVE
        </div>
      </div>
    </header>
  );
}

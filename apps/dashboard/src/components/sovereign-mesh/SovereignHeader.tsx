'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { PortalOrganization } from '@saasfly/shared';
import { Layers, Bot, Rocket, Landmark, ShieldCheck, LogOut, Sliders, Lock } from 'lucide-react';
import { DisplayControlsWidget } from '@pandoras/display-engine';

interface SovereignHeaderProps {
  organization: { name: string };
  organizationSlug: string;
  activeModules?: string[];
}

export function SovereignHeader({ organization, organizationSlug, activeModules = [] }: SovereignHeaderProps) {
  const [displayControlsOpen, setDisplayControlsOpen] = useState(false);

  const handleLogout = () => {
    document.cookie = 'pandoras_portal_session=; Max-Age=0; path=/';
    window.location.href = `/accessv2`;
  };

  const hasHermes = activeModules.length === 0 || activeModules.includes('HERMES');
  const hasGrowth = activeModules.length === 0 || activeModules.includes('GROWTH_OS');
  // RWA & Capital operates backstage unless explicitly active
  const hasRwa = activeModules.includes('PANDORAS_RWA');

  return (
    <header className="h-14 bg-[#09090D]/80 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-40 backdrop-blur-xl shadow-sm shadow-black/50">
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
          href={hasHermes ? `/portal/${organizationSlug}` : '#'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold relative ${
            hasHermes
              ? 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20'
              : 'text-zinc-600 cursor-not-allowed opacity-70 border border-transparent'
          }`}
          title={!hasHermes ? "Hermes AI OS (Bloqueado) - Adquiere el add-on para habilitar IA conversacional" : undefined}
          onClick={(e) => { if (!hasHermes) e.preventDefault(); }}
        >
          <Bot className={`w-4 h-4 ${hasHermes ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>Hermes AI OS</span>
          {!hasHermes && <Lock className="w-3 h-3 text-zinc-500 ml-1" />}
        </Link>
        
        <div className="h-3 w-px bg-white/10" />
        
        <Link
          href={hasGrowth ? `/growth-os/organizations/${organizationSlug}` : '#'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold relative ${
            hasGrowth
              ? 'text-zinc-400 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20'
              : 'text-zinc-600 cursor-not-allowed opacity-70 border border-transparent'
          }`}
          title={!hasGrowth ? "Growth OS (Bloqueado) - Activa la vertical de Growth para acceder a CRM y Campañas" : undefined}
          onClick={(e) => { if (!hasGrowth) e.preventDefault(); }}
        >
          <Rocket className={`w-4 h-4 ${hasGrowth ? 'text-violet-400' : 'text-zinc-500'}`} />
          <span>Growth OS</span>
          {!hasGrowth && <Lock className="w-3 h-3 text-zinc-500 ml-1" />}
        </Link>

        <div className="h-3 w-px bg-white/10" />

        <Link
          href={hasRwa ? `/ecosystem/${organizationSlug}/capital` : '#'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold relative ${
            hasRwa
              ? 'text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20'
              : 'text-zinc-600 cursor-not-allowed opacity-70 border border-transparent'
          }`}
          title={!hasRwa ? "RWA & Capital (Bloqueado) - Tokeniza activos y gestiona capital institucional" : undefined}
          onClick={(e) => { if (!hasRwa) e.preventDefault(); }}
        >
          <Landmark className={`w-4 h-4 ${hasRwa ? 'text-indigo-400' : 'text-zinc-500'}`} />
          <span>RWA & Capital</span>
          {!hasRwa && <Lock className="w-3 h-3 text-zinc-500 ml-1" />}
        </Link>
      </div>

      {/* Right User State */}
      <div className="flex items-center gap-3">
        {/* Sovereign Display Controls Trigger */}
        <div className="relative">
          <button
            onClick={() => setDisplayControlsOpen((prev) => !prev)}
            className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono border ${
              displayControlsOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border-white/10'
            }`}
            title="Controles Visuales y Accesibilidad (Sovereign Display)"
            aria-label="Controles Visuales y Accesibilidad"
            aria-expanded={displayControlsOpen}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Display</span>
          </button>

          {displayControlsOpen && (
            <div className="absolute right-0 mt-2 z-50 shadow-2xl">
              <DisplayControlsWidget />
            </div>
          )}
        </div>

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

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Bot, Rocket, Landmark, ShieldCheck, LogOut, Sliders, Lock, Sparkles } from 'lucide-react';
import { DisplayControlsWidget } from '@pandoras/display-engine';
import { TrialUpgradeModal } from '@/components/hermes-portal/trial/TrialUpgradeModal';

interface SovereignHeaderProps {
  organization: { name: string };
  organizationSlug: string;
  activeModules?: string[];
  portalTitle?: string;
}

export function SovereignHeader({ organization, organizationSlug, activeModules = [], portalTitle }: SovereignHeaderProps) {
  const [displayControlsOpen, setDisplayControlsOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const displayControlsRef = useRef<HTMLDivElement>(null);

  // Close display controls on click outside or escape key
  useEffect(() => {
    if (!displayControlsOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (displayControlsRef.current && !displayControlsRef.current.contains(event.target as Node)) {
        setDisplayControlsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDisplayControlsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [displayControlsOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err: unknown) {
      console.warn('[SovereignHeader] Logout API warning:', err);
    }

    const cookiesToClear = [
      'pandoras_portal_session',
      'pandoras_nexus_token',
      'nexus_token',
      'auth_token',
      '__pbox_sid',
      'pbox_session_v3',
      'wallet-address',
      'thirdweb:wallet-address',
      'pd_current_tenant',
      'portal_slug',
      'snarai_project_slug',
    ];
    cookiesToClear.forEach((name) => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;`;
    });

    try {
      localStorage.removeItem('wallet-session');
      localStorage.removeItem('wallet-address');
      localStorage.setItem('wallet-logged-out', 'true');
      localStorage.removeItem('snarai_wallet');
      localStorage.removeItem('thirdweb:active-wallet');
      sessionStorage.clear();
    } catch (storageErr: unknown) {
      console.warn('[SovereignHeader] Storage cleanup warning:', storageErr);
    }

    window.location.href = '/accessv2';
  };

  // Only show as unlocked if explicitly provisioned or in activeModules
  const hasHermes = activeModules.includes('HERMES');
  const hasGrowth = activeModules.includes('GROWTH_OS');
  // RWA & Capital operates backstage unless explicitly active
  const hasRwa = activeModules.includes('PANDORAS_RWA');

  const pathname = usePathname();
  const isHermesPortal = pathname?.startsWith('/portal/') || portalTitle === 'Hermes OS';
  const isGrowthPortal = pathname?.startsWith('/growth-os/') || portalTitle === 'Growth OS';

  const hubUrl = `/ecosystem/${organizationSlug}`;

  return (
    <header className="h-14 bg-[#09090D]/80 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-40 backdrop-blur-xl shadow-sm shadow-black/50">
      {/* Brand Identity / Left Section */}
      {isHermesPortal ? (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs shadow-sm shadow-purple-950/30">
            <Bot className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="font-bold text-sm text-white tracking-tight">Hermes OS</span>
            <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px] sm:max-w-[160px]">{organization.name}</p>
          </div>
        </div>
      ) : isGrowthPortal ? (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-xs shadow-sm shadow-violet-950/30">
            <Rocket className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <span className="font-bold text-sm text-white tracking-tight">Growth OS</span>
            <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px] sm:max-w-[160px]">{organization.name}</p>
          </div>
        </div>
      ) : (
        <Link
          href={hubUrl}
          className="flex items-center gap-3 group transition-all"
          title="Regresar al Hub Central"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-black text-xs shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight group-hover:text-amber-300 transition-colors">
                {organization.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 bg-amber-500/10 text-amber-300 border border-amber-500/25 rounded-full uppercase group-hover:bg-amber-500/20 transition-all">
                Hub Central
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Sovereign Mesh Orchestrator</p>
          </div>
        </Link>
      )}

      {/* 3 Planes Navigation */}
      <div className="hidden md:flex items-center gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
        {hasHermes ? (
          <Link
            href={`/portal/${organizationSlug}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold text-zinc-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Hermes AI OS</span>
          </Link>
        ) : (
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] border border-transparent"
            title="Hermes AI OS (No provisionado) - Clic para adquirir"
          >
            <Bot className="w-4 h-4 text-zinc-500" />
            <span>Hermes AI</span>
            <Lock className="w-3 h-3 text-zinc-500 ml-0.5" />
          </button>
        )}
        
        <div className="h-3 w-px bg-white/10" />
        
        {hasGrowth ? (
          <Link
            href={`/growth-os/organizations/${organizationSlug}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold text-zinc-400 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20"
          >
            <Rocket className="w-4 h-4 text-violet-400" />
            <span>Growth OS</span>
          </Link>
        ) : (
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] border border-transparent"
            title="Growth OS (No provisionado) - Clic para adquirir"
          >
            <Rocket className="w-4 h-4 text-zinc-500" />
            <span>Growth OS</span>
            <Lock className="w-3 h-3 text-zinc-500 ml-0.5" />
          </button>
        )}

        {hasRwa && (
          <>
            <div className="h-3 w-px bg-white/10" />
            <Link
              href={`/ecosystem/${organizationSlug}/capital`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-semibold text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
            >
              <Landmark className="w-4 h-4 text-indigo-400" />
              <span>RWA & Capital</span>
            </Link>
          </>
        )}
      </div>

      {/* Right User State */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Planes & Paquetes Button */}
        <button
          onClick={() => setUpgradeModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border border-amber-500/30 text-amber-300 hover:border-amber-500/50 transition-all shadow-sm shadow-amber-500/10"
          title="Ver paquetes y actualizar plan"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Planes</span>
        </button>

        {/* Sovereign Display Controls Trigger with Outside Click Dismiss */}
        <div className="relative" ref={displayControlsRef}>
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

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-mono text-zinc-300">
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

      {/* Plans & Add-ons Modal */}
      <TrialUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        organizationSlug={organizationSlug}
        organizationName={organization.name}
      />
    </header>
  );
}

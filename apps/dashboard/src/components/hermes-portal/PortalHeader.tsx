'use client';

/**
 * PortalHeader — Phase 6.1 & Cross-Plane Hub Switcher
 * components/hermes-portal/PortalHeader.tsx
 * 
 * Top bar for the Hermes Customer Operating Console.
 * Shows organization identity, system status indicator, quick command, cross-plane navigation and user context.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PortalOrganization } from '@/lib/portal/portal-types';
import type { PortalRole } from '@/lib/portal/permissions';
import { LogOut, Zap, Terminal, Layers, Rocket, Landmark } from 'lucide-react';
import { QuickCommandModal } from './QuickCommandModal';

interface PortalHeaderProps {
  organization: PortalOrganization;
  role: PortalRole;
  organizationSlug: string;
}

export function PortalHeader({ organization, role, organizationSlug }: PortalHeaderProps) {
  const [quickCommandOpen, setQuickCommandOpen] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickCommandOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    document.cookie = 'pandoras_portal_session=; Max-Age=0; path=/';
    window.location.href = `/portal/login`;
  };

  return (
    <>
      <header className="h-12 bg-[#0C0C10] border-b border-white/10 flex items-center justify-between px-4 shrink-0 text-xs font-mono">
        {/* Left: Brand Identity & Tenant */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold text-purple-300 tracking-wider">HERMES OS</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-mono">v1.0.4</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-zinc-300 font-semibold">{organization.name}</span>
          </div>
        </div>

        {/* Center: Cross-Plane Seamless Switcher */}
        <div className="hidden md:flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          <Link
            href={`/ecosystem/${organizationSlug}`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all text-[11px] font-medium"
            title="Ecosystem Hub Central"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Ecosystem Hub</span>
          </Link>
          <div className="h-3 w-px bg-white/10" />
          <Link
            href={`/growth-os/organizations/${organizationSlug}`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-violet-300 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all text-[11px] font-medium"
            title="Growth OS Hub"
          >
            <Rocket className="w-3.5 h-3.5 text-violet-400" />
            <span>Growth OS</span>
          </Link>
          <div className="h-3 w-px bg-white/10" />
          <Link
            href={`/profile/projects/${organizationSlug}/manage`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all text-[11px] font-medium"
            title="Protocol Tokenomics & Capital"
          >
            <Landmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tokenomics</span>
          </Link>
        </div>

        {/* Right: Quick Command & User Action */}
        <div className="flex items-center gap-2.5">
          <button 
            type="button"
            onClick={() => setQuickCommandOpen(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 text-[11px] transition-all cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Quick Command</span>
            <kbd className="bg-black/50 px-1 py-0.2 rounded text-[10px] text-zinc-400 font-mono border border-white/5">⌘K</kbd>
          </button>

          <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-mono capitalize">
            {role === 'operator' ? '⚡ OPERATOR' : `👤 ${role}`}
          </div>
          
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/[0.06] transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Global Quick Command Modal */}
      <QuickCommandModal
        isOpen={quickCommandOpen}
        onClose={() => setQuickCommandOpen(false)}
        organizationSlug={organizationSlug}
        organizationName={organization.name}
      />
    </>
  );
}

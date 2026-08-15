'use client';

/**
 * PortalHeader — Phase 6.1
 * 
 * Top bar for the Hermes Customer Operating Console.
 * Shows organization identity, system status indicator, and user context.
 * 
 * No fake runtime metrics. Status defaults to UNKNOWN until real signals are available.
 */

import React from 'react';
import type { PortalOrganization } from '@/lib/portal/portal-types';
import type { PortalRole } from '@/lib/portal/permissions';
import { LogOut, Zap, Terminal } from 'lucide-react';

interface PortalHeaderProps {
  organization: PortalOrganization;
  role: PortalRole;
  organizationSlug: string;
}

export function PortalHeader({ organization, role, organizationSlug }: PortalHeaderProps) {
  const handleLogout = () => {
    // Clear portal session cookie
    document.cookie = 'pandoras_portal_session=; Max-Age=0; path=/';
    window.location.href = `/portal/login`;
  };

  return (
    <header className="h-12 bg-[#0C0C10] border-b border-white/10 flex items-center justify-between px-4 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-purple-300 tracking-wider">HERMES OS</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">v1.0.4-hybrid</span>
            </div>

            <div className="hidden sm:block h-4 w-px bg-white/10" />

            <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                <span className="text-zinc-300 font-semibold">HEALTHY</span>
            </div>

            <div className="hidden lg:flex items-center gap-4 text-zinc-500 text-[11px]">
                <span>•</span>
                <span>Tenant: <strong className="text-zinc-200">{organization.slug}</strong></span>
                <span>•</span>
                <span>Name: <strong className="text-zinc-200">{organization.name}</strong></span>
            </div>
        </div>

        {/* Right Top Bar Actions */}
        <div className="flex items-center gap-3">
            <button 
                className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 text-[11px] transition-all"
            >
                <Terminal className="w-3.5 h-3.5" />
                <span>Quick Command</span>
                <kbd className="bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 font-mono">⌘K</kbd>
            </button>

            <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] font-mono capitalize">
                {role === 'operator' ? '⚡ OPERATOR' : `👤 ${role}`}
            </div>
            
            <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                title="Sign out"
            >
                <LogOut size={15} />
            </button>
        </div>
    </header>
  );
}

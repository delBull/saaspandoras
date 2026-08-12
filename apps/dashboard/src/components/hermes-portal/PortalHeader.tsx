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
import { LogOut } from 'lucide-react';

interface PortalHeaderProps {
  organization: PortalOrganization;
  role: PortalRole;
  organizationSlug: string;
}

function StatusDot({ status }: { status: 'operational' | 'unknown' | 'degraded' }) {
  const colors = {
    operational: 'bg-emerald-400',
    unknown: 'bg-white/20',
    degraded: 'bg-amber-400',
  };
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status]} shrink-0`}
    />
  );
}

export function PortalHeader({ organization, role, organizationSlug }: PortalHeaderProps) {
  const handleLogout = () => {
    // Clear portal session cookie
    document.cookie = 'pandoras_portal_session=; Max-Age=0; path=/';
    window.location.href = `/growth-os/hermes/portal/login`;
  };

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-10 flex items-center h-16 px-6 bg-[#07070B]/80 backdrop-blur-sm border-b border-white/[0.06] shrink-0">
      {/* Greeting */}
      <div className="flex-1">
        <p className="text-white/40 text-xs">
          {timeOfDay()}, <span className="text-white/70 font-medium">{organization.name}</span>
        </p>
      </div>

      {/* System status pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
        <StatusDot status="unknown" />
        <span className="text-white/40 text-xs font-medium">Hermes</span>
        <span className="text-white/25 text-xs">·</span>
        <span className="text-white/30 text-xs">Status unavailable</span>
      </div>

      {/* Role badge */}
      <div className="ml-4 px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/20">
        <span className="text-violet-300/70 text-xs font-medium capitalize">{role}</span>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="ml-4 p-2 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all"
        title="Sign out"
      >
        <LogOut size={15} />
      </button>
    </header>
  );
}

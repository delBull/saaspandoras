'use client';

import React from 'react';
import type { PortalOrganization } from '@/lib/portal/portal-types';
import { Shield } from 'lucide-react';

interface EcosystemFooterProps {
  organization: PortalOrganization;
}

export function EcosystemFooter({ organization }: EcosystemFooterProps) {
  return (
    <footer className="h-10 bg-[#07070A] border-t border-white/10 flex items-center justify-between px-4 sm:px-6 fixed bottom-0 left-0 right-0 z-30 text-[11px] font-mono text-zinc-500 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>SOVEREIGN MESH V9.0</span>
        </div>
        <span className="hidden sm:inline text-zinc-700">•</span>
        <span className="hidden sm:inline text-zinc-500">Tenant: <strong className="text-zinc-300">{organization.slug}</strong></span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ORCHESTRATOR ONLINE</span>
        </div>
      </div>
    </footer>
  );
}

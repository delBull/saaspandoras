'use client';

import React from 'react';
import { Rocket, Shield, Activity } from 'lucide-react';

interface GrowthOsFooterProps {
  slugId: string;
}

export function GrowthOsFooter({ slugId }: GrowthOsFooterProps) {
  return (
    <footer className="h-10 bg-[#060608] border-t border-white/10 flex items-center justify-between px-4 sm:px-6 fixed bottom-0 left-0 right-0 z-20 text-[11px] font-mono text-zinc-500 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Rocket className="w-3.5 h-3.5 text-violet-400" />
          <span>GROWTH OS KERNEL V2.1</span>
        </div>
        <span className="hidden sm:inline text-zinc-700">•</span>
        <span className="hidden sm:inline text-zinc-500">Tenant: <strong className="text-zinc-300">{slugId}</strong></span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>PIPELINE ENGINE ONLINE</span>
        </div>
      </div>
    </footer>
  );
}

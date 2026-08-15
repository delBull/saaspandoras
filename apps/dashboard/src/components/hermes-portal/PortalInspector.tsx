'use client';

import React from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { HermesIntelligencePanel } from './overview/HermesIntelligencePanel';

export function PortalInspector({ children, title = 'Hermes Operating System', type = 'system', attributes = {}, organization }: any) {
  return (
    <aside className="flex w-full bg-[#12121A] border border-white/[0.08] rounded-2xl flex-col shrink-0 font-sans h-full overflow-hidden shadow-2xl relative">
        <div className="h-12 px-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0C0C12] shrink-0">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <WrenchScrewdriverIcon className="w-3.5 h-3.5 text-purple-400" />
                Inspector
            </span>
            <span className="text-[10px] font-mono bg-white/5 text-zinc-500 px-1.5 py-0.5 rounded">
                {type}
            </span>
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-6 overflow-y-auto">
            <div>
                <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">Context Inspector View</p>
            </div>

            {Object.keys(attributes).length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Attributes</h4>
                    {Object.entries(attributes).map(([key, val]: any) => (
                        <div key={key} className="bg-black/30 border border-white/5 p-2.5 rounded-lg">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">{key}</div>
                            <div className="text-xs text-zinc-200 font-mono mt-0.5 break-all">{String(val)}</div>
                        </div>
                    ))}
                </div>
            )}

            {children}



            <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-2 mt-auto shrink-0">
                <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4 text-purple-400" />
                    ADR-001 Compliant
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                    State & metrics are backed by Postgres persistent storage (`hermes_jobs`).
                </p>
            </div>
        </div>
    </aside>
  );
}

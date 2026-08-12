'use client';

/**
 * SystemCore — Phase 6.2
 * 
 * "The first visual element should be Hermes itself."
 * Shows a central node representing Hermes, with sub-nodes for its subsystems.
 */

import React from 'react';
import type { HermesSystemStatus } from '@/lib/portal/portal-types';
import { 
  Fingerprint, 
  BookOpen, 
  GitBranch, 
  Shield, 
  Cpu 
} from 'lucide-react';

interface SystemCoreProps {
  status: HermesSystemStatus;
  organization: {
    id: string;
    name: string;
  };
}

export function SystemCore({ status, organization }: SystemCoreProps) {
  // Determine if Hermes is generally active based on its subsystems
  const isOverallActive = ['READY', 'ACTIVE', 'OPERATIONAL'].includes(status.identity) || 
                          ['READY', 'ACTIVE', 'OPERATIONAL'].includes(status.knowledge) ||
                          ['READY', 'ACTIVE', 'OPERATIONAL'].includes(status.execution);
                          
  const overallText = isOverallActive ? 'OPERATING NORMALLY' : 'STANDING BY';
  const overallColor = isOverallActive ? 'bg-emerald-500' : 'bg-white/20';
  const pulseClass = isOverallActive ? 'animate-pulse' : '';

  const nodes = [
    { id: 'identity', label: 'Identity', icon: Fingerprint, state: status.identity },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen, state: status.knowledge },
    { id: 'journeys', label: 'Journeys', icon: GitBranch, state: status.journeys },
    { id: 'governance', label: 'Governance', icon: Shield, state: status.governance },
    { id: 'execution', label: 'Execution', icon: Cpu, state: status.execution },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-[#0C0C12] border border-white/[0.04] relative overflow-hidden">
      {/* Background radial glow */}
      {isOverallActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="z-10 flex flex-col items-center text-center">
        <h2 className="text-white font-semibold tracking-[0.2em] text-sm mb-2">HERMES</h2>
        <p className="text-white/40 text-sm mb-4">
          Your cognitive operating system is {isOverallActive ? 'active' : 'idle'}.
        </p>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-12">
          <span className={`w-2 h-2 rounded-full ${overallColor} ${pulseClass}`} />
          <span className="text-white/60 text-xs font-medium tracking-wide">{overallText}</span>
        </div>

        {/* Subsystem Nodes */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {nodes.map((node, index) => {
            const isActive = ['READY', 'ACTIVE', 'OPERATIONAL'].includes(node.state);
            const isWarning = ['WARNING', 'DEGRADED'].includes(node.state);
            const isError = ['ERROR', 'OFFLINE'].includes(node.state);
            
            let nodeColor = 'text-white/30 bg-white/[0.03] border-white/[0.06]';
            if (isActive) nodeColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
            else if (isWarning) nodeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            else if (isError) nodeColor = 'text-red-400 bg-red-500/10 border-red-500/20';

            const Icon = node.icon;

            return (
              <div key={node.id} className="flex flex-col items-center gap-3 relative group">
                {/* Connection line between nodes */}
                {index > 0 && (
                  <div className={`absolute top-5 -left-8 sm:-left-12 w-4 sm:w-8 h-[1px] ${isOverallActive ? 'bg-indigo-500/20' : 'bg-white/[0.06]'}`} />
                )}

                <div 
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${nodeColor}`}
                >
                  <Icon size={16} />
                </div>
                
                <span className="text-white/50 text-xs font-medium">{node.label}</span>

                {/* Hover Tooltip */}
                <div className="absolute top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-[#12121A] border border-white/[0.08] px-3 py-1.5 rounded-lg text-xs text-white/70 shadow-xl z-20">
                  Status: <span className="text-white font-medium">{node.state}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

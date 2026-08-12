'use client';

/**
 * SystemStatusPanel — Phase 6.2
 * 
 * Exposes the real state of Hermes subsystems.
 * "Do NOT infer statuses visually. They must come from the query/view model."
 */

import React from 'react';
import Link from 'next/link';
import type { HermesSystemStatus, SystemStatus } from '@/lib/portal/portal-types';
import { 
  Fingerprint, 
  BookOpen, 
  Plug, 
  GitBranch, 
  Shield, 
  Brain, 
  Cpu,
  ArrowRight
} from 'lucide-react';

interface SystemStatusPanelProps {
  status: HermesSystemStatus;
  organizationSlug: string;
}

export function SystemStatusPanel({ status, organizationSlug }: SystemStatusPanelProps) {
  const subsystems = [
    { id: 'identity', label: 'Identity', state: status.identity, icon: Fingerprint, href: `/portal/${organizationSlug}/identity` },
    { id: 'knowledge', label: 'Knowledge', state: status.knowledge, icon: BookOpen, href: `/portal/${organizationSlug}/knowledge` },
    { id: 'channels', label: 'Channels', state: status.channels, icon: Plug, href: `/portal/${organizationSlug}/channels` },
    { id: 'journeys', label: 'Journeys', state: status.journeys, icon: GitBranch, href: `/portal/${organizationSlug}/journeys` },
    { id: 'governance', label: 'Governance', state: status.governance, icon: Shield, href: `/portal/${organizationSlug}/policies` },
    { id: 'cognitive', label: 'Cognitive', state: status.cognitive, icon: Brain, href: '' },
    { id: 'execution', label: 'Execution', state: status.execution, icon: Cpu, href: '' },
  ];

  return (
    <div className="flex flex-col h-full p-6 rounded-2xl bg-[#0C0C12] border border-white/[0.04]">
      <div className="flex items-center gap-2 mb-6">
        <Cpu size={16} className="text-white/30" />
        <h3 className="text-white/50 text-xs font-semibold tracking-wider uppercase">System Status</h3>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <ul className="space-y-3">
          {subsystems.map(sys => {
            const Icon = sys.icon;
            const isError = ['ERROR', 'OFFLINE'].includes(sys.state);
            const isWarning = ['WARNING', 'DEGRADED', 'NOT_CONFIGURED'].includes(sys.state);
            const isActive = ['READY', 'ACTIVE', 'OPERATIONAL'].includes(sys.state);

            let statusColor = 'text-white/30';
            let dotColor = 'bg-white/20';
            
            if (isActive) {
              statusColor = 'text-emerald-400';
              dotColor = 'bg-emerald-400';
            } else if (isWarning) {
              statusColor = 'text-amber-400';
              dotColor = 'bg-amber-400';
            } else if (isError) {
              statusColor = 'text-red-400';
              dotColor = 'bg-red-400';
            }

            return (
              <li key={sys.id} className="group relative">
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02] group-hover:border-white/[0.05] transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon size={14} className="text-white/30 group-hover:text-white/50 transition-colors" />
                    <span className="text-white/70 text-sm">{sys.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span className={`text-xs font-medium uppercase tracking-wider ${statusColor}`}>
                      {sys.state}
                    </span>
                  </div>
                </div>

                {/* Hover overlay linking to module */}
                {sys.href && (
                  <Link 
                    href={sys.href}
                    className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end px-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-white/50 font-medium bg-[#12121A] px-2 py-1 rounded">
                      Manage <ArrowRight size={12} />
                    </div>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

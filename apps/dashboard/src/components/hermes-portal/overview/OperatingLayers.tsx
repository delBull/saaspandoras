'use client';

/**
 * OperatingLayers — Phase 6.2
 * 
 * "Each layer is a navigable visual object."
 * Shows major Hermes subsystems as clickable cards to navigate to their management screens.
 */

import React from 'react';
import Link from 'next/link';
import type { HermesSystemStatus } from '@/lib/portal/portal-types';
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

interface OperatingLayersProps {
  status: HermesSystemStatus;
  organizationSlug: string;
}

export function OperatingLayers({ status, organizationSlug }: OperatingLayersProps) {
  const layers = [
    { id: 'identity', label: 'IDENTITY', state: status.identity, icon: Fingerprint, href: `/portal/${organizationSlug}/identity` },
    { id: 'knowledge', label: 'KNOWLEDGE', state: status.knowledge, icon: BookOpen, href: `/portal/${organizationSlug}/knowledge` },
    { id: 'channels', label: 'CHANNELS', state: status.channels, icon: Plug, href: `/portal/${organizationSlug}/channels` },
    { id: 'journeys', label: 'JOURNEYS', state: status.journeys, icon: GitBranch, href: `/portal/${organizationSlug}/journeys` },
    { id: 'governance', label: 'GOVERNANCE', state: status.governance, icon: Shield, href: `/portal/${organizationSlug}/policies` },
    { id: 'cognitive', label: 'COGNITIVE', state: status.cognitive, icon: Brain, href: '' },
    { id: 'execution', label: 'EXECUTION', state: status.execution, icon: Cpu, href: '' },
  ];

  return (
    <div>
      <h3 className="text-white/30 text-xs font-semibold tracking-wider uppercase mb-4 pl-2">Operating Layers</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {layers.map(layer => {
          const Icon = layer.icon;
          const isWarning = ['WARNING', 'DEGRADED', 'NOT_CONFIGURED'].includes(layer.state);
          const isError = ['ERROR', 'OFFLINE'].includes(layer.state);
          
          let stateColor = 'text-white/40';
          let dotColor = 'bg-emerald-400';
          if (isWarning) dotColor = 'bg-amber-400';
          if (isError) dotColor = 'bg-red-400';
          if (!['READY', 'ACTIVE', 'OPERATIONAL', 'WARNING', 'DEGRADED', 'NOT_CONFIGURED', 'ERROR', 'OFFLINE'].includes(layer.state)) {
            dotColor = 'bg-white/20';
          }

          const CardContent = (
            <div className={`
              flex flex-col h-28 p-4 rounded-xl border border-white/[0.04] bg-[#0C0C12] 
              hover:bg-white/[0.02] hover:border-white/[0.08] transition-all group relative overflow-hidden
              ${!layer.href && 'opacity-50 grayscale cursor-not-allowed hover:bg-[#0C0C12] hover:border-white/[0.04]'}
            `}>
              <div className="flex items-start justify-between mb-auto">
                <Icon size={16} className="text-white/30 group-hover:text-white/60 transition-colors" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                </div>
              </div>
              
              <div>
                <h4 className="text-white/80 font-medium text-sm tracking-wide">{layer.label}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${stateColor}`}>
                    {layer.state}
                  </span>
                  {layer.href && (
                    <ArrowRight size={12} className="text-white/20 group-hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0" />
                  )}
                </div>
              </div>
            </div>
          );

          if (layer.href) {
            return (
              <Link key={layer.id} href={layer.href} className="block focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl">
                {CardContent}
              </Link>
            );
          }

          return <div key={layer.id}>{CardContent}</div>;
        })}
      </div>
    </div>
  );
}

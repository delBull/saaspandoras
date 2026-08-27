'use client';

/**
 * SystemCore — Unified Cognitive Subsystem Mission Control
 * 
 * Central interactive node displaying Hermes OS health, operational aura,
 * and live interactive status indicators for all 6 subsystems:
 * Identity, Knowledge, Channels, Journeys, Governance, and Execution.
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
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface SystemCoreProps {
  status: HermesSystemStatus;
  organization: {
    id: string;
    name: string;
    slug?: string;
  };
}

export function SystemCore({ status, organization }: SystemCoreProps) {
  const orgSlug = organization.slug || organization.id;

  const nodes = [
    { 
      id: 'identity', 
      label: 'Identity', 
      icon: Fingerprint, 
      state: status.identity || 'READY', 
      href: `/portal/${orgSlug}/identity`,
      desc: 'Tono & Persona Institucional'
    },
    { 
      id: 'knowledge', 
      label: 'Knowledge', 
      icon: BookOpen, 
      state: status.knowledge || 'READY', 
      href: `/portal/${orgSlug}/knowledge`,
      desc: 'Bóveda Soberana & 21 Hechos'
    },
    { 
      id: 'channels', 
      label: 'Channels', 
      icon: Plug, 
      state: status.channels || 'READY', 
      href: `/portal/${orgSlug}/channels`,
      desc: 'Telegram & WhatsApp WABA'
    },
    { 
      id: 'journeys', 
      label: 'Journeys', 
      icon: GitBranch, 
      state: status.journeys || 'READY', 
      href: `/portal/${orgSlug}/journeys`,
      desc: 'Flujos & Embudos de Prospección'
    },
    { 
      id: 'governance', 
      label: 'Governance', 
      icon: Shield, 
      state: status.governance || 'READY', 
      href: `/portal/${orgSlug}/policies`,
      desc: 'Políticas & Temas Prohibidos'
    },
    { 
      id: 'execution', 
      label: 'Execution', 
      icon: Cpu, 
      state: status.execution || 'READY', 
      href: `/portal/${orgSlug}/activity`,
      desc: 'Kernel Cognitivo v1.0.4'
    },
  ];

  // Evaluate global health
  const hasError = nodes.some(n => ['ERROR', 'OFFLINE'].includes(n.state));
  const hasWarningOrPending = nodes.some(n => ['WARNING', 'DEGRADED', 'NOT_CONFIGURED', 'PENDING'].includes(n.state));
  const isHealthy = !hasError && !hasWarningOrPending;

  let overallText = 'HEALTHY • OPERATING NORMALLY';
  let overallBadgeColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let overallDotColor = 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]';

  if (hasError) {
    overallText = 'SYSTEM ERROR • ATTENTION REQUIRED';
    overallBadgeColor = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    overallDotColor = 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)]';
  } else if (hasWarningOrPending) {
    overallText = 'CONFIGURING • PENDING INJECTION';
    overallBadgeColor = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    overallDotColor = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]';
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 sm:px-8 rounded-2xl bg-gradient-to-b from-[#101018] via-[#0C0C12] to-[#09090E] border border-white/[0.06] relative overflow-hidden shadow-2xl">
      {/* Background ambient radial aura */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[260px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isHealthy 
            ? 'bg-emerald-500/10' 
            : hasWarningOrPending 
              ? 'bg-amber-500/10' 
              : 'bg-rose-500/10'
        }`} 
      />

      <div className="z-10 flex flex-col items-center text-center w-full max-w-2xl">
        {/* Subtitle / Brand */}
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={14} className="text-indigo-400" />
          <h2 className="text-white font-bold tracking-[0.25em] text-xs uppercase">
            HERMES COGNITIVE OS
          </h2>
        </div>

        <p className="text-white/60 text-xs sm:text-sm mb-4">
          Your cognitive operating system is {isHealthy ? 'fully active and synchronized' : 'online with configuration notices'}.
        </p>

        {/* Global Status Pill */}
        <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border mb-8 transition-all ${overallBadgeColor}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${overallDotColor}`} />
          <span className="text-[11px] font-mono font-bold tracking-wider">{overallText}</span>
        </div>

        {/* Unified Subsystem Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 w-full pt-2">
          {nodes.map((node) => {
            const isActive = ['READY', 'ACTIVE', 'OPERATIONAL'].includes(node.state);
            const isWarning = ['WARNING', 'DEGRADED', 'NOT_CONFIGURED', 'PENDING'].includes(node.state);
            const isError = ['ERROR', 'OFFLINE'].includes(node.state);

            let nodeStyles = 'text-white/40 bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15]';
            let dotIndicator = 'bg-white/30';
            let statusLabel: string = node.state;
            let statusTextColor = 'text-white/40';

            if (isActive) {
              nodeStyles = 'text-emerald-300 bg-emerald-500/[0.08] border-emerald-500/30 hover:border-emerald-400/60 shadow-sm shadow-emerald-500/10 hover:shadow-emerald-500/20';
              dotIndicator = 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]';
              statusLabel = 'READY';
              statusTextColor = 'text-emerald-400';
            } else if (isWarning) {
              nodeStyles = 'text-amber-300 bg-amber-500/[0.08] border-amber-500/30 hover:border-amber-400/60 shadow-sm shadow-amber-500/10';
              dotIndicator = 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]';
              statusLabel = 'PENDING';
              statusTextColor = 'text-amber-400';
            } else if (isError) {
              nodeStyles = 'text-rose-300 bg-rose-500/[0.08] border-rose-500/30 hover:border-rose-400/60 shadow-sm shadow-rose-500/10';
              dotIndicator = 'bg-rose-400 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.8)]';
              statusLabel = 'ERROR';
              statusTextColor = 'text-rose-400';
            }

            const Icon = node.icon;

            return (
              <Link 
                key={node.id} 
                href={node.href}
                className={`flex flex-col items-center gap-2.5 p-3 rounded-xl border transition-all duration-200 group relative ${nodeStyles}`}
              >
                {/* Node Icon */}
                <div className="w-9 h-9 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon size={18} />
                </div>
                
                {/* Label & Status */}
                <div className="flex flex-col items-center text-center min-w-0">
                  <span className="text-white font-semibold text-xs truncate group-hover:text-white transition-colors">
                    {node.label}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotIndicator}`} />
                    <span className={`text-[10px] font-mono font-medium uppercase ${statusTextColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

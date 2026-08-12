'use client';

/**
 * OverviewMetrics — Phase 6.2
 * 
 * Secondary metrics strip.
 * "Do NOT make metrics the visual protagonist... Expose a compact secondary strip."
 */

import React from 'react';
import { GitBranch, MessageSquare, Shield, Plug } from 'lucide-react';

interface OverviewMetricsProps {
  metrics: {
    activeJourneys?: number;
    activeConversations?: number;
    pendingDecisions?: number;
    connectedChannels?: number;
  };
}

export function OverviewMetrics({ metrics }: OverviewMetricsProps) {
  const items = [
    { id: 'journeys', label: 'Active Journeys', value: metrics.activeJourneys, icon: GitBranch },
    { id: 'conversations', label: 'Conversations', value: metrics.activeConversations, icon: MessageSquare },
    { id: 'decisions', label: 'Pending Decisions', value: metrics.pendingDecisions, icon: Shield },
    { id: 'channels', label: 'Connected Channels', value: metrics.connectedChannels, icon: Plug },
  ].filter(item => typeof item.value === 'number');

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 px-6 rounded-2xl bg-[#0C0C12] border border-white/[0.04]">
      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30">
              <item.icon size={14} />
            </div>
            <div>
              <div className="text-white font-medium leading-none">{item.value}</div>
              <div className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mt-1">{item.label}</div>
            </div>
          </div>
          
          {index < items.length - 1 && (
            <div className="hidden sm:block w-px h-8 bg-white/[0.06] mx-4" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

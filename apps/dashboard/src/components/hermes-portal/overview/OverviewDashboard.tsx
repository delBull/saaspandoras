'use client';

/**
 * OverviewDashboard — Phase 6.2 Mission Control
 * 
 * Container for the Mission Control dashboard.
 * 
 * Hierarchy: STATE → INTELLIGENCE → ACTIVITY → METRICS
 */

import React from 'react';
import type { HermesOverviewView, PortalContext } from '@/lib/portal/portal-types';
import { SystemCore } from './SystemCore';
import { SystemStatusPanel } from './SystemStatusPanel';
import { StrategicActivityCard } from './StrategicActivityCard';
import { LiveActivityFeed } from './LiveActivityFeed';
import { OperatingLayers } from './OperatingLayers';
import { OverviewMetrics } from './OverviewMetrics';
import { HermesIntelligencePanel } from './HermesIntelligencePanel';

interface OverviewDashboardProps {
  context: PortalContext;
  overview: HermesOverviewView | null;
}

export function OverviewDashboard({ context, overview }: OverviewDashboardProps) {
  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
          <span className="text-white/20 text-xl">⚠</span>
        </div>
        <h2 className="text-white/60 text-lg font-semibold mb-2">System unavailable</h2>
        <p className="text-white/30 text-sm max-w-sm">
          Unable to retrieve current system status.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12 animate-in fade-in duration-500 w-full items-stretch h-full px-4 sm:px-6">
      {/* MISSION CONTROL COLUMN */}
      <div className="flex-1 flex flex-col gap-8 w-full max-w-full">
        {/* ZONE 1: HEADER (Handled by PortalHeader in Shell) */}
        
        {/* ZONE 2: SYSTEM CORE */}
        <section>
          <SystemCore status={overview.system} organization={overview.organization} />
        </section>

        {/* ZONE 3: CURRENT MISSION & SYSTEM STATUS */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <StrategicActivityCard activity={overview.strategicActivity} />
          <SystemStatusPanel status={overview.system} organizationSlug={context.organization.slug} />
        </section>

        {/* ZONE 4: OPERATING LAYERS */}
        <section>
          <OperatingLayers status={overview.system} organizationSlug={context.organization.slug} />
        </section>

        {/* ZONE 5: LIVE ACTIVITY */}
        <section>
          <LiveActivityFeed activity={overview.activity} />
        </section>

        {/* ZONE 6: METRICS (Secondary) */}
        {Object.keys(overview.metrics).length > 0 && (
          <section>
            <OverviewMetrics metrics={overview.metrics} />
          </section>
        )}
      </div>

      {/* HERMES INTELLIGENCE COLUMN */}
      <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 sticky top-6 h-[calc(100vh-2rem)]">
        <HermesIntelligencePanel organizationSlug={context.organization.slug} organizationName={overview.organization.name} />
      </div>
    </div>
  );
}

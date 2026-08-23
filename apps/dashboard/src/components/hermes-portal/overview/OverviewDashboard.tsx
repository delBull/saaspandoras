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
    <div className="flex flex-col gap-8 pt-6 pb-12 animate-in fade-in duration-500 w-full px-4 sm:px-6">
      
      {/* TOP ROW: Core, Mission, and Hermes Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left Column: System Core & Current Mission (7 cols on lg, 7 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-6 w-full">
          {/* ZONE 2: UNIFIED SYSTEM CORE (HERMES HEALTH & 6 NODES) */}
          <section>
            <SystemCore 
              status={overview.system} 
              organization={{
                id: context.organization.id || context.organization.slug,
                name: overview.organization.name || context.organization.name,
                slug: context.organization.slug
              }} 
            />
          </section>

          {/* ZONE 3: CURRENT STRATEGIC MISSION */}
          <section className="w-full">
            <StrategicActivityCard 
              activity={overview.strategicActivity} 
              organizationSlug={context.organization.slug}
            />
          </section>
        </div>

        {/* Right Column: Hermes Intelligence Chat (5 cols on lg, 5 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col w-full sticky top-4 z-10">
          <HermesIntelligencePanel 
            organizationSlug={context.organization.slug} 
            organizationName={overview.organization.name} 
          />
        </div>
      </div>

      {/* BOTTOM SECTIONS: Full Width */}
      <div className="flex flex-col gap-8 w-full max-w-full">
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
    </div>
  );
}

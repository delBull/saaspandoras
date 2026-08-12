/**
 * Portal Overview — Phase 6.2 Mission Control
 * /portal/[organizationSlug]/page.tsx
 * 
 * "Mission Control for an AI Operating System."
 * 
 * Authorization was already enforced by layout.tsx.
 * This page operates within the authorized tenant context and transforms
 * the application-level OrganizationOverviewView into the presentation-safe
 * HermesOverviewView contract.
 */

import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { getOverviewQuery } from '@/lib/pandoras/composition/control-plane-composition';
import { OverviewDashboard } from '@/components/hermes-portal/overview/OverviewDashboard';
import type { HermesOverviewView, SystemStatus, ActivityEventView } from '@/lib/portal/portal-types';
import type { OrganizationOverviewView } from '@/lib/pandoras/core/domains/control-plane/view-models';

export default async function PortalOverviewPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  
  // 1. Context already guaranteed safe by layout, but we resolve it to pass downward
  const context = await resolvePortalContext(organizationSlug);

  // 2. Fetch the real application data (never direct DB queries)
  let rawOverview: OrganizationOverviewView | null = null;
  try {
    rawOverview = await getOverviewQuery.execute(context.tenant as any, context.tenant.organizationId);
  } catch (error) {
    console.error('[PortalOverview] Failed to fetch overview data:', error);
  }

  // 3. Map application data to presentation-safe view model
  let overviewView: HermesOverviewView | null = null;
  
  if (rawOverview) {
    // Derive subsystem status based on metrics & strategic activity for Phase 6.2
    // Future phases will inject real runtime statuses here.
    const hasGoals = rawOverview.metrics.activeGoals > 0;
    
    // Identity & Knowledge are considered READY if the tenant exists
    const identityStatus: SystemStatus = 'READY';
    const knowledgeStatus: SystemStatus = 'READY';
    
    const channelsStatus: SystemStatus = 'NOT_CONFIGURED'; // Will implement in 6.5
    const journeysStatus: SystemStatus = hasGoals ? 'ACTIVE' : 'NOT_CONFIGURED';
    
    const govStatus: SystemStatus = rawOverview.metrics.pendingDecisions > 0 ? 'PROCESSING' : 'READY';
    const cognitiveStatus: SystemStatus = 'READY'; 
    const executionStatus: SystemStatus = 'READY';

    // Temporary: Map recent activities if any exist in the future, else empty array
    const activityFeed: ActivityEventView[] = [];

    overviewView = {
      organization: {
        id: rawOverview.organizationId,
        name: rawOverview.name,
      },
      system: {
        identity: identityStatus,
        knowledge: knowledgeStatus,
        channels: channelsStatus,
        journeys: journeysStatus,
        governance: govStatus,
        cognitive: cognitiveStatus,
        execution: executionStatus,
      },
      strategicActivity: {
        active: !!rawOverview.currentStrategicActivity,
        title: rawOverview.currentStrategicActivity?.missionName,
        stage: rawOverview.currentStrategicActivity?.phase,
        progress: rawOverview.currentStrategicActivity?.progressPercentage,
      },
      metrics: {
        activeJourneys: rawOverview.metrics.activeMissions,
        pendingDecisions: rawOverview.metrics.pendingDecisions,
        // connectedChannels: 0, 
        // activeConversations: 0,
      },
      activity: activityFeed,
    };
  }

  // 4. Render Mission Control
  return <OverviewDashboard context={context} overview={overviewView} />;
}

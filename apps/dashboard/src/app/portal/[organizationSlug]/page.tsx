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
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';
import { getOverviewQuery } from '@/lib/pandoras/composition/control-plane-composition';
import { GetKnowledgeOverviewQuery } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import { OverviewDashboard } from '@/components/hermes-portal/overview/OverviewDashboard';
import type { HermesOverviewView, SystemStatus, ActivityEventView } from '@/lib/portal/portal-types';
import type { OrganizationOverviewView } from '@/lib/pandoras/core/domains/control-plane/view-models';

export default async function PortalOverviewPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  
  // 1. Context already guaranteed safe by layout, but we resolve it to pass downward
  const context = await resolvePortalContext(organizationSlug);

  // 2. Fetch the real application data (never direct DB queries)
  let rawOverview: OrganizationOverviewView | null = null;
  let knowledgeHealth: SystemStatus = 'READY';
  try {
    const cpCtx = new ControlPlaneContext(
      context.tenant.sessionId,
      context.tenant.actorId,
      context.tenant.role as any,
      context.tenant.permissions as any,
      [{ organizationId: context.tenant.organizationId, role: context.tenant.role as any }]
    );
    
    rawOverview = await getOverviewQuery.execute(cpCtx, context.tenant.organizationId);
    
    const knowledgeQuery = new GetKnowledgeOverviewQuery();
    const kOverview = await knowledgeQuery.execute(cpCtx, context.tenant.organizationId);
    knowledgeHealth = kOverview.knowledgeHealth === 'EMPTY' ? 'NOT_CONFIGURED' : kOverview.knowledgeHealth as SystemStatus;
  } catch (error) {
    console.error('[PortalOverview] Failed to fetch overview data:', error);
  }

  // 3. Map application data to presentation-safe view model
  let overviewView: HermesOverviewView | null = null;
  
  if (rawOverview) {
    // Derive subsystem status based on metrics & strategic activity for Phase 6.2
    // Future phases will inject real runtime statuses here.
    const hasGoals = rawOverview.metrics.activeGoals > 0;
    
    // Identity is considered READY if the tenant exists
    const identityStatus: SystemStatus = 'READY';
    const knowledgeStatus: SystemStatus = knowledgeHealth;
    
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
      systemStatus: rawOverview.systemStatus || 'NOT_CONFIGURED',
      journeyStatus: rawOverview.journeyStatus || 'NOT_STARTED',
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

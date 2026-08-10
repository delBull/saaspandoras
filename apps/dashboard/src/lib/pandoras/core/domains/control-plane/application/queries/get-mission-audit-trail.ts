import { ControlPlaneContext } from '../context';
import { ActivityAuditView, ActivityAuditItemView } from '../../view-models';
import { GovernanceEventRepository } from '~/lib/pandoras/core/ports/repositories/governance-event-repository.interface';
import { db } from '~/db';
import { eq, inArray } from 'drizzle-orm';
import { missions, missionEvents } from '~/db/schema';

export class GetMissionAuditTrailQuery {
  constructor(
    private readonly governanceEventRepo: GovernanceEventRepository
  ) {}

  async execute(context: ControlPlaneContext, requestedOrganizationId: string, missionId?: string): Promise<ActivityAuditView> {
    const scope = context.requireOrganizationScope(requestedOrganizationId);
    
    // We get the governance events for the organization
    const events = await this.governanceEventRepo.getByOrganization(scope);

    // Map governance events to ActivityAuditItemView
    const timeline: ActivityAuditItemView[] = events.map(event => ({
      id: event.id,
      timestamp: event.occurredAt,
      type: 'GOVERNANCE', // we map governance events to GOVERNANCE type in the UI for now
      title: event.type,
      description: event.payload ? JSON.stringify(event.payload, null, 2) : 'No description',
      actor: event.actorId || event.actorType,
      details: event.payload
    }));

    // Fetch mission events for the organization
    const orgMissions = await db.select({ id: missions.id }).from(missions).where(eq(missions.organizationId, requestedOrganizationId));
    const orgMissionIds = orgMissions.map(m => m.id);

    if (orgMissionIds.length > 0) {
        const mEvents = await db.query.missionEvents.findMany({
            where: inArray(missionEvents.missionId, orgMissionIds)
        });

        const missionTimeline: ActivityAuditItemView[] = mEvents.map(event => {
            let type: ActivityAuditItemView['type'] = 'MISSION_EVENT';
            if (event.eventType === 'EXECUTION_SUCCEEDED') type = 'EXECUTION';
            else if (event.eventType === 'EXECUTION_FAILED') type = 'EXECUTION';
            
            return {
                id: event.id,
                timestamp: event.createdAt,
                type,
                title: event.eventType,
                description: event.payload ? JSON.stringify(event.payload, null, 2) : 'No description',
                actor: 'ExecutionOS',
                details: event.payload as Record<string, any>
            };
        });

        timeline.push(...missionTimeline);
    }

    return {
      organizationId: requestedOrganizationId,
      missionId,
      timeline: timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    };
  }
}

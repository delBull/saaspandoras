import { NormalizedInboundMessage } from '../../channels/normalized-message';
import { JourneySnapshot } from './conversation-context';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface JourneyEnginePort {
  retrieveContext(normalized: NormalizedInboundMessage): Promise<JourneySnapshot>;
}

export class JourneyEngine implements JourneyEnginePort {
  
  /**
   * Orchestrates the retrieval of the active Journey and its corresponding state
   * for the given actor within the organization.
   */
  async retrieveContext(normalized: NormalizedInboundMessage): Promise<JourneySnapshot> {
    const actorId = normalized.actor.externalActorId;
    const organizationId = normalized.organizationId;
    
    // Resolve the journey from the tenant's DB profile instead of a hardcoded
    // slug. A project that is live gets the sales/prospect journey; everything
    // else (unknown or non-live tenants) gets the onboarding trial journey.
    const isLiveTenant = await this.isLiveProject(organizationId);
    return this.buildJourney(organizationId, actorId, isLiveTenant);
  }

  private async isLiveProject(organizationId: string): Promise<boolean> {
    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.slug, organizationId),
        columns: { status: true }
      });
      return project?.status === 'live';
    } catch (err) {
      // K12-A45 fail-safe: never break the pipeline on DB unavailability.
      console.warn(`[JourneyEngine] DB lookup failed for org ${organizationId}, defaulting to trial journey.`, err);
      return false;
    }
  }

  private buildJourney(organizationId: string, actorId: string, isLiveTenant: boolean): JourneySnapshot {
    console.log(`[JourneyEngine] Retrieving active journey for org ${organizationId}, actor ${actorId}`);
    
    if (!isLiveTenant) {
      return {
        journeyId: 'jny_onboarding_trial_01',
        currentStage: 'FREE_TRIAL_DAY_1',
        objectives: [
          'Complete initial account setup',
          'Explore capabilities without restrictions (3 days)',
          'Optionally extend trial by 3 additional days if criteria met'
        ],
        allowedTransitions: ['TRIAL_EXTENDED', 'SUBSCRIPTION_ACTIVE', 'TRIAL_EXPIRED']
      };
    }

    // Sales prospect journey for mature (live) tenants
    return {
      journeyId: `jny_sales_prospect_${organizationId}`,
      currentStage: 'LEAD_QUALIFICATION',
      objectives: [
        'Understand user investment budget',
        'Identify preferred property types',
        'Collect verified contact information'
      ],
      allowedTransitions: ['KYC_STARTED', 'NOT_INTERESTED', 'APPOINTMENT_SCHEDULED']
    };
  }
}

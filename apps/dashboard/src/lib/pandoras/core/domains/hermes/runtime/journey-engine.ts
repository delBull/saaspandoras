import { NormalizedInboundMessage } from '../../channels/normalized-message';
import { JourneySnapshot } from './conversation-context';

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
    
    // In later phases (Phase 6.6.x+), this will query the DB:
    // SELECT * FROM active_journeys WHERE actor_id = $1 AND organization_id = $2
    
    // For now, we mock the retrieval. We explicitly handle the FREE_TRIAL logic
    // (3 days base, expandable by 3 days) as requested by the user, ensuring
    // that trials can proceed without blocking the user.
    return this.mockJourneyRetrieval(organizationId, actorId);
  }

  private mockJourneyRetrieval(organizationId: string, actorId: string): JourneySnapshot {
    console.log(`[JourneyEngine] Retrieving active journey for org ${organizationId}, actor ${actorId}`);
    
    // Check if there is a specific trial logic for the organization.
    // If the organization is setting up, they might be in a FREE_TRIAL journey.
    if (organizationId !== 'snarai') {
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

    // Default mock journey for end-users interacting with a mature tenant (like S'Narai)
    return {
      journeyId: 'jny_sales_prospect_01',
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

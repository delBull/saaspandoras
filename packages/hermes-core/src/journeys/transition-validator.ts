import {
  JourneyActionProposal,
  JourneyTransitionDecision,
  JourneyTransition,
  ActorJourneyState,
  JourneyDefinition,
} from './contracts';

export class JourneyTransitionValidator {
  /**
   * Pure domain function to validate if a proposed action is allowed.
   * Does not fetch from DB, assumes caller provided the full state.
   */
  public validateTransition(
    proposal: JourneyActionProposal,
    actorState: ActorJourneyState,
    journey: JourneyDefinition,
    availableTransitions: JourneyTransition[]
  ): JourneyTransitionDecision {
    
    // 1. Tenant authority check
    if (proposal.organizationId !== actorState.organizationId || proposal.organizationId !== journey.organizationId) {
      return { allowed: false, reason: 'Organization ID mismatch' };
    }

    // 2. Actor authority check
    if (proposal.actorId !== actorState.actorId) {
      return { allowed: false, reason: 'Actor ID mismatch' };
    }

    // 3. Version integrity
    if (proposal.journeyVersion !== actorState.journeyVersion || proposal.journeyVersion !== journey.version) {
      return { allowed: false, reason: 'Journey version mismatch' };
    }

    // 4. Journey active check
    if (journey.status !== 'ACTIVE') {
      return { allowed: false, reason: 'Journey is inactive' };
    }

    // 5. Actor State check
    if (actorState.status !== 'IN_PROGRESS') {
      return { allowed: false, reason: 'Actor journey is not in progress' };
    }

    // Handle special proposals
    if (proposal.type === 'ABORT') {
      return { allowed: true, fromStageId: actorState.currentStageId, toStageId: 'ABORT', reason: 'Explicit abort requested' };
    }
    
    if (proposal.type === 'COMPLETE') {
      return { allowed: true, fromStageId: actorState.currentStageId, toStageId: 'COMPLETE', reason: 'Explicit completion requested' };
    }

    // Handle target stage transition
    if (proposal.type === 'REQUEST_STAGE_TRANSITION') {
      if (!proposal.targetStageId) {
        return { allowed: false, reason: 'Target stage ID missing in proposal' };
      }

      // Check if the target stage exists in allowed transitions from current stage
      const validTransition = availableTransitions.find(
        (t) => (t.fromStageId === actorState.currentStageId || t.fromStageId === 'ANY') && 
               (t.toStageId === proposal.targetStageId || t.toStageId.toUpperCase() === proposal.targetStageId?.toUpperCase())
      );

      if (!validTransition) {
        return { allowed: false, reason: `Transition from ${actorState.currentStageId} to ${proposal.targetStageId} is not allowed` };
      }

      return {
        allowed: true,
        fromStageId: actorState.currentStageId,
        toStageId: validTransition.toStageId,
        reason: 'Valid transition mapped in graph',
      };
    }

    return { allowed: false, reason: 'Unknown proposal type' };
  }
}

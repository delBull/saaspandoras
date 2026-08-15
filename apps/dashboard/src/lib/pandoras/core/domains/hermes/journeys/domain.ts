import {
  ActorJourneyState,
  JourneyActionProposal,
  JourneyDefinition,
  JourneyTransition,
  JourneyTransitionDecision,
} from './contracts';
import { JourneyTransitionValidator } from './transition-validator';
import { InvalidTransitionError, TenantIsolationError } from './errors';

export class JourneyDomain {
  private validator: JourneyTransitionValidator;

  constructor() {
    this.validator = new JourneyTransitionValidator();
  }

  /**
   * Pure domain function to apply a proposed transition to an actor's state,
   * returning the new state IF the transition is allowed.
   */
  public applyTransition(
    proposal: JourneyActionProposal,
    actorState: ActorJourneyState,
    journey: JourneyDefinition,
    availableTransitions: JourneyTransition[]
  ): ActorJourneyState {
    
    // Safety check for isolation
    if (proposal.organizationId !== journey.organizationId || actorState.organizationId !== journey.organizationId) {
      throw new TenantIsolationError(actorState.id, proposal.organizationId);
    }

    const decision = this.validator.validateTransition(proposal, actorState, journey, availableTransitions);

    if (!decision.allowed) {
      throw new InvalidTransitionError(decision.reason);
    }

    const newState = { ...actorState, lastAdvancedAt: new Date() };

    if (decision.toStageId === 'ABORT') {
      newState.status = 'ABORTED';
      newState.completedAt = new Date();
    } else if (decision.toStageId === 'COMPLETE') {
      newState.status = 'COMPLETED';
      newState.completedAt = new Date();
    } else {
      newState.currentStageId = decision.toStageId;
    }

    return newState;
  }
}

/**
 * Pure domain contracts for Hermes Journeys.
 * These types define the domain boundaries and must not depend on database schemas or LLM specific structures.
 */

export type JourneyStatus = 'ACTIVE' | 'INACTIVE';
export type ActorJourneyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';

export interface JourneyDefinition {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  version: number;
  status: JourneyStatus;
  isDefault: boolean;
}

export interface JourneyStage {
  id: string;
  journeyId: string;
  name: string;
  orderIndex: number;
  objectives: string[];
}

export interface JourneyTransition {
  id: string;
  journeyId: string;
  fromStageId: string;
  toStageId: string;
  trigger: string | null;
  condition: string | null;
  priority: number;
}

export interface ActorJourneyState {
  id: string;
  organizationId: string;
  actorId: string;
  journeyId: string;
  journeyVersion: number;
  currentStageId: string;
  status: ActorJourneyStatus;
  startedAt: Date;
  lastAdvancedAt: Date;
  completedAt: Date | null;
}

/**
 * The snapshot presented to the LLM (Cognitive Context) representing the user's current goal state.
 */
export interface JourneySnapshot {
  journeyId: string;
  journeyVersion: number;
  stageId: string;
  stageName: string;
  objectives: string[];
  availableTransitions: Pick<JourneyTransition, 'fromStageId' | 'toStageId' | 'trigger' | 'condition'>[];
}

/**
 * A proposal produced by the LLM or any other agent to change the actor's journey state.
 * This is NEVER applied directly to persistence. It must be validated.
 */
export interface JourneyActionProposal {
  type: 'REQUEST_STAGE_TRANSITION' | 'ABORT' | 'COMPLETE';
  organizationId: string;
  actorId: string;
  journeyId: string;
  journeyVersion: number;
  targetStageId?: string;
  reason?: string;
}

/**
 * The output of the TransitionValidator, determining if the proposal is allowed.
 */
export type JourneyTransitionDecision = 
  | { allowed: true; fromStageId: string; toStageId: string; reason: string }
  | { allowed: false; reason: string };

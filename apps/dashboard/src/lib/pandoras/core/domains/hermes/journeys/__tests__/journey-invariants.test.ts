import { describe, it, expect, beforeEach } from 'vitest';
import { JourneyDomain } from '../domain';
import { InvalidTransitionError, TenantIsolationError } from '../errors';
import {
  JourneyActionProposal,
  ActorJourneyState,
  JourneyDefinition,
  JourneyTransition,
} from '../contracts';

describe('Journey Invariants', () => {
  let domain: JourneyDomain;

  const mockOrg = 'org_snarai';
  const mockActor = 'usr_123';
  const mockJourneyId = 'jny_001';

  const mockJourney: JourneyDefinition = {
    id: mockJourneyId,
    organizationId: mockOrg,
    name: 'Sales',
    description: null,
    version: 1,
    status: 'ACTIVE',
    isDefault: true,
  };

  const mockState: ActorJourneyState = {
    id: 'act_jny_1',
    organizationId: mockOrg,
    actorId: mockActor,
    journeyId: mockJourneyId,
    journeyVersion: 1,
    currentStageId: 'STAGE_A',
    status: 'IN_PROGRESS',
    startedAt: new Date(),
    lastAdvancedAt: new Date(),
    completedAt: null,
  };

  const mockTransitions: JourneyTransition[] = [
    {
      id: 't_1',
      journeyId: mockJourneyId,
      fromStageId: 'STAGE_A',
      toStageId: 'STAGE_B',
      trigger: null,
      condition: null,
      priority: 0,
    },
  ];

  beforeEach(() => {
    domain = new JourneyDomain();
  });

  it('JOURNEY-001/002: Tenant isolation - rejects proposal from different org', () => {
    const proposal: JourneyActionProposal = {
      type: 'REQUEST_STAGE_TRANSITION',
      organizationId: 'org_other',
      actorId: mockActor,
      journeyId: mockJourneyId,
      journeyVersion: 1,
      targetStageId: 'STAGE_B',
    };

    expect(() => {
      domain.applyTransition(proposal, mockState, mockJourney, mockTransitions);
    }).toThrow(TenantIsolationError);
  });

  it('JOURNEY-003: Valid transition succeeds', () => {
    const proposal: JourneyActionProposal = {
      type: 'REQUEST_STAGE_TRANSITION',
      organizationId: mockOrg,
      actorId: mockActor,
      journeyId: mockJourneyId,
      journeyVersion: 1,
      targetStageId: 'STAGE_B',
    };

    const newState = domain.applyTransition(proposal, mockState, mockJourney, mockTransitions);
    
    expect(newState.currentStageId).toBe('STAGE_B');
    expect(newState.status).toBe('IN_PROGRESS');
  });

  it('JOURNEY-004: Invalid transition is rejected', () => {
    const proposal: JourneyActionProposal = {
      type: 'REQUEST_STAGE_TRANSITION',
      organizationId: mockOrg,
      actorId: mockActor,
      journeyId: mockJourneyId,
      journeyVersion: 1,
      targetStageId: 'STAGE_C', // Does not exist in mockTransitions
    };

    expect(() => {
      domain.applyTransition(proposal, mockState, mockJourney, mockTransitions);
    }).toThrow(InvalidTransitionError);
  });

  it('JOURNEY-008: LLM proposal is just a proposal and can be rejected', () => {
    const proposal: JourneyActionProposal = {
      type: 'REQUEST_STAGE_TRANSITION',
      organizationId: mockOrg,
      actorId: mockActor,
      journeyId: mockJourneyId,
      journeyVersion: 1,
      targetStageId: 'STAGE_Z', // LLM hallucinates a stage
    };

    // The domain throws, meaning the persistence layer is never called.
    expect(() => {
      domain.applyTransition(proposal, mockState, mockJourney, mockTransitions);
    }).toThrow(InvalidTransitionError);
  });

  it('JOURNEY-005: Actor mismatch is rejected', () => {
    const proposal: JourneyActionProposal = {
      type: 'REQUEST_STAGE_TRANSITION',
      organizationId: mockOrg,
      actorId: 'usr_different',
      journeyId: mockJourneyId,
      journeyVersion: 1,
      targetStageId: 'STAGE_B',
    };

    expect(() => {
      domain.applyTransition(proposal, mockState, mockJourney, mockTransitions);
    }).toThrow(InvalidTransitionError);
  });
});

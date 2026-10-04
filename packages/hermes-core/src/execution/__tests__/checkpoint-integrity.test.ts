/**
 * Hito 1 — Zero-Trust Checkpoint Integrity tests (vitest).
 * Guarantees: (1) tamper detected → FAIL-CLOSED; (2) untampered checkpoint resumes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { PersistentExecutionRuntime } from '../persistent-execution-runtime';
import { CheckpointRepository } from '../checkpoint-repository';
import type { WorkflowDefinition } from '../workflow-definition';
import type { IPolicyEngine } from '../policy-engine';
import type { IExecutionJournal } from '../execution-journal';
import type { ExecutionIdentitySnapshot } from '../../contracts';

const WORKFLOW: WorkflowDefinition<any, string> = {
  id: 'test.checkpoint.v1',
  version: '1',
  initialState: 'A',
  terminalStates: ['DONE'],
  stages: ['A', 'B', 'DONE'],
  requiredCapabilities: [],
  inputType: 'any',
};

const IDENTITY: ExecutionIdentitySnapshot = {
  actor: { userId: 'act_1', roles: ['USER'], displayName: 'Tester' },
} as unknown as ExecutionIdentitySnapshot;

function makePolicy(allowed: boolean): IPolicyEngine {
  return {
    canExecute: vi.fn().mockResolvedValue({ allowed, reason: allowed ? undefined : 'test' }),
  } as unknown as IPolicyEngine;
}

function makeJournal(): IExecutionJournal {
  return {
    append: vi.fn().mockResolvedValue(undefined),
  } as unknown as IExecutionJournal;
}

describe('PersistentExecutionRuntime — zero-trust checkpoint integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails closed on tampered state_payload (hash mismatch)', async () => {
    const statePayload = { id: 'exec_1', status: 'PENDING', payload: { x: 1 } };
    // Hash captured at write time; payload is then mutated in DB → mismatch
    const hashAtWrite = crypto.createHash('sha256').update(JSON.stringify(statePayload)).digest('hex');
    const tampered = { ...statePayload, payload: { x: 9999 } };

    const checkpoint = {
      id: 'exec_1',
      sessionId: 's1',
      organizationId: 'org_1',
      actorId: 'act_user',
      currentStageId: 'A',
      statePayload: tampered,
      status: 'PENDING_APPROVAL',
      stateIntegrityHash: hashAtWrite,
      createdAt: new Date(),
    };

    const checkpointRepo = {
      findById: vi.fn().mockResolvedValue(checkpoint),
      markResumed: vi.fn().mockResolvedValue(undefined),
    } as unknown as CheckpointRepository;

    const runtime = new PersistentExecutionRuntime(makePolicy(true), makeJournal(), checkpointRepo);

    await expect(
      runtime.resume(WORKFLOW, 'exec_1', { kind: 'APPROVE', payload: 'go' } as any, { id: 'act_user', type: 'USER', roles: ['USER'] } as any)
    ).rejects.toThrow(/FAIL-CLOSED: Checkpoint state integrity hash mismatch/);
    expect(checkpointRepo.markResumed).not.toHaveBeenCalled();
  });

  it('resume succeeds when integrity hash matches', async () => {
    const statePayload = {
      id: 'exec_2',
      workflowDefinitionId: WORKFLOW.id,
      status: 'PENDING',
      currentStage: 'A',
      identityContext: IDENTITY,
      payload: { y: 2 },
      runtimeMemory: {},
      pendingActions: [],
      generatedArtifacts: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    const hash = crypto.createHash('sha256').update(JSON.stringify(statePayload)).digest('hex');

    const checkpoint = {
      id: 'exec_2',
      sessionId: 's2',
      organizationId: 'org_1',
      actorId: 'act_user',
      currentStageId: 'A',
      statePayload,
      status: 'PENDING_APPROVAL',
      stateIntegrityHash: hash,
      createdAt: new Date(),
    };

    const checkpointRepo = {
      findById: vi.fn().mockResolvedValue(checkpoint),
      markResumed: vi.fn().mockResolvedValue(undefined),
    } as unknown as CheckpointRepository;

    const runtime = new PersistentExecutionRuntime(makePolicy(true), makeJournal(), checkpointRepo);

    const instance = await runtime.resume(WORKFLOW, 'exec_2', { kind: 'APPROVE', payload: 'ok' } as any, { id: 'act_user', type: 'USER', roles: ['USER'] } as any);
    expect(instance.id).toBe('exec_2');
    expect(checkpointRepo.markResumed).toHaveBeenCalledWith('exec_2');
  });

  it('refuses to resume when checkpoint status is not PENDING_APPROVAL', async () => {
    const checkpoint = {
      id: 'exec_3',
      statePayload: {},
      status: 'RESUMED',
      stateIntegrityHash: 'x'.repeat(64),
      createdAt: new Date(),
    };
    const checkpointRepo = {
      findById: vi.fn().mockResolvedValue(checkpoint),
      markResumed: vi.fn(),
    } as unknown as CheckpointRepository;

    const runtime = new PersistentExecutionRuntime(makePolicy(true), makeJournal(), checkpointRepo);

    await expect(
      runtime.resume(WORKFLOW, 'exec_3', { kind: 'APPROVE' } as any, { id: 'a', type: 'USER', roles: [] } as any)
    ).rejects.toThrow(/Cannot resume checkpoint in status: RESUMED/);
    expect(checkpointRepo.markResumed).not.toHaveBeenCalled();
  });
});

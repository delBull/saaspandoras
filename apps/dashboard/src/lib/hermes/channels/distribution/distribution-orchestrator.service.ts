/**
 * 🏛️ Hermes Distribution Orchestrator Service (FASE 3)
 * apps/dashboard/src/lib/hermes/channels/distribution/distribution-orchestrator.service.ts
 *
 * Implements the authoritative Distribution Job lifecycle and Execution Lease Handshake:
 * 1. Durable database-backed idempotency per tenant.
 * 2. Separation of DistributionJob vs ExecutionAttempt.
 * 3. 2-Phase Sofia Handshake (Lease ACK -> Sofia owns execution).
 * 4. Post-ACK network loss -> UNKNOWN (NEVER FAILED, NEVER direct fallback).
 * 5. Pre-ACK connection failure -> DirectPublisher permitted as secondary attempt.
 * 6. Audit trail for every state transition and lease event.
 */

import crypto from 'crypto';
import { db } from '@/db';
import {
  distributionJobs,
  distributionExecutionAttempts,
  type DistributionJob,
  type DistributionExecutionAttempt,
} from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  DistributionStateMachine,
  type DistributionJobStatus,
  type ExecutionAttemptStatus,
} from './distribution-state-machine';
import {
  type ISofiaExecutionClient,
  DefaultSofiaExecutionClient,
  SofiaPreAckError,
  SofiaPostAckTimeoutError,
} from './sofia-execution-client';
import {
  directChannelPublisher,
  DirectChannelPublisher,
} from '../publishers/direct-channel-publisher';
import type {
  PublicationPayload,
  PublicationReceipt,
} from '../publishers/publisher.types';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';

export interface CreateDistributionJobInput {
  campaignId: string;
  pieceId: string;
  channel: 'telegram' | 'x' | 'newsletter';
  integrationId: string;
  idempotencyKey: string;
  payload: PublicationPayload;
  primaryProvider?: 'SOFIA' | 'DIRECT';
}

export interface ReconcileJobResult {
  reconciled: boolean;
  status: DistributionJobStatus;
  resolution: 'PROVEN_EXECUTED' | 'PROVEN_NOT_EXECUTED' | 'UNRESOLVED';
  receipt?: PublicationReceipt;
  retryPermitted?: boolean;
  reason?: string;
}

export class DistributionOrchestratorService {
  private sofiaClient: ISofiaExecutionClient;
  private directPublisher: DirectChannelPublisher;

  constructor(
    sofiaClient?: ISofiaExecutionClient,
    directPublisherInstance?: DirectChannelPublisher
  ) {
    this.sofiaClient = sofiaClient || new DefaultSofiaExecutionClient();
    this.directPublisher = directPublisherInstance || directChannelPublisher;
  }

  /**
   * Helper to execute conditional atomic status updates safely across DB and test environments.
   * Returns true if the conditional WHERE matched and at least one row was updated.
   */
  private async executeConditionalLock(updateQuery: any): Promise<boolean> {
    const res: any = typeof updateQuery?.returning === 'function'
      ? await updateQuery.returning()
      : await updateQuery;

    if (Array.isArray(res)) {
      return res.length > 0;
    }
    if (res && typeof res.rowCount === 'number') {
      return res.rowCount > 0;
    }
    return Boolean(res);
  }

  /**
   * Creates or retrieves a DistributionJob with durable database-backed idempotency.
   * Guarantees atomic deduplication across concurrent processes and serverless cold starts.
   */
  async createOrGetJob(
    canonicalOrgId: string,
    input: CreateDistributionJobInput
  ): Promise<{ job: DistributionJob; isNew: boolean }> {
    if (!canonicalOrgId || !input.idempotencyKey) {
      throw new Error('[DistributionOrchestrator] canonicalOrgId and idempotencyKey are required.');
    }

    const jobId = crypto.randomUUID();
    const now = new Date();

    const insertValues: typeof distributionJobs.$inferInsert = {
      id: jobId,
      tenantId: canonicalOrgId,
      campaignId: input.campaignId,
      pieceId: input.pieceId,
      channel: input.channel,
      integrationId: input.integrationId,
      idempotencyKey: input.idempotencyKey.trim(),
      status: 'PENDING',
      payload: input.payload,
      primaryProvider: input.primaryProvider || 'SOFIA',
      createdAt: now,
      updatedAt: now,
    };

    // Durable atomic insert with conflict resolution on unique (tenantId, idempotencyKey)
    await db
      .insert(distributionJobs)
      .values(insertValues)
      .onConflictDoNothing({
        target: [distributionJobs.tenantId, distributionJobs.idempotencyKey],
      });

    // Query canonical record from database
    const job = await db.query.distributionJobs.findFirst({
      where: and(
        eq(distributionJobs.tenantId, canonicalOrgId),
        eq(distributionJobs.idempotencyKey, input.idempotencyKey.trim())
      ),
    });

    if (!job) {
      throw new Error('[DistributionOrchestrator] Failed to persist or retrieve DistributionJob.');
    }

    const isNew = job.id === jobId;

    if (isNew) {
      try {
        await SecurityAuditLogger.logEvent({
          organizationId: canonicalOrgId,
          eventType: 'DISTRIBUTION_JOB_CREATED',
          severity: 'INFO',
          policyDecision: 'ALLOW',
          correlationId: `job_${job.id}`,
          metadata: {
            jobId: job.id,
            channel: job.channel,
            idempotencyKey: job.idempotencyKey,
            primaryProvider: job.primaryProvider,
          },
        });
      } catch (err) {
        console.warn('[DistributionOrchestrator] Audit logger warning:', err);
      }
    }

    return { job, isNew };
  }

  /**
   * Executes or resumes a DistributionJob following the Sofia Handshake State Machine.
   */
  async dispatchJob(
    canonicalOrgId: string,
    jobId: string
  ): Promise<PublicationReceipt> {
    if (!canonicalOrgId || !jobId) {
      throw new Error('[DistributionOrchestrator] canonicalOrgId and jobId are required.');
    }

    // 1. Strict Tenant Isolation
    const job = await db.query.distributionJobs.findFirst({
      where: and(
        eq(distributionJobs.id, jobId),
        eq(distributionJobs.tenantId, canonicalOrgId)
      ),
    });

    if (!job) {
      throw new Error(`[DistributionOrchestrator] DistributionJob '${jobId}' not found for tenant.`);
    }

    // 2. Terminal State Check
    if (job.status === 'PUBLISHED' && job.receipt) {
      return job.receipt as PublicationReceipt;
    }

    // 3. Absolute Invariant: UNKNOWN blocks direct fallback
    if (job.status === 'UNKNOWN') {
      throw new Error(
        `[DistributionOrchestrator] CRITICAL: Job '${jobId}' is in UNKNOWN state. Sofia may have already published. Direct publisher is strictly blocked pending reconciliation.`
      );
    }

    // 4. Duplicate In-Flight Lock Check
    if (job.status === 'PUBLISHING') {
      throw new Error(
        `[DistributionOrchestrator] Job '${jobId}' is currently in PUBLISHING state. Duplicate publication blocked.`
      );
    }

    // 5. Query Existing Execution Attempts
    const attempts = await db.query.distributionExecutionAttempts.findMany({
      where: and(
        eq(distributionExecutionAttempts.jobId, jobId),
        eq(distributionExecutionAttempts.tenantId, canonicalOrgId)
      ),
      orderBy: (t, { asc }) => [asc(t.attemptNumber)],
    });

    // Determine next attempt number
    const attemptNumber = attempts.length + 1;

    // ── PRIMARY PATH: SOFIA LEASE HANDSHAKE ──
    if (job.primaryProvider === 'SOFIA' && attempts.length === 0) {
      const attemptId = crypto.randomUUID();
      const now = new Date();

      // Assert transition PENDING -> DISPATCHING
      DistributionStateMachine.assertTransition(job.status as DistributionJobStatus, 'DISPATCHING', job.id);

      // Atomic conditional update: lock job from PENDING to DISPATCHING
      const dispatchQuery = db
        .update(distributionJobs)
        .set({
          status: 'DISPATCHING',
          activeAttemptId: attemptId,
          activeProvider: 'SOFIA',
          updatedAt: now,
        })
        .where(
          and(
            eq(distributionJobs.id, job.id),
            eq(distributionJobs.tenantId, canonicalOrgId),
            eq(distributionJobs.status, 'PENDING')
          )
        );

      const dispatched = await this.executeConditionalLock(dispatchQuery);

      if (!dispatched) {
        throw new Error(
          `[DistributionOrchestrator] Concurrency lock failed: Job '${job.id}' is already being dispatched by another worker.`
        );
      }

      // Create Attempt #1 (SOFIA)
      await db.insert(distributionExecutionAttempts).values({
        id: attemptId,
        jobId: job.id,
        tenantId: canonicalOrgId,
        attemptNumber: 1,
        provider: 'SOFIA',
        status: 'DISPATCHING',
        createdAt: now,
        updatedAt: now,
      });

      try {
        await SecurityAuditLogger.logEvent({
          organizationId: canonicalOrgId,
          eventType: 'DISTRIBUTION_DISPATCHING',
          severity: 'INFO',
          policyDecision: 'ALLOW',
          correlationId: `job_${job.id}`,
          metadata: { jobId: job.id, attemptId, provider: 'SOFIA' },
        });
      } catch (e) {
        console.warn('[DistributionOrchestrator] Audit logger warning:', e);
      }

      try {
        // Phase 1: Request Execution Lease from Sofia
        const leaseAck = await this.sofiaClient.requestExecutionLease(job);

        // Sofia ACKs Lease -> SOFIA NOW OWNS EXECUTION
        const ackTime = new Date();
        DistributionStateMachine.assertTransition('DISPATCHING', 'ACKNOWLEDGED', job.id);

        await db
          .update(distributionExecutionAttempts)
          .set({
            status: 'ACKNOWLEDGED',
            executionId: leaseAck.executionId,
            leaseExpiresAt: leaseAck.leaseExpiresAt,
            updatedAt: ackTime,
          })
          .where(eq(distributionExecutionAttempts.id, attemptId));

        await db
          .update(distributionJobs)
          .set({
            status: 'ACKNOWLEDGED',
            updatedAt: ackTime,
          })
          .where(eq(distributionJobs.id, job.id));

        try {
          await SecurityAuditLogger.logEvent({
            organizationId: canonicalOrgId,
            eventType: 'SOFIA_LEASE_ACQUIRED',
            severity: 'INFO',
            policyDecision: 'ALLOW',
            correlationId: `job_${job.id}`,
            metadata: {
              jobId: job.id,
              executionId: leaseAck.executionId,
              leaseExpiresAt: leaseAck.leaseExpiresAt.toISOString(),
            },
          });
          await SecurityAuditLogger.logEvent({
            organizationId: canonicalOrgId,
            eventType: 'DISTRIBUTION_ACKNOWLEDGED',
            severity: 'INFO',
            policyDecision: 'ALLOW',
            correlationId: `job_${job.id}`,
            metadata: { jobId: job.id, executionId: leaseAck.executionId },
          });
        } catch (e) {
          console.warn('[DistributionOrchestrator] Audit logger warning:', e);
        }

        // Phase 2: Acquire Atomic PUBLISHING Lock Before Awaiting Result
        DistributionStateMachine.assertTransition('ACKNOWLEDGED', 'PUBLISHING', job.id);

        const publishingQuery = db
          .update(distributionJobs)
          .set({
            status: 'PUBLISHING',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(distributionJobs.id, job.id),
              eq(distributionJobs.tenantId, canonicalOrgId),
              eq(distributionJobs.status, 'ACKNOWLEDGED')
            )
          );

        const publishingLocked = await this.executeConditionalLock(publishingQuery);

        if (!publishingLocked) {
          throw new Error(
            `[DistributionOrchestrator] Concurrency conflict: Job '${job.id}' status changed concurrently.`
          );
        }

        await db
          .update(distributionExecutionAttempts)
          .set({
            status: 'PUBLISHING',
            updatedAt: new Date(),
          })
          .where(eq(distributionExecutionAttempts.id, attemptId));

        try {
          await SecurityAuditLogger.logEvent({
            organizationId: canonicalOrgId,
            eventType: 'DISTRIBUTION_PUBLISHING',
            severity: 'INFO',
            policyDecision: 'ALLOW',
            correlationId: `job_${job.id}`,
            metadata: { jobId: job.id, attemptId, provider: 'SOFIA', executionId: leaseAck.executionId },
          });
        } catch (e) {
          console.warn('[DistributionOrchestrator] Audit logger warning:', e);
        }

        try {
          const receipt = await this.sofiaClient.awaitExecutionResult(leaseAck, job);

          const publishedTime = new Date();
          DistributionStateMachine.assertTransition('PUBLISHING', 'PUBLISHED', job.id);

          await db
            .update(distributionExecutionAttempts)
            .set({
              status: 'PUBLISHED',
              receipt: receipt as any,
              updatedAt: publishedTime,
            })
            .where(eq(distributionExecutionAttempts.id, attemptId));

          await db
            .update(distributionJobs)
            .set({
              status: 'PUBLISHED',
              receipt: receipt as any,
              updatedAt: publishedTime,
            })
            .where(eq(distributionJobs.id, job.id));

          try {
            await SecurityAuditLogger.logEvent({
              organizationId: canonicalOrgId,
              eventType: 'DISTRIBUTION_PUBLISHED',
              severity: 'INFO',
              policyDecision: 'ALLOW',
              correlationId: `job_${job.id}`,
              metadata: {
                jobId: job.id,
                attemptId,
                provider: 'SOFIA',
                externalPostId: receipt.externalPostId,
              },
            });
          } catch (e) {
            console.warn('[DistributionOrchestrator] Audit logger warning:', e);
          }

          return receipt;
        } catch (postAckError: any) {
          // POST-ACK ERROR: Network lost or timeout occurred AFTER Sofia acquired lease
          // ABSOLUTE INVARIANT: Transition to UNKNOWN. NEVER FAILED. NEVER DirectPublisher.
          const unknownTime = new Date();
          DistributionStateMachine.assertTransition('PUBLISHING', 'UNKNOWN', job.id);

          await db
            .update(distributionExecutionAttempts)
            .set({
              status: 'UNKNOWN',
              errorMessage: postAckError?.message || 'Timeout after lease ACK',
              updatedAt: unknownTime,
            })
            .where(eq(distributionExecutionAttempts.id, attemptId));

          await db
            .update(distributionJobs)
            .set({
              status: 'UNKNOWN',
              reconciliationNotes: `Post-ACK communication timeout with executionId '${leaseAck.executionId}'. Must be reconciled before retry.`,
              updatedAt: unknownTime,
            })
            .where(eq(distributionJobs.id, job.id));

          try {
            await SecurityAuditLogger.logEvent({
              organizationId: canonicalOrgId,
              eventType: 'DISTRIBUTION_UNKNOWN',
              severity: 'CRITICAL',
              policyDecision: 'ESCALATE',
              correlationId: `sofia_unknown_${job.id}`,
              metadata: {
                jobId: job.id,
                executionId: leaseAck.executionId,
                status: 'UNKNOWN',
                action: 'DIRECT_FALLBACK_BLOCKED_PENDING_RECONCILIATION',
              },
            });
          } catch (e) {
            console.warn('[DistributionOrchestrator] Audit logger warning:', e);
          }

          return {
            success: false,
            channel: job.channel as any,
            idempotencyKey: job.idempotencyKey,
            errorCode: 'PROVIDER_NETWORK_ERROR',
            errorMessage: `Execution transitioned to UNKNOWN. Sofia holds active lease '${leaseAck.executionId}'. Direct fallback is forbidden pending reconciliation.`,
            retryable: false,
          };
        }
      } catch (preAckError: any) {
        // PRE-ACK FAILURE: Sofia connection refused or timed out before lease ACK was issued
        // Sofia NEVER acquired lease -> DirectPublisher is permitted as Attempt #2
        const failTime = new Date();
        DistributionStateMachine.assertTransition('DISPATCHING', 'FAILED', job.id);

        await db
          .update(distributionExecutionAttempts)
          .set({
            status: 'FAILED',
            errorCode: 'SOFIA_UNREACHABLE_PRE_ACK',
            errorMessage: preAckError?.message || 'Sofia unreachable before lease ACK',
            updatedAt: failTime,
          })
          .where(eq(distributionExecutionAttempts.id, attemptId));

        try {
          await SecurityAuditLogger.logEvent({
            organizationId: canonicalOrgId,
            eventType: 'DISTRIBUTION_FAILED',
            severity: 'WARN',
            policyDecision: 'ALLOW',
            correlationId: `job_${job.id}`,
            metadata: {
              jobId: job.id,
              attemptId,
              provider: 'SOFIA',
              reason: 'SOFIA_PRE_ACK_FAILURE',
              error: preAckError?.message,
            },
          });
        } catch (e) {
          console.warn('[DistributionOrchestrator] Audit logger warning:', e);
        }

        // Fall through to Direct Publisher execution below
      }
    }

    // ── SECONDARY PATH: DIRECT CHANNEL PUBLISHER ──
    // Evaluate if direct fallback is permitted by state machine
    const refreshedAttempts = await db.query.distributionExecutionAttempts.findMany({
      where: and(
        eq(distributionExecutionAttempts.jobId, jobId),
        eq(distributionExecutionAttempts.tenantId, canonicalOrgId)
      ),
    });

    const fallbackCheck = DistributionStateMachine.canAttemptDirectFallback(
      job.status as DistributionJobStatus,
      refreshedAttempts.map((a) => ({
        provider: a.provider as any,
        status: a.status as ExecutionAttemptStatus,
        leaseExpiresAt: a.leaseExpiresAt,
      })),
      job.primaryProvider as any
    );

    if (!fallbackCheck.allowed) {
      throw new Error(`[DistributionOrchestrator] Direct fallback rejected: ${fallbackCheck.reason}`);
    }

    if (!job.integrationId) {
      throw new Error(`[DistributionOrchestrator] Job '${job.id}' has no configured integrationId for direct fallback.`);
    }

    const directAttemptId = crypto.randomUUID();
    const directAttemptNumber = refreshedAttempts.length + 1;
    const directNow = new Date();

    // Audit direct fallback authorization if failing over from Sofia
    if (refreshedAttempts.some((a) => a.provider === 'SOFIA' && a.status === 'FAILED')) {
      try {
        await SecurityAuditLogger.logEvent({
          organizationId: canonicalOrgId,
          eventType: 'DIRECT_FALLBACK_AUTHORIZED',
          severity: 'WARN',
          policyDecision: 'ALLOW',
          correlationId: `job_${job.id}`,
          metadata: {
            jobId: job.id,
            directAttemptNumber,
            reason: 'SOFIA_PRE_ACK_FAILOVER',
          },
        });
      } catch (e) {
        console.warn('[DistributionOrchestrator] Audit logger warning:', e);
      }
    }

    // Assert transition to PUBLISHING
    DistributionStateMachine.assertTransition(job.status as DistributionJobStatus, 'PUBLISHING', job.id);

    // Atomic conditional lock: only one worker can transition from PENDING/DISPATCHING to PUBLISHING
    const directPublishQuery = db
      .update(distributionJobs)
      .set({
        status: 'PUBLISHING',
        activeAttemptId: directAttemptId,
        activeProvider: 'DIRECT',
        updatedAt: directNow,
      })
      .where(
        and(
          eq(distributionJobs.id, job.id),
          eq(distributionJobs.tenantId, canonicalOrgId),
          inArray(distributionJobs.status, ['PENDING', 'DISPATCHING'])
        )
      );

    const directPublishingLocked = await this.executeConditionalLock(directPublishQuery);

    if (!directPublishingLocked) {
      throw new Error(
        `[DistributionOrchestrator] Concurrency lock failed: Direct publication for Job '${job.id}' is already in-flight.`
      );
    }

    // Create Attempt for Direct execution
    await db.insert(distributionExecutionAttempts).values({
      id: directAttemptId,
      jobId: job.id,
      tenantId: canonicalOrgId,
      attemptNumber: directAttemptNumber,
      provider: 'DIRECT',
      status: 'PUBLISHING',
      createdAt: directNow,
      updatedAt: directNow,
    });

    try {
      await SecurityAuditLogger.logEvent({
        organizationId: canonicalOrgId,
        eventType: 'DISTRIBUTION_PUBLISHING',
        severity: 'INFO',
        policyDecision: 'ALLOW',
        correlationId: `job_${job.id}`,
        metadata: {
          jobId: job.id,
          attemptId: directAttemptId,
          provider: 'DIRECT',
          channel: job.channel,
        },
      });
    } catch (e) {
      console.warn('[DistributionOrchestrator] Audit logger warning:', e);
    }

    // Execute through sovereign DirectChannelPublisher
    const receipt = await this.directPublisher.publishToChannel(
      canonicalOrgId,
      job.integrationId,
      job.payload as PublicationPayload
    );

    const finishTime = new Date();
    // Invariant: Ambiguous network timeout post-dispatch MUST transition to UNKNOWN, not FAILED
    const isAmbiguousNetworkError = !receipt.success && receipt.errorCode === 'PROVIDER_NETWORK_ERROR';
    const finalStatus: DistributionJobStatus = receipt.success
      ? 'PUBLISHED'
      : isAmbiguousNetworkError
      ? 'UNKNOWN'
      : 'FAILED';

    DistributionStateMachine.assertTransition('PUBLISHING', finalStatus, job.id);

    if (finalStatus === 'PUBLISHED') {
      await db
        .update(distributionExecutionAttempts)
        .set({
          status: 'PUBLISHED',
          receipt: receipt as any,
          updatedAt: finishTime,
        })
        .where(eq(distributionExecutionAttempts.id, directAttemptId));

      await db
        .update(distributionJobs)
        .set({
          status: 'PUBLISHED',
          receipt: receipt as any,
          updatedAt: finishTime,
        })
        .where(eq(distributionJobs.id, job.id));

      try {
        await SecurityAuditLogger.logEvent({
          organizationId: canonicalOrgId,
          eventType: 'DISTRIBUTION_PUBLISHED',
          severity: 'INFO',
          policyDecision: 'ALLOW',
          correlationId: `job_${job.id}`,
          metadata: {
            jobId: job.id,
            attemptId: directAttemptId,
            provider: 'DIRECT',
            externalPostId: receipt.externalPostId,
          },
        });
      } catch (e) {
        console.warn('[DistributionOrchestrator] Audit logger warning:', e);
      }
    } else if (finalStatus === 'UNKNOWN') {
      await db
        .update(distributionExecutionAttempts)
        .set({
          status: 'UNKNOWN',
          errorCode: receipt.errorCode,
          errorMessage: receipt.errorMessage,
          updatedAt: finishTime,
        })
        .where(eq(distributionExecutionAttempts.id, directAttemptId));

      await db
        .update(distributionJobs)
        .set({
          status: 'UNKNOWN',
          reconciliationNotes: `Direct publisher network timeout with provider. External broadcast unconfirmed; retries blocked pending reconciliation.`,
          updatedAt: finishTime,
        })
        .where(eq(distributionJobs.id, job.id));

      try {
        await SecurityAuditLogger.logEvent({
          organizationId: canonicalOrgId,
          eventType: 'DISTRIBUTION_UNKNOWN',
          severity: 'CRITICAL',
          policyDecision: 'ESCALATE',
          correlationId: `direct_unknown_${job.id}`,
          metadata: {
            jobId: job.id,
            attemptId: directAttemptId,
            provider: 'DIRECT',
            status: 'UNKNOWN',
            action: 'DIRECT_FALLBACK_BLOCKED_PENDING_RECONCILIATION',
            error: receipt.errorMessage,
          },
        });
      } catch (e) {
        console.warn('[DistributionOrchestrator] Audit logger warning:', e);
      }

      return {
        ...receipt,
        retryable: false,
        errorMessage: `Execution transitioned to UNKNOWN: ${receipt.errorMessage}. Direct retries blocked pending reconciliation.`,
      };
    } else {
      await db
        .update(distributionExecutionAttempts)
        .set({
          status: 'FAILED',
          errorCode: receipt.errorCode,
          errorMessage: receipt.errorMessage,
          updatedAt: finishTime,
        })
        .where(eq(distributionExecutionAttempts.id, directAttemptId));

      await db
        .update(distributionJobs)
        .set({
          status: 'FAILED',
          receipt: receipt as any,
          updatedAt: finishTime,
        })
        .where(eq(distributionJobs.id, job.id));

      try {
        await SecurityAuditLogger.logEvent({
          organizationId: canonicalOrgId,
          eventType: 'DISTRIBUTION_FAILED',
          severity: 'WARN',
          policyDecision: 'ALLOW',
          correlationId: `job_${job.id}`,
          metadata: {
            jobId: job.id,
            attemptId: directAttemptId,
            provider: 'DIRECT',
            errorCode: receipt.errorCode,
            errorMessage: receipt.errorMessage,
          },
        });
      } catch (e) {
        console.warn('[DistributionOrchestrator] Audit logger warning:', e);
      }
    }

    return receipt;
  }

  /**
   * Forensic Reconciliation for UNKNOWN jobs (Rule F4-2).
   *
   * CATEGORICAL TRANSITIONS:
   * 1. PROVEN_EXECUTED (status === 'PUBLISHED' with receipt) -> transitions to PUBLISHED.
   * 2. PROVEN_NOT_EXECUTED (status === 'CANCELLED_BEFORE_EXECUTION' | 'FAILED_PRE_SIDE_EFFECT') -> transitions to FAILED, authorizing retry.
   * 3. UNRESOLVED (NOT_FOUND, timeout, network error, EXECUTING) -> remains UNKNOWN.
   *    STRICT INVARIANT: NOT_FOUND != FAILED. Never unlocks fallback without verified negative proof.
   */
  async reconcileUnknownJob(
    canonicalOrgId: string,
    jobId: string
  ): Promise<ReconcileJobResult> {
    if (!canonicalOrgId || !jobId) {
      throw new Error('[DistributionOrchestrator] canonicalOrgId and jobId are required.');
    }

    const job = await db.query.distributionJobs.findFirst({
      where: and(
        eq(distributionJobs.id, jobId),
        eq(distributionJobs.tenantId, canonicalOrgId)
      ),
    });

    if (!job) {
      throw new Error(`[DistributionOrchestrator] Job '${jobId}' not found for authorized tenant.`);
    }

    if (job.status !== 'UNKNOWN') {
      throw new Error(
        `[DistributionOrchestrator] Job '${jobId}' is in '${job.status}' state. Only jobs in 'UNKNOWN' state can be reconciled.`
      );
    }

    const attempts = await db.query.distributionExecutionAttempts.findMany({
      where: and(
        eq(distributionExecutionAttempts.jobId, jobId),
        eq(distributionExecutionAttempts.tenantId, canonicalOrgId)
      ),
      orderBy: (t, { asc }) => [asc(t.attemptNumber)],
    });

    const latestAttempt = attempts[attempts.length - 1];
    const now = new Date();

    if (latestAttempt && latestAttempt.provider === 'SOFIA' && latestAttempt.executionId) {
      const statusRes = await this.sofiaClient.checkExecutionStatus(
        latestAttempt.executionId,
        job.id,
        canonicalOrgId
      );

      // CASE 1: PROVEN EXECUTED -> PUBLISHED
      if (statusRes.status === 'PUBLISHED' && statusRes.receipt) {
        DistributionStateMachine.assertTransition('UNKNOWN', 'PUBLISHED', job.id);

        await db
          .update(distributionExecutionAttempts)
          .set({
            status: 'PUBLISHED',
            receipt: statusRes.receipt as any,
            updatedAt: now,
          })
          .where(eq(distributionExecutionAttempts.id, latestAttempt.id));

        await db
          .update(distributionJobs)
          .set({
            status: 'PUBLISHED',
            receipt: statusRes.receipt as any,
            reconciliationNotes: `Forensic reconciliation succeeded: confirmed external publication with executionId '${latestAttempt.executionId}'.`,
            updatedAt: now,
          })
          .where(eq(distributionJobs.id, job.id));

        try {
          await SecurityAuditLogger.logEvent({
            organizationId: canonicalOrgId,
            eventType: 'DISTRIBUTION_RECONCILED',
            severity: 'INFO',
            policyDecision: 'ALLOW',
            correlationId: `reconcile_${job.id}`,
            metadata: {
              jobId: job.id,
              executionId: latestAttempt.executionId,
              resolution: 'PROVEN_EXECUTED',
              externalPostId: statusRes.receipt.externalPostId,
            },
          });
        } catch (e) {
          console.warn('[DistributionOrchestrator] Audit logger warning:', e);
        }

        return {
          reconciled: true,
          status: 'PUBLISHED',
          resolution: 'PROVEN_EXECUTED',
          receipt: statusRes.receipt,
          retryPermitted: false,
        };
      }

      // CASE 2: PROVEN NOT EXECUTED -> FAILED (safe retry authorized)
      if (
        statusRes.status === 'CANCELLED_BEFORE_EXECUTION' ||
        statusRes.status === 'FAILED_PRE_SIDE_EFFECT'
      ) {
        DistributionStateMachine.assertTransition('UNKNOWN', 'FAILED', job.id);

        await db
          .update(distributionExecutionAttempts)
          .set({
            status: 'FAILED',
            errorMessage: statusRes.reason || 'Sofia confirmed execution cancelled before side effects',
            updatedAt: now,
          })
          .where(eq(distributionExecutionAttempts.id, latestAttempt.id));

        await db
          .update(distributionJobs)
          .set({
            status: 'FAILED',
            reconciliationNotes: `Forensic reconciliation succeeded: confirmed zero side-effects (${statusRes.reason}). Safe retry authorized.`,
            updatedAt: now,
          })
          .where(eq(distributionJobs.id, job.id));

        try {
          await SecurityAuditLogger.logEvent({
            organizationId: canonicalOrgId,
            eventType: 'DISTRIBUTION_RECONCILED',
            severity: 'INFO',
            policyDecision: 'ALLOW',
            correlationId: `reconcile_${job.id}`,
            metadata: {
              jobId: job.id,
              executionId: latestAttempt.executionId,
              resolution: 'PROVEN_NOT_EXECUTED',
              retryPermitted: true,
              reason: statusRes.reason,
            },
          });
        } catch (e) {
          console.warn('[DistributionOrchestrator] Audit logger warning:', e);
        }

        return {
          reconciled: true,
          status: 'FAILED',
          resolution: 'PROVEN_NOT_EXECUTED',
          reason: statusRes.reason,
          retryPermitted: true,
        };
      }

      // CASE 3: UNRESOLVED (NOT_FOUND != FAILED) -> REMAINS UNKNOWN
      await db
        .update(distributionJobs)
        .set({
          reconciliationNotes: `Reconciliation attempted at ${now.toISOString()}: ${statusRes.reason || statusRes.status}. Remained UNKNOWN (NOT_FOUND != FAILED).`,
          updatedAt: now,
        })
        .where(eq(distributionJobs.id, job.id));

      try {
        await SecurityAuditLogger.logEvent({
          organizationId: canonicalOrgId,
          eventType: 'DISTRIBUTION_UNKNOWN',
          severity: 'CRITICAL',
          policyDecision: 'ESCALATE',
          correlationId: `reconcile_${job.id}`,
          metadata: {
            jobId: job.id,
            executionId: latestAttempt.executionId,
            resolution: 'UNRESOLVED',
            status: 'UNKNOWN',
            reason: statusRes.reason || 'Unresolved inspection result',
          },
        });
      } catch (e) {
        console.warn('[DistributionOrchestrator] Audit logger warning:', e);
      }

      return {
        reconciled: false,
        status: 'UNKNOWN',
        resolution: 'UNRESOLVED',
        reason: statusRes.reason || `Status unresolved (${statusRes.status}). Remained UNKNOWN to prevent duplicate broadcast.`,
        retryPermitted: false,
      };
    }

    // Direct provider without automated verification
    return {
      reconciled: false,
      status: 'UNKNOWN',
      resolution: 'UNRESOLVED',
      reason: 'Direct provider execution ambiguity requires manual post verification on external network.',
      retryPermitted: false,
    };
  }
}

// Global singleton instance
export const distributionOrchestratorService = new DistributionOrchestratorService();

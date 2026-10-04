/**
 * 🏛️ Hermes Distribution Job State Machine (FASE 3)
 * apps/dashboard/src/lib/hermes/channels/distribution/distribution-state-machine.ts
 *
 * Implements authoritative distribution state transitions and safety invariants:
 *
 * VALID STATES:
 *   PENDING         - Created, durable idempotency lock acquired
 *   DISPATCHING     - Attempting lease handshake with primary provider
 *   ACKNOWLEDGED    - Sofia acquired lease; Sofia OWNS execution
 *   PUBLISHING      - Provider executing broadcast
 *   PUBLISHED       - Terminal success with verified external receipt
 *   FAILED          - Terminal failure (pre-ACK or definitive provider rejection)
 *   UNKNOWN         - ACK granted, but subsequent response timed out / lost
 *   RECONCILIATION  - Manual or automated forensic check pending
 *
 * ABSOLUTE INVARIANTS:
 * 1. UNKNOWN NEVER means FAILED.
 * 2. UNKNOWN NEVER automatically permits DirectPublisher.
 * 3. PUBLISHED is terminal; duplicate dispatches return existing receipt.
 * 4. PUBLISHING + retry cannot create a second external publication.
 */

export type DistributionJobStatus =
  | 'PENDING'
  | 'DISPATCHING'
  | 'ACKNOWLEDGED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'UNKNOWN'
  | 'RECONCILIATION';

export type ExecutionAttemptStatus =
  | 'DISPATCHING'
  | 'ACKNOWLEDGED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'UNKNOWN'
  | 'BLOCKED';

export type DistributionProvider = 'SOFIA' | 'DIRECT';

const VALID_JOB_TRANSITIONS: Record<DistributionJobStatus, Set<DistributionJobStatus>> = {
  PENDING: new Set(['DISPATCHING', 'PUBLISHING', 'FAILED']),
  DISPATCHING: new Set(['ACKNOWLEDGED', 'PUBLISHING', 'PUBLISHED', 'FAILED']),
  ACKNOWLEDGED: new Set(['PUBLISHING', 'PUBLISHED', 'UNKNOWN', 'FAILED']),
  PUBLISHING: new Set(['PUBLISHED', 'UNKNOWN', 'FAILED']),
  UNKNOWN: new Set(['RECONCILIATION', 'PUBLISHED', 'FAILED']),
  RECONCILIATION: new Set(['PUBLISHED', 'FAILED']),
  PUBLISHED: new Set([]), // Terminal
  FAILED: new Set(['DISPATCHING']), // Allowed only for explicit controlled retry if no lease was active
};

export class DistributionStateMachine {
  /**
   * Checks if a transition between two job states is mathematically and architecturally valid.
   */
  public static canTransition(from: DistributionJobStatus, to: DistributionJobStatus): boolean {
    const allowed = VALID_JOB_TRANSITIONS[from];
    return allowed ? allowed.has(to) : false;
  }

  /**
   * Asserts valid transition, throwing a descriptive error if forbidden.
   */
  public static assertTransition(from: DistributionJobStatus, to: DistributionJobStatus, jobId?: string): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `[DistributionStateMachine] Invalid job state transition from '${from}' to '${to}' for job '${jobId || 'unknown'}'. Forbidden by distribution safety invariants.`
      );
    }
  }

  /**
   * Evaluates if a Direct fallback attempt is permitted.
   *
   * STRICT INVARIANTS:
   * 1. If job is UNKNOWN -> NEVER permit Direct fallback (Sofia or provider may have published).
   * 2. If Sofia ACK was issued -> Sofia OWNS execution; Direct fallback is strictly BLOCKED.
   * 3. CRITICAL: Lease expiry (leaseExpiresAt < now) NEVER automatically authorizes Direct fallback.
   *    Sofia ownership remains active until terminal receipt or explicit reconciliation.
   * 4. If primaryProvider is 'DIRECT', direct execution is permitted as primary path.
   * 5. If primaryProvider is 'SOFIA', only permitted if Sofia failed PRE-ACK (Sofia never acquired lease).
   */
  public static canAttemptDirectFallback(
    jobStatus: DistributionJobStatus,
    attempts: { provider: DistributionProvider; status: ExecutionAttemptStatus; leaseExpiresAt?: Date | null }[],
    primaryProvider: DistributionProvider = 'SOFIA'
  ): { allowed: boolean; reason?: string } {
    if (jobStatus === 'UNKNOWN') {
      return {
        allowed: false,
        reason: 'CRITICAL: Job is in UNKNOWN state. Provider or Sofia may have already published. Direct publisher is strictly forbidden pending reconciliation.',
      };
    }

    if (jobStatus === 'PUBLISHED') {
      return {
        allowed: false,
        reason: 'Job is already PUBLISHED.',
      };
    }

    // If job was configured with DIRECT as primary provider, direct execution is directly permitted
    if (primaryProvider === 'DIRECT') {
      return {
        allowed: true,
      };
    }

    // FENCING CHECK: Sofia acquired lease (ACKNOWLEDGED, PUBLISHING, UNKNOWN).
    // Invariant: Expired leaseExpiresAt NEVER unlocks fallback automatically without explicit reconciliation.
    const acknowledgedSofiaAttempt = attempts.find(
      (a) => a.provider === 'SOFIA' && (a.status === 'ACKNOWLEDGED' || a.status === 'PUBLISHING' || a.status === 'UNKNOWN')
    );

    if (acknowledgedSofiaAttempt) {
      return {
        allowed: false,
        reason: `Sofia holds execution lease (attempt status '${acknowledgedSofiaAttempt.status}'). Sofia owns execution; direct fallback blocked. Expiry does not authorize fallback.`,
      };
    }

    // Check pre-ACK failure
    const failedPreAckAttempt = attempts.find(
      (a) => a.provider === 'SOFIA' && a.status === 'FAILED'
    );

    if (failedPreAckAttempt) {
      return {
        allowed: true,
      };
    }

    return {
      allowed: false,
      reason: 'No pre-ACK failure recorded for primary provider.',
    };
  }
}

/**
 * 🤖 Sofia Execution Client & Handshake Contract (FASE 3)
 * apps/dashboard/src/lib/hermes/channels/distribution/sofia-execution-client.ts
 *
 * Implements the 2-Phase Execution Lease Handshake:
 * Phase 1: Request Lease -> Sofia ACKs with executionId and lease duration.
 * Phase 2: Sofia executes transmission and returns final receipt.
 *
 * ERROR TAXONOMY:
 * - SofiaPreAckError: Network timeout or connection refused BEFORE lease is granted.
 * - SofiaPostAckTimeoutError: Timeout occurred AFTER ACK. (Triggers UNKNOWN, NEVER fallback).
 */

import type { DistributionJob } from '@/db/schema';
import type { PublicationReceipt } from '../publishers/publisher.types';

export interface SofiaLeaseAck {
  jobId: string;
  executionId: string;
  leaseExpiresAt: Date;
  provider: 'SOFIA';
}

export class SofiaPreAckError extends Error {
  constructor(message: string) {
    super(`[SofiaPreAckError] ${message}`);
    this.name = 'SofiaPreAckError';
  }
}

export class SofiaPostAckTimeoutError extends Error {
  readonly executionId: string;
  constructor(executionId: string, message: string) {
    super(`[SofiaPostAckTimeoutError] Sofia ACK was granted (${executionId}), but broadcast response timed out: ${message}`);
    this.name = 'SofiaPostAckTimeoutError';
    this.executionId = executionId;
  }
}

export type SofiaExecutionStatus =
  | 'EXECUTING'
  | 'PUBLISHED'
  | 'CANCELLED_BEFORE_EXECUTION'
  | 'FAILED_PRE_SIDE_EFFECT'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export interface SofiaExecutionStatusResult {
  status: SofiaExecutionStatus;
  receipt?: PublicationReceipt;
  reason?: string;
}

export interface ISofiaExecutionClient {
  requestExecutionLease(job: DistributionJob): Promise<SofiaLeaseAck>;
  awaitExecutionResult(ack: SofiaLeaseAck, job: DistributionJob): Promise<PublicationReceipt>;
  checkExecutionStatus(executionId: string, jobId: string, tenantId: string): Promise<SofiaExecutionStatusResult>;
}

export class DefaultSofiaExecutionClient implements ISofiaExecutionClient {
  private baseUrl: string;
  private preAckTimeoutMs: number;
  private postAckTimeoutMs: number;

  constructor(
    baseUrl?: string,
    preAckTimeoutMs = 2500,  // Rule F4-5: Fail-fast 2500ms pre-ACK
    postAckTimeoutMs = 15000 // Extended post-ACK execution window
  ) {
    this.baseUrl = baseUrl || process.env.SOFIA_A2A_URL || 'http://localhost:8000';
    this.preAckTimeoutMs = preAckTimeoutMs;
    this.postAckTimeoutMs = postAckTimeoutMs;
  }

  /**
   * Phase 1: Request lease from Sofia
   * Fail-fast bounded timeout (2500ms): if Sofia / Mac Mini daemon is offline,
   * quickly fail pre-ACK so Hermes can execute direct cloud fallback.
   */
  async requestExecutionLease(job: DistributionJob): Promise<SofiaLeaseAck> {
    const endpoint = `${this.baseUrl}/api/v1/distribution/lease`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.preAckTimeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': job.tenantId,
        },
        body: JSON.stringify({
          jobId: job.id,
          idempotencyKey: job.idempotencyKey,
          channel: job.channel,
          campaignId: job.campaignId,
          pieceId: job.pieceId,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new SofiaPreAckError(`Sofia rejected execution lease with HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => ({}));
      if (!data?.executionId) {
        throw new SofiaPreAckError('Sofia lease response missing executionId');
      }

      const leaseSeconds = Number(data?.leaseSeconds) || 300; // 5 minute default lease
      const leaseExpiresAt = new Date(Date.now() + leaseSeconds * 1000);

      return {
        jobId: job.id,
        executionId: data.executionId,
        leaseExpiresAt,
        provider: 'SOFIA',
      };
    } catch (err: any) {
      if (err instanceof SofiaPreAckError) throw err;
      throw new SofiaPreAckError(err?.message || 'Sofia unreachable pre-ACK');
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Phase 2: Await execution result from Sofia
   * Extended timeout: once lease is ACKed, Sofia owns execution.
   */
  async awaitExecutionResult(ack: SofiaLeaseAck, job: DistributionJob): Promise<PublicationReceipt> {
    const endpoint = `${this.baseUrl}/api/v1/distribution/execute`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.postAckTimeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': job.tenantId,
          'x-execution-id': ack.executionId,
        },
        body: JSON.stringify({
          executionId: ack.executionId,
          payload: job.payload,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new SofiaPostAckTimeoutError(ack.executionId, `Sofia execution failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data?.receipt) {
        throw new SofiaPostAckTimeoutError(ack.executionId, 'Sofia response missing publication receipt');
      }

      return data.receipt as PublicationReceipt;
    } catch (err: any) {
      // Post-ACK failure -> MUST be classified as SofiaPostAckTimeoutError
      if (err instanceof SofiaPostAckTimeoutError) throw err;
      throw new SofiaPostAckTimeoutError(ack.executionId, err?.message || 'Connection lost after lease ACK');
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Forensic Reconciliation: Checks execution status with Sofia for an UNKNOWN job.
   * Rule F4-2: Closed status enum. Network errors/timeouts remain UNKNOWN (NOT_FOUND != FAILED).
   */
  async checkExecutionStatus(
    executionId: string,
    jobId: string,
    tenantId: string
  ): Promise<SofiaExecutionStatusResult> {
    const endpoint = `${this.baseUrl}/api/v1/distribution/status?executionId=${encodeURIComponent(executionId)}&jobId=${encodeURIComponent(jobId)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-tenant-id': tenantId,
          'x-execution-id': executionId,
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        return {
          status: 'UNKNOWN',
          reason: `Sofia status endpoint returned HTTP ${res.status}`,
        };
      }

      const data = await res.json().catch(() => ({}));
      const rawStatus = (data?.status as string) || 'UNKNOWN';

      if (rawStatus === 'PUBLISHED' && data?.receipt) {
        return { status: 'PUBLISHED', receipt: data.receipt };
      }
      if (rawStatus === 'CANCELLED_BEFORE_EXECUTION') {
        return { status: 'CANCELLED_BEFORE_EXECUTION', reason: data?.reason || 'Cancelled before side effects' };
      }
      if (rawStatus === 'FAILED_PRE_SIDE_EFFECT') {
        return { status: 'FAILED_PRE_SIDE_EFFECT', reason: data?.reason || 'Failed before external broadcast' };
      }
      if (rawStatus === 'EXECUTING') {
        return { status: 'EXECUTING', reason: 'Execution still actively running on Sofia daemon' };
      }
      if (rawStatus === 'NOT_FOUND') {
        return { status: 'NOT_FOUND', reason: 'ExecutionId not registered on Sofia daemon' };
      }

      return { status: 'UNKNOWN', reason: 'Unrecognized or ambiguous status from Sofia' };
    } catch (err: any) {
      // Invariant F4-2: Network loss or timeout inspecting status MUST remain UNKNOWN
      return {
        status: 'UNKNOWN',
        reason: `Connection error reaching Sofia status endpoint: ${err?.message || 'Timeout'}`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

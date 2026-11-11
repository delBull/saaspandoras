/**
 * 🎨 HERMES SOVEREIGN MEDIA GENERATION ORCHESTRATOR (FASE 5)
 * apps/dashboard/src/lib/hermes/media/hermes-media-orchestrator.service.ts
 *
 * Implements the 12 Mandatory Architecture Invariants:
 * - F5-1: Durable GenerationJob persisted before provider dispatch.
 * - F5-2: GenerationAttempt entity separated from MediaRequest for forensic audit trail.
 * - F5-3: Sofia pre-ACK fail-fast (<=2500ms) authorizes RunPod fallback as Attempt #2.
 * - F5-4: Sofia post-ACK ownership fencing -> transitions to UNKNOWN, RunPod strictly BLOCKED.
 * - F5-5: Semantic equivalence between wait=true/false over identical durable job.
 * - F5-6: Credit ledger RESERVE -> EXECUTE -> SETTLE -> RELEASE prevents race conditions.
 * - F5-7: 3-way financial audit: rawCostUsd + markupCostUsd (+35%) = totalChargedUsd.
 * - F5-8: Strict artifact registration pipeline (verify -> sha256 -> hermesArtifacts) precedes COMPLETED.
 * - F5-9: Durable idempotency key generation:${tenant}:${idempotencyKey || requestId}.
 * - F5-10: provider='sofia' is strictly Sofia-only (never falls back to RunPod).
 * - F5-11: provider='runpod' is strictly RunPod-only.
 * - F5-12: provider='auto' is Sofia primary + safe pre-ACK fallback to RunPod.
 */

import crypto from 'crypto';
import { db } from '@saasfly/db-core';
import {
  hermesMediaRequests,
  hermesGenerationAttempts,
  hermesArtifacts,
  type HermesGenerationAttempt,
} from '@saasfly/db-core/schema';
import { eq, and, desc } from "@saasfly/db-core";
import { RunPodServerlessService } from '../compute/runpod-serverless.service';
import { IpfsPinningService } from './ipfs-pinning.service';
import { resolveTenantPinningConfig } from './tenant-pinning';
import { TenantCreditLedgerService } from '../compute/tenant-credit-ledger.service';
import { A2AOutboundDispatcher } from "../a2a/a2a-outbound-dispatcher";
import { CapabilityGrantService } from "../a2a/capability-grant-service";
import { SecurityAuditLogger } from "../runtime/security-audit-logger";

export type MediaProviderOption = 'auto' | 'sofia' | 'runpod';

export interface CreateMediaRequestParams {
  capability: string;
  prompt: string;
  options?: Record<string, any>;
  provider?: MediaProviderOption;
  idempotencyKey?: string;
  isSandbox?: boolean;
  actorId?: string;
  endpointId?: string;
}

export interface MediaGenerationResult {
  ok: boolean;
  /** Código determinista del fallo (para mapear HTTP en la API). */
  failureCode?: string;
  requestId: string;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'UNKNOWN';
  provider: 'sofia' | 'runpod';
  attemptCount: number;
  artifactId?: string;
  artifact?: {
    id: string;
    artifactId: string;
    cid: string;
    ipfsUri: string;
    sha256: string;
    mimeType: string;
  };
  computeSeconds?: number;
  financialBreakdown?: {
    rawCostUsd: number;
    markupCostUsd: number;
    totalChargedUsd: number;
  };
  error?: string;
  isIdempotentReplay?: boolean;
}

function readTimeout(envName: string, fallbackMs: number): number {
  const raw = Number(process.env[envName]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallbackMs;
}

export class HermesMediaOrchestratorService {
  // Pre-ACK: tiempo que Sofía tiene para aceptar el trabajo. Medido en producción:
  // ~1.1 s de latencia base; 5 s deja margen sin colgar la petición.
  public static PRE_ACK_TIMEOUT_MS = readTimeout('SOFIA_PRE_ACK_TIMEOUT_MS', 5000);
  // Post-ACK: espera del resultado real (imagen ~20 s + callback). 15 s era
  // insuficiente y dejaba el job en UNKNOWN aunque Sofía terminara.
  public static POST_ACK_TIMEOUT_MS = readTimeout('SOFIA_POST_ACK_TIMEOUT_MS', 120000);
  // Fail-closed: sin endpoint configurado NO se inventa uno.
  private static readonly RUNPOD_DEFAULT_ENDPOINT = process.env.RUNPOD_DEFAULT_ENDPOINT || '';
  private static inMemoryRequests: Map<string, any> = new Map();
  private static inMemoryAttempts: Map<string, any[]> = new Map();
  private static inMemoryArtifacts: Map<string, any> = new Map();

  public static clearInMemoryForTesting(): void {
    this.inMemoryRequests.clear();
    this.inMemoryAttempts.clear();
    this.inMemoryArtifacts.clear();
    this.PRE_ACK_TIMEOUT_MS = readTimeout('SOFIA_PRE_ACK_TIMEOUT_MS', 5000);
    this.POST_ACK_TIMEOUT_MS = readTimeout('SOFIA_POST_ACK_TIMEOUT_MS', 120000);
  }

  /**
   * F5-1 & F5-9: Creates or retrieves a durable MediaRequest before any provider dispatch.
   * Enforces global idempotency per (tenantId, idempotencyKey).
   */
  public static async createOrGetMediaRequest(
    tenantId: string,
    params: CreateMediaRequestParams
  ): Promise<{ request: any; isNew: boolean }> {
    const normalizedTenant = tenantId.toLowerCase().trim();
    const cleanIdempotencyKey = params.idempotencyKey?.trim() ||
      `generation:${normalizedTenant}:${crypto.createHash('sha256').update(params.prompt + JSON.stringify(params.options || {})).digest('hex').slice(0, 16)}`;

    // 1. Check existing in DB or in-memory
    try {
      if (db) {
        const [existing] = await db
          .select()
          .from(hermesMediaRequests)
          .where(
            and(
              eq(hermesMediaRequests.tenantId, normalizedTenant),
              eq(hermesMediaRequests.idempotencyKey, cleanIdempotencyKey)
            )
          )
          .limit(1);

        if (existing) {
          return { request: existing, isNew: false };
        }
      }
    } catch (dbErr) {
      console.warn('[HermesMediaOrchestrator] Notice checking DB request:', dbErr);
    }

    const inMemKey = `${normalizedTenant}:${cleanIdempotencyKey}`;
    if (this.inMemoryRequests.has(inMemKey)) {
      return { request: this.inMemoryRequests.get(inMemKey), isNew: false };
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const correlationId = `corr_${requestId}`;
    const newRecord = {
      id: requestId,
      requestId,
      correlationId,
      tenantId: normalizedTenant,
      idempotencyKey: cleanIdempotencyKey,
      capability: params.capability,
      requestedBy: params.actorId || 'portal_user',
      provider: params.provider || 'auto',
      status: 'REQUESTED',
      prompt: params.prompt,
      briefJson: { ...(params.options || {}), isSandbox: params.isSandbox ?? false },
      artifactId: null,
      failureCode: null,
      failureMessage: null,
      createdAt: new Date(),
      completedAt: null,
    };

    try {
      if (db) {
        const [inserted] = await db
          .insert(hermesMediaRequests)
          .values(newRecord as any)
          .onConflictDoNothing()
          .returning();

        if (!inserted) {
          const [existing] = await db
            .select()
            .from(hermesMediaRequests)
            .where(
              and(
                eq(hermesMediaRequests.tenantId, normalizedTenant),
                eq(hermesMediaRequests.idempotencyKey, cleanIdempotencyKey)
              )
            )
            .limit(1);

          if (existing) {
            this.inMemoryRequests.set(inMemKey, existing);
            this.inMemoryRequests.set(existing.id, existing);
            return { request: existing, isNew: false };
          }
        }
      }
    } catch (insertErr) {
      console.warn('[HermesMediaOrchestrator] Notice inserting DB request:', insertErr);
    }

    this.inMemoryRequests.set(inMemKey, newRecord);
    this.inMemoryRequests.set(requestId, newRecord);

    try {
      await SecurityAuditLogger.logEvent({
        organizationId: normalizedTenant,
        actorId: params.actorId,
        eventType: 'MEDIA_GENERATION_REQUESTED',
        severity: 'INFO',
        policyDecision: 'ALLOW',
        correlationId,
        metadata: {
          requestId,
          capability: params.capability,
          provider: params.provider || 'auto',
          idempotencyKey: cleanIdempotencyKey,
        },
      });
    } catch (auditErr) {
      console.warn('[HermesMediaOrchestrator] Audit logger notice:', auditErr);
    }

    return { request: newRecord, isNew: true };
  }

  /**
   * Executes media generation following the 12 Architecture Invariants.
   */
  public static async executeGeneration(
    tenantId: string,
    requestId: string,
    params: CreateMediaRequestParams
  ): Promise<MediaGenerationResult> {
    const normalizedTenant = tenantId.toLowerCase().trim();
    const providerMode = params.provider || 'auto';
    const isSandbox = params.isSandbox ?? false;
    const correlationId = `corr_${requestId}`;

    // 1. Resolve request
    const requestKey = `${normalizedTenant}:${params.idempotencyKey}`;
    let request = this.inMemoryRequests.get(requestId) || this.inMemoryRequests.get(requestKey);

    if (!request && db) {
      const [dbReq] = await db
        .select()
        .from(hermesMediaRequests)
        .where(
          and(
            eq(hermesMediaRequests.id, requestId),
            eq(hermesMediaRequests.tenantId, normalizedTenant)
          )
        )
        .limit(1);
      request = dbReq;
    }

    if (!request || request.tenantId.toLowerCase() !== normalizedTenant) {
      return {
        ok: false,
        requestId,
        status: 'FAILED',
        provider: 'sofia',
        attemptCount: 0,
        error: `MediaRequest '${requestId}' does not belong to tenant '${normalizedTenant}'.`,
      };
    }

    // 2. Terminal Idempotency Replay (F5-9)
    if (request.status === 'COMPLETED' && request.artifactId) {
      const artifact = await this.getArtifact(normalizedTenant, request.artifactId);
      return {
        ok: true,
        requestId,
        status: 'COMPLETED',
        provider: request.provider as any,
        attemptCount: 1,
        artifactId: request.artifactId,
        artifact,
        isIdempotentReplay: true,
      };
    }

    // 3. Fail-closed Capability Verification
    const isGranted = await CapabilityGrantService.isCapabilityGranted(normalizedTenant, params.capability).catch(() => false);
    if (!isGranted) {
      await this.markRequestFailed(normalizedTenant, requestId, 'CAPABILITY_NOT_GRANTED', `Capability '${params.capability}' not granted`);
      return {
        ok: false,
        requestId,
        status: 'FAILED',
        provider: 'sofia',
        failureCode: 'CAPABILITY_NOT_GRANTED',
        attemptCount: 0,
        error: `Capability '${params.capability}' is not granted for tenant '${normalizedTenant}'.`,
      };
    }

    // 4. F5-6: Atomic Credit Reservation
    const estimatedRawCost = 0.02; // ~$0.02 USD base raw compute
    const reservation = await TenantCreditLedgerService.reserveCredits(normalizedTenant, {
      requestId,
      capability: params.capability,
      provider: providerMode === 'runpod' ? 'runpod' : 'sofia',
      estimatedRawCostUsd: estimatedRawCost,
      isSandbox,
    });

    if (!reservation.ok) {
      await this.markRequestFailed(normalizedTenant, requestId, 'INSUFFICIENT_CREDITS', reservation.error);
      return {
        ok: false,
        requestId,
        status: 'FAILED',
        provider: 'sofia',
        failureCode: 'INSUFFICIENT_CREDITS',
        attemptCount: 0,
        error: reservation.error || 'Insufficient credits for generation reservation.',
      };
    }

    const reservationId = reservation.reservationId!;

    // ── ATTEMPT 1: SOFIA (if provider is 'auto' or 'sofia') ──
    if (providerMode === 'auto' || providerMode === 'sofia') {
      const attempt1Id = `att_sofia_${requestId}_1`;
      await this.recordAttempt(normalizedTenant, {
        id: attempt1Id,
        requestId,
        attemptNumber: 1,
        provider: 'sofia',
        status: 'DISPATCHING',
      });

      let sofiaAckReceived = false;
      let sofiaExecutionId: string | null = null;
      let dispatchRes: any = null;

      try {
        // Pre-ACK bounded handshake (<= 2500ms)
        const timeoutPromise = new Promise<{ success: false; timeout: true }>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Sofia pre-ACK timeout (${this.PRE_ACK_TIMEOUT_MS}ms exceeded)`)),
            this.PRE_ACK_TIMEOUT_MS
          )
        );

        const dispatchPromise = A2AOutboundDispatcher.sendToSofia('capability.request', {
          requestId,
          capability: params.capability,
          prompt: params.prompt,
          tenantId: normalizedTenant,
          options: params.options,
          isSandbox,
        }, {
          tenantId: normalizedTenant,
          correlationId,
        });

        dispatchRes = await Promise.race([dispatchPromise, timeoutPromise]) as any;

        if (dispatchRes && dispatchRes.success !== false) {
          // ACK GRANTED: Sofia acquired ownership!
          sofiaAckReceived = true;
          sofiaExecutionId = dispatchRes.executionId || dispatchRes.messageId || `sofia_exec_${requestId}`;
          await this.updateAttempt(attempt1Id, {
            status: 'ACKNOWLEDGED',
            executionId: sofiaExecutionId,
          });
        } else {
          throw new Error(dispatchRes?.error?.message || 'Sofia connection refused or rejected');
        }
      } catch (preAckErr: any) {
        // PRE-ACK FAILURE: Sofia failed before issuing lease ACK
        await this.updateAttempt(attempt1Id, {
          status: 'FAILED',
          errorCode: 'SOFIA_UNREACHABLE_PRE_ACK',
          errorMessage: preAckErr?.message || 'Sofia unreachable before ACK',
        });

        // F5-10: If user specified provider: 'sofia', NEVER secretly fallback to RunPod!
        if (providerMode === 'sofia') {
          await TenantCreditLedgerService.releaseReservation(reservationId, normalizedTenant, 'Sofia offline (Sofia-only mode)');
          await this.markRequestFailed(normalizedTenant, requestId, 'SOFIA_OFFLINE', preAckErr?.message);
          return {
            ok: false,
            requestId,
            status: 'FAILED',
            provider: 'sofia',
            attemptCount: 1,
            error: `Sofia worker offline: ${preAckErr?.message}. Fallback blocked because provider='sofia' was requested.`,
          };
        }

        // F5-12: provider === 'auto' -> Sofia pre-ACK failure authorizes RunPod Attempt #2!
        try {
          await SecurityAuditLogger.logEvent({
            organizationId: normalizedTenant,
            actorId: params.actorId,
            eventType: 'MEDIA_FAILOVER_AUTHORIZED',
            severity: 'WARN',
            policyDecision: 'ALLOW',
            correlationId,
            metadata: {
              requestId,
              reason: 'SOFIA_PRE_ACK_FAILOVER_TO_RUNPOD',
              error: preAckErr?.message,
            },
          });
        } catch (e) {
          console.warn('[HermesMediaOrchestrator] Audit notice:', e);
        }
      }

      // If Sofia ACK was granted -> Ownership acquired!
      if (sofiaAckReceived && sofiaExecutionId) {
        // F5-4: If Sofia acknowledged, wait for result or transition to UNKNOWN (NEVER RunPod fallback)
        try {
          await this.updateAttempt(attempt1Id, { status: 'EXECUTING' });

          let sofiaOutput = (dispatchRes as any)?.output || (dispatchRes as any)?.result || (dispatchRes as any)?.artifact;
          let executionSeconds = Number((dispatchRes as any)?.computeSeconds || ((dispatchRes as any)?.executionTimeMs ? (dispatchRes as any).executionTimeMs / 1000 : 3.2));
          let rawCost = Number((dispatchRes as any)?.rawCostUsd || 0.02);

          if (!sofiaOutput) {
            // Await asynchronous Sofia result with bounded post-ACK timeout
            const asyncRes = await this.awaitSofiaResult(normalizedTenant, requestId, sofiaExecutionId);
            sofiaOutput = asyncRes.output;
            executionSeconds = asyncRes.computeSeconds ?? executionSeconds;
            rawCost = asyncRes.rawCostUsd ?? rawCost;
          }

          // SOFIA HAPPY PATH (P1-A FIX): Settle credits, register artifact, complete request!
          const completed = await this.registerArtifactAndSettle({
            tenantId: normalizedTenant,
            requestId,
            actorId: params.actorId,
            correlationId,
            provider: 'sofia',
            attemptId: attempt1Id,
            reservationId,
            executionId: sofiaExecutionId,
            executionTimeMs: executionSeconds * 1000,
            rawCostUsd: rawCost,
            output: sofiaOutput,
            prompt: params.prompt,
            capability: params.capability,
            options: params.options,
          });

          return {
            ok: true,
            requestId,
            status: 'COMPLETED',
            provider: 'sofia',
            attemptCount: 1,
            artifactId: completed.artifactId,
            artifact: completed.artifact,
            financialBreakdown: completed.financialBreakdown,
          };
        } catch (postAckErr: any) {
          // F5-4: STRICT INVARIANT -> Transition to UNKNOWN; Direct RunPod is FORBIDDEN
          await this.updateAttempt(attempt1Id, {
            status: 'UNKNOWN',
            errorCode: 'SOFIA_POST_ACK_TIMEOUT',
            errorMessage: `Sofia acknowledged execution (${sofiaExecutionId}) but response timed out. RunPod fallback blocked to prevent duplicate render.`,
          });

          await this.markRequestStatus(normalizedTenant, requestId, 'UNKNOWN');
          // F6-10: DO NOT RELEASE RESERVATION. Funds remain frozen in reserved_balance_usd
          // until forensic reconciliation proves execution (settle) or non-execution (release).

          try {
            await SecurityAuditLogger.logEvent({
              organizationId: normalizedTenant,
              actorId: params.actorId,
              eventType: 'MEDIA_GENERATION_UNKNOWN',
              severity: 'CRITICAL',
              policyDecision: 'ESCALATE',
              correlationId,
              metadata: {
                requestId,
                executionId: sofiaExecutionId,
                status: 'UNKNOWN',
                action: 'RUNPOD_FALLBACK_STRICTLY_BLOCKED',
              },
            });
          } catch (e) {
            console.warn('[HermesMediaOrchestrator] Audit notice:', e);
          }

          return {
            ok: false,
            requestId,
            status: 'UNKNOWN',
            provider: 'sofia',
            attemptCount: 1,
            error: `Sofia execution entered UNKNOWN state. Active lease: ${sofiaExecutionId}. RunPod fallback forbidden pending reconciliation.`,
          };
        }
      }
    }

    // ── ATTEMPT #2 (OR ATTEMPT #1 IF provider === 'runpod'): RUNPOD SERVERLESS ──
    const runpodAttemptNumber = providerMode === 'runpod' ? 1 : 2;
    const runpodAttemptId = `att_runpod_${requestId}_${runpodAttemptNumber}`;

    await this.recordAttempt(normalizedTenant, {
      id: runpodAttemptId,
      requestId,
      attemptNumber: runpodAttemptNumber,
      provider: 'runpod',
      status: 'DISPATCHING',
    });

    const endpointId = params.endpointId || this.RUNPOD_DEFAULT_ENDPOINT;

    // Fail-closed: sin endpoint real no se llama a RunPod (antes había un id
    // inventado por defecto, lo que producía fallos opacos).
    if (!endpointId) {
      await this.updateAttempt(runpodAttemptId, {
        status: 'FAILED',
        errorCode: 'RUNPOD_ENDPOINT_REQUIRED',
        errorMessage: 'No compute endpoint configured for this job.',
      });
      await TenantCreditLedgerService.releaseReservation(
        reservationId,
        normalizedTenant,
        'RunPod endpoint not configured'
      );
      await this.markRequestFailed(
        normalizedTenant,
        requestId,
        'RUNPOD_ENDPOINT_REQUIRED',
        'No compute endpoint configured.'
      );

      return {
        ok: false,
        requestId,
        status: 'FAILED',
        provider: 'runpod',
        failureCode: 'RUNPOD_ENDPOINT_REQUIRED',
        attemptCount: runpodAttemptNumber,
        error: 'No compute endpoint configured for this job.',
      };
    }

    // Execute RunPod Serverless GPU Inference
    const runpodRes = await RunPodServerlessService.executeSync({
      endpointId,
      input: {
        prompt: params.prompt,
        ...(params.options || {}),
      },
      // Presupuesto configurable: cubre generación (~20 s) y cold start.
      timeoutMs: Number(process.env.RUNPOD_JOB_BUDGET_MS || 120000),
    });

    if (!runpodRes.success) {
      await this.updateAttempt(runpodAttemptId, {
        status: 'FAILED',
        errorCode: runpodRes.errorCode || 'RUNPOD_EXECUTION_FAILED',
        errorMessage: runpodRes.error,
        computeSeconds: (runpodRes.executionTimeMs / 1000).toFixed(3),
        rawCostUsd: runpodRes.rawCostUsd.toFixed(5),
      });

      await TenantCreditLedgerService.releaseReservation(reservationId, normalizedTenant, runpodRes.error);
      await this.markRequestFailed(
        normalizedTenant,
        requestId,
        runpodRes.errorCode || 'RUNPOD_FAILED',
        runpodRes.error
      );

      return {
        ok: false,
        requestId,
        status: 'FAILED',
        provider: 'runpod',
        attemptCount: runpodAttemptNumber,
        error: runpodRes.error || 'RunPod serverless execution failed',
      };
    }

    // ── F5-8: STRICT ARTIFACT REGISTRATION PIPELINE VIA SHARED HELPER ──
    const completed = await this.registerArtifactAndSettle({
      tenantId: normalizedTenant,
      requestId,
      actorId: params.actorId,
      correlationId,
      provider: 'runpod',
      attemptId: runpodAttemptId,
      reservationId,
      executionId: runpodRes.jobId || `runpod_${requestId}`,
      executionTimeMs: runpodRes.executionTimeMs,
      rawCostUsd: runpodRes.rawCostUsd,
      output: runpodRes.output,
      prompt: params.prompt,
      capability: params.capability,
      options: params.options,
      endpointId,
    });

    return {
      ok: true,
      requestId,
      status: 'COMPLETED',
      provider: 'runpod',
      attemptCount: runpodAttemptNumber,
      artifactId: completed.artifactId,
      artifact: completed.artifact,
      financialBreakdown: completed.financialBreakdown,
    };
  }

  /**
   * F5-8: Registers generated media artifact in hermesArtifacts and settles credit reservation with 3-way audit.
   */
  private static async registerArtifactAndSettle(params: {
    tenantId: string;
    requestId: string;
    actorId?: string;
    correlationId: string;
    provider: 'sofia' | 'runpod';
    attemptId: string;
    reservationId: string;
    executionId: string;
    executionTimeMs: number;
    rawCostUsd: number;
    output: any;
    prompt: string;
    capability: string;
    options?: Record<string, any>;
    endpointId?: string;
  }): Promise<{ artifactId: string; artifact: any; financialBreakdown: any }> {
    // ── Almacenamiento real del artefacto (sin CIDs inventados) ────────────────
    const output = params.output ?? {};
    const providedCidRaw = typeof output.cid === 'string' ? output.cid.trim() : '';
    const providedCid = /^(bafy|Qm)[a-zA-Z0-9]+$/.test(providedCidRaw) ? providedCidRaw : null;
    const sourceUrl =
      output.images?.[0] || output.image || output.imageUrl || output.url || null;

    // Algunos workers (p. ej. vLLM-Omni) devuelven la imagen inline en base64:
    // { data: [{ b64_json }] }. Se decodifica para tener bytes reales.
    const inlineB64Raw =
      (Array.isArray(output.data) && typeof output.data[0]?.b64_json === 'string'
        ? output.data[0].b64_json
        : null) ??
      (typeof output.b64_json === 'string' ? output.b64_json : null);

    let inlineBytes: Uint8Array | null = null;
    if (inlineB64Raw) {
      try {
        inlineBytes = new Uint8Array(Buffer.from(inlineB64Raw, 'base64'));
      } catch (error: unknown) {
        console.warn('[HermesMediaOrchestrator] Invalid base64 image payload:', error);
        inlineBytes = null;
      }
    }

    let cid: string | null = providedCid;
    let sha256 = '';
    let sizeBytes = 0;

    const pinningConfig = await resolveTenantPinningConfig(params.tenantId);
    if (!cid && typeof sourceUrl === 'string' && pinningConfig) {
      const pinned = await IpfsPinningService.pinFromUrl(sourceUrl, pinningConfig);
      if (pinned) {
        cid = pinned.cid;
        sha256 = pinned.sha256;
        sizeBytes = pinned.sizeBytes;
      }
    }

    // Bytes propios (inline) sin pinning: se huella el contenido real, no el JSON.
    if (inlineBytes) {
      sha256 = crypto.createHash('sha256').update(Buffer.from(inlineBytes)).digest('hex');
      sizeBytes = inlineBytes.byteLength;

      if (!cid && pinningConfig) {
        const pinned = await IpfsPinningService.pinBytes(
          inlineBytes,
          `generated_${params.requestId}.png`,
          pinningConfig
        );
        if (pinned) cid = pinned.cid;
      }
    }

    if (!sha256) {
      // Sin bytes propios: se huella la referencia del proveedor (documentado).
      const contentToHash = typeof sourceUrl === 'string' ? sourceUrl : JSON.stringify(output);
      sha256 = crypto.createHash('sha256').update(contentToHash).digest('hex');
      sizeBytes = Buffer.byteLength(contentToHash, 'utf8');
    }

    const artifactId = `art_${params.requestId}`;

    const artifactRecord = {
      id: `art_rec_${artifactId}`,
      artifactId,
      tenantId: params.tenantId,
      sourceAgent: params.provider,
      producer: params.provider === 'runpod' ? 'runpod_serverless' : 'sofia_media_co',
      artifactType: 'image',
      title: (params.options?.title as string) || `Media Asset for ${params.tenantId}`,
      cid,
      ipfsUri: cid ? `ipfs://${cid}` : null,
      sha256,
      mimeType: 'image/png',
      sizeBytes,
      metadataJson: {
        prompt: params.prompt,
        capability: params.capability,
        options: params.options,
        storage: cid ? 'IPFS_PINNED' : 'UNPINNED',
        providerAssetUrl: typeof sourceUrl === 'string' ? sourceUrl : null,
        outputEncoding: inlineBytes ? 'INLINE_B64' : typeof sourceUrl === 'string' ? 'REMOTE_URL' : 'UNKNOWN',
        bytesDiscarded: Boolean(inlineBytes) && !cid,
      },
      createdAt: new Date(),
    };

    try {
      if (db) {
        await db.insert(hermesArtifacts).values(artifactRecord as any).onConflictDoNothing();
      }
    } catch (artErr) {
      console.warn('[HermesMediaOrchestrator] Notice inserting artifact:', artErr);
    }
    this.inMemoryArtifacts.set(artifactId, artifactRecord);

    const actualSeconds = Number((params.executionTimeMs / 1000).toFixed(3));
    const settlement = await TenantCreditLedgerService.settleReservation({
      reservationId: params.reservationId,
      actualExecutionSeconds: actualSeconds,
      actualRawCostUsd: params.rawCostUsd,
      tenantId: params.tenantId,
      endpointId: params.endpointId,
    });

    await this.updateAttempt(params.attemptId, {
      status: 'COMPLETED',
      executionId: params.executionId,
      computeSeconds: actualSeconds.toFixed(3),
      rawCostUsd: settlement.rawCostUsd.toFixed(5),
      markupCostUsd: settlement.markupCostUsd.toFixed(5),
      totalChargedUsd: settlement.totalChargedUsd.toFixed(5),
      artifactId,
    });

    await this.markRequestCompleted(params.tenantId, params.requestId, artifactId);

    try {
      await SecurityAuditLogger.logEvent({
        organizationId: params.tenantId,
        actorId: params.actorId,
        eventType: 'MEDIA_GENERATION_COMPLETED',
        severity: 'INFO',
        policyDecision: 'ALLOW',
        correlationId: params.correlationId,
        artifactId,
        metadata: {
          requestId: params.requestId,
          provider: params.provider,
          executionTimeMs: params.executionTimeMs,
          rawCostUsd: settlement.rawCostUsd,
          markupCostUsd: settlement.markupCostUsd,
          totalChargedUsd: settlement.totalChargedUsd,
          cid,
        },
      });
    } catch (e) {
      console.warn('[HermesMediaOrchestrator] Audit notice:', e);
    }

    return {
      artifactId,
      artifact: {
        id: artifactRecord.id,
        artifactId,
        cid,
        ipfsUri: artifactRecord.ipfsUri,
        sha256: artifactRecord.sha256,
        mimeType: artifactRecord.mimeType,
      },
      financialBreakdown: {
        rawCostUsd: settlement.rawCostUsd,
        markupCostUsd: settlement.markupCostUsd,
        totalChargedUsd: settlement.totalChargedUsd,
      },
    };
  }

  /**
   * Awaits asynchronous execution result from Sofia worker or times out after POST_ACK_TIMEOUT_MS.
   */
  private static async awaitSofiaResult(
    tenantId: string,
    requestId: string,
    executionId: string
  ): Promise<{ output: any; computeSeconds?: number; rawCostUsd?: number }> {
    const existingArt = this.inMemoryArtifacts.get(`art_${requestId}`);
    if (existingArt) {
      return { output: existingArt, computeSeconds: 3.0, rawCostUsd: 0.02 };
    }

    const pollIntervalMs = 250;
    const maxAttempts = Math.floor(this.POST_ACK_TIMEOUT_MS / pollIntervalMs);

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      const attempts = this.inMemoryAttempts.get(requestId);
      const matched = attempts?.find((a) => a.executionId === executionId && a.status === 'COMPLETED');
      if (matched && matched.artifactId) {
        const art = this.inMemoryArtifacts.get(matched.artifactId);
        return {
          output: art,
          computeSeconds: Number(matched.computeSeconds || 3.0),
          rawCostUsd: Number(matched.rawCostUsd || 0.02),
        };
      }

      // Multi-instance / Serverless DB Fallback: Check DB for attempt completed by another instance
      if (db) {
        try {
          const [dbAttempt] = await db
            .select()
            .from(hermesGenerationAttempts)
            .where(
              and(
                eq(hermesGenerationAttempts.tenantId, tenantId),
                eq(hermesGenerationAttempts.executionId, executionId),
                eq(hermesGenerationAttempts.status, 'COMPLETED')
              )
            )
            .limit(1);

          if (dbAttempt && dbAttempt.artifactId) {
            const art = await this.getArtifact(tenantId, dbAttempt.artifactId);
            return {
              output: art,
              computeSeconds: Number(dbAttempt.computeSeconds || 3.0),
              rawCostUsd: Number(dbAttempt.rawCostUsd || 0.02),
            };
          }

          // Respaldo: el callback escribe primero el request. Si el intento no
          // quedó cerrado (versión antigua del handler, reintento, etc.), el
          // request COMPLETED con artifactId es evidencia suficiente para
          // liquidar sin dejar el job en UNKNOWN.
          const [doneReq] = await db
            .select({
              artifactId: hermesMediaRequests.artifactId,
              status: hermesMediaRequests.status,
            })
            .from(hermesMediaRequests)
            .where(
              and(
                eq(hermesMediaRequests.id, requestId),
                eq(hermesMediaRequests.tenantId, tenantId)
              )
            )
            .limit(1);

          if (doneReq?.status === 'COMPLETED' && doneReq.artifactId) {
            const art = await this.getArtifact(tenantId, doneReq.artifactId);
            return { output: art, computeSeconds: 3.0, rawCostUsd: 0.02 };
          }
        } catch (error: unknown) {
          // Un fallo transitorio de lectura no debe abortar el sondeo, pero sí
          // quedar visible (nada de silencios en el camino del dinero).
          console.error('[HermesMediaOrchestrator] Post-ACK poll query failed:', error);
        }
      }
    }

    throw new Error(`Sofia post-ACK execution timeout (${this.POST_ACK_TIMEOUT_MS}ms exceeded) for lease ${executionId}`);
  }

  // ── HELPER METHODS FOR DATA INTEGRITY & AUDIT TRAIL ──

  private static async getArtifact(tenantId: string, artifactId: string): Promise<any> {
    const inMem = this.inMemoryArtifacts.get(artifactId);
    if (inMem) {
      if (inMem.tenantId && inMem.tenantId.toLowerCase() !== tenantId.toLowerCase()) {
        return null; // Strict cross-tenant boundary
      }
      return inMem;
    }
    if (db) {
      const [row] = await db
        .select()
        .from(hermesArtifacts)
        .where(and(eq(hermesArtifacts.tenantId, tenantId), eq(hermesArtifacts.artifactId, artifactId)))
        .limit(1);
      return row;
    }
    return null;
  }

  private static async recordAttempt(tenantId: string, attempt: any): Promise<void> {
    const record = {
      ...attempt,
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const current = this.inMemoryAttempts.get(attempt.requestId) || [];
    current.push(record);
    this.inMemoryAttempts.set(attempt.requestId, current);

    try {
      if (db) {
        await db.insert(hermesGenerationAttempts).values(record).onConflictDoNothing();
      }
    } catch (error: unknown) {
      // Evidencia de ejecución: no puede desaparecer en silencio.
      console.error(
        `[HermesMediaOrchestrator] Could not persist attempt ${attempt?.id} (request ${attempt?.requestId}):`,
        error
      );
    }
  }

  private static async updateAttempt(attemptId: string, updates: any): Promise<void> {
    for (const [reqId, list] of this.inMemoryAttempts.entries()) {
      const target = list.find((a) => a.id === attemptId);
      if (target) {
        Object.assign(target, updates, { updatedAt: new Date() });
      }
    }

    try {
      if (db) {
        await db
          .update(hermesGenerationAttempts)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(hermesGenerationAttempts.id, attemptId));
      }
    } catch (error: unknown) {
      console.error(`[HermesMediaOrchestrator] Could not update attempt ${attemptId}:`, error);
    }
  }

  private static async markRequestCompleted(tenantId: string, requestId: string, artifactId: string): Promise<void> {
    const req = this.inMemoryRequests.get(requestId);
    if (req) {
      req.status = 'COMPLETED';
      req.artifactId = artifactId;
      req.completedAt = new Date();
    }

    try {
      if (db) {
        await db
          .update(hermesMediaRequests)
          .set({
            status: 'COMPLETED',
            artifactId,
            completedAt: new Date(),
          })
          .where(and(eq(hermesMediaRequests.id, requestId), eq(hermesMediaRequests.tenantId, tenantId)));
      }
    } catch (err) {
      console.warn('[HermesMediaOrchestrator] Notice marking request completed:', err);
    }
  }

  private static async markRequestStatus(tenantId: string, requestId: string, status: string): Promise<void> {
    const req = this.inMemoryRequests.get(requestId);
    if (req) {
      req.status = status;
    }

    try {
      if (db) {
        await db
          .update(hermesMediaRequests)
          .set({ status })
          .where(and(eq(hermesMediaRequests.id, requestId), eq(hermesMediaRequests.tenantId, tenantId)));
      }
    } catch (err) {
      console.warn('[HermesMediaOrchestrator] Notice updating request status:', err);
    }
  }

  private static async markRequestFailed(tenantId: string, requestId: string, code?: string, message?: string): Promise<void> {
    const req = this.inMemoryRequests.get(requestId);
    if (req) {
      req.status = 'FAILED';
      req.failureCode = code;
      req.failureMessage = message;
    }

    try {
      if (db) {
        await db
          .update(hermesMediaRequests)
          .set({
            status: 'FAILED',
            failureCode: code,
            failureMessage: message,
          })
          .where(and(eq(hermesMediaRequests.id, requestId), eq(hermesMediaRequests.tenantId, tenantId)));
      }
    } catch (err) {
      console.warn('[HermesMediaOrchestrator] Notice marking request failed:', err);
    }
  }

  /**
   * F6-3: Forensic Reconcile for UNKNOWN media generation requests.
   * Investigates external state with zero-client input and executes tri-state resolution:
   * - PROVEN_EXECUTED: Settle compute reservation, register verified artifact, mark COMPLETED.
   * - PROVEN_NOT_EXECUTED: Release compute reservation, mark FAILED.
   * - UNRESOLVED: (404 NOT_FOUND != FAILED): Stay UNKNOWN, schedule backoff, funds PRESERVED.
   */
  public static async reconcileUnknownRequest(
    tenantId: string,
    requestId: string
  ): Promise<{
    reconciled: boolean;
    status: 'COMPLETED' | 'UNKNOWN' | 'FAILED';
    resolution: 'PROVEN_EXECUTED' | 'PROVEN_NOT_EXECUTED' | 'UNRESOLVED';
    artifactId?: string;
    error?: string;
    retryPermitted: boolean;
  }> {
    const normalizedTenant = tenantId.toLowerCase().trim();
    let request = this.inMemoryRequests.get(requestId);

    if (!request && db) {
      const [dbReq] = await db
        .select()
        .from(hermesMediaRequests)
        .where(and(eq(hermesMediaRequests.id, requestId), eq(hermesMediaRequests.tenantId, normalizedTenant)))
        .limit(1);
      request = dbReq;
    }

    if (!request) {
      return {
        reconciled: false,
        status: 'UNKNOWN',
        resolution: 'UNRESOLVED',
        error: `Media request '${requestId}' not found for tenant '${normalizedTenant}'.`,
        retryPermitted: false,
      };
    }

    if (request.status !== 'UNKNOWN') {
      return {
        reconciled: true,
        status: request.status as any,
        resolution: request.status === 'COMPLETED' ? 'PROVEN_EXECUTED' : 'PROVEN_NOT_EXECUTED',
        artifactId: request.artifactId,
        retryPermitted: request.status === 'FAILED',
      };
    }

    let attempts = this.inMemoryAttempts.get(requestId) || [];
    if (attempts.length === 0 && db) {
      attempts = await db
        .select()
        .from(hermesGenerationAttempts)
        .where(eq(hermesGenerationAttempts.requestId, requestId))
        .orderBy(hermesGenerationAttempts.attemptNumber);
    }

    const latestAttempt = attempts[attempts.length - 1];
    // P1-2: Lookup real reservationId from credit ledger or fallback
    const activeRes = await TenantCreditLedgerService.findActiveReservation(normalizedTenant, requestId);
    const reservationId = activeRes?.reservationId || `res_${requestId}`;
    const backoffScheduleMs = [30000, 120000, 300000, 900000, 3600000, 21600000];
    const currentAttemptsCount = request.reconciliationAttempts || 0;
    const nextBackoffMs = backoffScheduleMs[Math.min(currentAttemptsCount, backoffScheduleMs.length - 1)] ?? 30000;
    const nextReconciliationAt = new Date(Date.now() + nextBackoffMs);

    let resolution: 'PROVEN_EXECUTED' | 'PROVEN_NOT_EXECUTED' | 'UNRESOLVED' = 'UNRESOLVED';
    let output: any = null;
    let executionTimeMs = 2000;
    let rawCostUsd = 0.02;

    if (latestAttempt?.provider === 'sofia') {
      try {
        const checkRes: any = await A2AOutboundDispatcher.sendToSofia('media.status' as any, {
          executionId: latestAttempt.executionId,
          requestId,
        }, {
          tenantId: normalizedTenant,
          correlationId: request.correlationId || requestId,
        });

        if (checkRes.success && (checkRes.output || checkRes.receipt)) {
          resolution = 'PROVEN_EXECUTED';
          output = checkRes.output || checkRes.receipt;
          executionTimeMs = checkRes.executionTimeMs || 2500;
          rawCostUsd = checkRes.rawCostUsd || 0.02;
        } else if (checkRes.status === 'CANCELLED' || checkRes.status === 'FAILED_PRE_SIDE_EFFECT') {
          resolution = 'PROVEN_NOT_EXECUTED';
        } else {
          resolution = 'UNRESOLVED';
        }
      } catch (sofiaErr) {
        resolution = 'UNRESOLVED';
      }
    } else if (latestAttempt?.provider === 'runpod') {
      try {
        const runpodStatus = await RunPodServerlessService.checkJobStatus(
          this.RUNPOD_DEFAULT_ENDPOINT,
          latestAttempt.executionId || requestId
        );

        if (runpodStatus.status === 'COMPLETED') {
          resolution = 'PROVEN_EXECUTED';
          output = runpodStatus.output;
          executionTimeMs = runpodStatus.executionTimeMs || 2000;
          rawCostUsd = runpodStatus.rawCostUsd || 0.02;
        } else if (runpodStatus.status === 'FAILED') {
          resolution = 'PROVEN_NOT_EXECUTED';
        } else {
          resolution = 'UNRESOLVED';
        }
      } catch (runpodErr) {
        resolution = 'UNRESOLVED';
      }
    }

    if (resolution === 'PROVEN_EXECUTED') {
      const completed = await this.registerArtifactAndSettle({
        tenantId: normalizedTenant,
        requestId,
        correlationId: request.correlationId || requestId,
        provider: (latestAttempt?.provider as any) || 'sofia',
        attemptId: latestAttempt?.id || `att_rec_${requestId}`,
        reservationId,
        executionId: latestAttempt?.executionId || requestId,
        executionTimeMs,
        rawCostUsd,
        output,
        prompt: request.prompt || 'Reconciled media request',
        capability: request.capability,
        options: request.briefJson || {},
        endpointId: this.RUNPOD_DEFAULT_ENDPOINT,
      });

      await this.markRequestStatus(normalizedTenant, requestId, 'COMPLETED');
      request.status = 'COMPLETED';
      request.artifactId = completed.artifactId;

      try {
        if (db) {
          await db
            .update(hermesMediaRequests)
            .set({
              status: 'COMPLETED',
              artifactId: completed.artifactId,
              lastReconciledAt: new Date(),
              reconciliationAttempts: currentAttemptsCount + 1,
            })
            .where(eq(hermesMediaRequests.id, requestId));
        }
      } catch (e) {
        console.warn('[HermesMediaOrchestrator] Notice updating reconciled media DB:', e);
      }

      await SecurityAuditLogger.logEvent({
        organizationId: normalizedTenant,
        eventType: 'MEDIA_GENERATION_RECONCILED',
        severity: 'INFO',
        policyDecision: 'ALLOW',
        correlationId: request.correlationId || requestId,
        metadata: {
          requestId,
          resolution: 'PROVEN_EXECUTED',
          provider: latestAttempt?.provider,
          artifactId: completed.artifactId,
        },
      });

      // P1-3: Autonomous hook from Media Reconciliation -> Demand Campaign Loop
      try {
        const { DemandDistributionService } = await import('../demand/demand-distribution.service');
        DemandDistributionService.onMediaReconciliationOutcome(normalizedTenant, requestId, {
          status: 'COMPLETED',
          resolution: 'PROVEN_EXECUTED',
          artifactId: completed.artifactId,
          artifact: completed.artifact,
          financialBreakdown: completed.financialBreakdown,
        });
      } catch (notifyErr) {
        console.warn('[HermesMediaOrchestrator] Notice notifying Demand loop of reconciled piece:', notifyErr);
      }

      return {
        reconciled: true,
        status: 'COMPLETED',
        resolution: 'PROVEN_EXECUTED',
        artifactId: completed.artifactId,
        retryPermitted: false,
      };
    }

    if (resolution === 'PROVEN_NOT_EXECUTED') {
      // P1-2 FIX: Correct parameter order (reservationId, tenantId, reason)
      await TenantCreditLedgerService.releaseReservation(reservationId, normalizedTenant, 'Provider confirmed job was not executed before GPU allocation.');
      await this.markRequestFailed(normalizedTenant, requestId, 'RECONCILED_FAILED_BEFORE_EXECUTION', 'Provider confirmed job was not executed.');
      request.status = 'FAILED';

      try {
        if (db) {
          await db
            .update(hermesMediaRequests)
            .set({
              status: 'FAILED',
              failureCode: 'RECONCILED_FAILED_BEFORE_EXECUTION',
              lastReconciledAt: new Date(),
              reconciliationAttempts: currentAttemptsCount + 1,
            })
            .where(eq(hermesMediaRequests.id, requestId));
        }
      } catch (e) {
        console.warn('[HermesMediaOrchestrator] Notice updating failed media DB:', e);
      }

      await SecurityAuditLogger.logEvent({
        organizationId: normalizedTenant,
        eventType: 'MEDIA_GENERATION_RECONCILED',
        severity: 'INFO',
        policyDecision: 'ALLOW',
        correlationId: request.correlationId || requestId,
        metadata: {
          requestId,
          resolution: 'PROVEN_NOT_EXECUTED',
          provider: latestAttempt?.provider,
        },
      });

      // P1-3: Autonomous hook from Media Reconciliation -> Demand Campaign Loop
      try {
        const { DemandDistributionService } = await import('../demand/demand-distribution.service');
        DemandDistributionService.onMediaReconciliationOutcome(normalizedTenant, requestId, {
          status: 'FAILED',
          resolution: 'PROVEN_NOT_EXECUTED',
          error: 'Provider confirmed job was not executed before GPU allocation.',
        });
      } catch (notifyErr) {
        console.warn('[HermesMediaOrchestrator] Notice notifying Demand loop of failed piece:', notifyErr);
      }

      return {
        reconciled: true,
        status: 'FAILED',
        resolution: 'PROVEN_NOT_EXECUTED',
        retryPermitted: true,
      };
    }

    // CASE 3: UNRESOLVED (F6-3 & F6-10: NOT_FOUND != FAILED -> Funds Preserved)
    request.reconciliationAttempts = currentAttemptsCount + 1;
    request.lastReconciledAt = new Date();
    request.nextReconciliationAt = nextReconciliationAt;

    try {
      if (db) {
        await db
          .update(hermesMediaRequests)
          .set({
            reconciliationAttempts: currentAttemptsCount + 1,
            lastReconciledAt: new Date(),
            nextReconciliationAt,
            reconciliationLockUntil: null,
          })
          .where(eq(hermesMediaRequests.id, requestId));
      }
    } catch (e) {
      console.warn('[HermesMediaOrchestrator] Notice updating unresolved media DB:', e);
    }

    return {
      reconciled: false,
      status: 'UNKNOWN',
      resolution: 'UNRESOLVED',
      retryPermitted: false,
    };
  }
}

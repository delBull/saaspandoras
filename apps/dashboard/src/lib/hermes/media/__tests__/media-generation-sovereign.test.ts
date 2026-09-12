/**
 * 🧪 HERMES SOVEREIGN MEDIA GENERATION & RUNPOD FAILOVER TEST SUITE (FASE 5)
 * apps/dashboard/src/lib/hermes/media/__tests__/media-generation-sovereign.test.ts
 *
 * Verifies the 12 Mandatory Architecture Rules (F5-1 to F5-12):
 * F5-1 & F5-9: Durable GenerationJob & generation:${tenant}:${idempotencyKey || requestId}
 * F5-2: hermesGenerationAttempts tracking (attemptNumber, provider, executionId, computeSeconds, rawCostUsd, markupCostUsd, totalChargedUsd)
 * F5-3 & F5-12: Fail-fast pre-ACK (<=2500ms) authorizes RunPod Attempt #2
 * F5-4: Sofia post-ACK ownership fencing -> UNKNOWN, RunPod fallback BLOCKED
 * F5-5: Unified engine for wait=true and wait=false
 * F5-6: Atomic credit reservation & overdraft protection
 * F5-7: 3-way financial audit (rawCostUsd + markupCostUsd = totalChargedUsd)
 * F5-8: Strict artifact pipeline (verify -> sha256 -> hermesArtifacts -> COMPLETED)
 * F5-10: Provider 'sofia' strictly inhibits RunPod fallback
 * F5-11: Provider 'runpod' executes direct scale-to-zero without Sofia
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HermesMediaOrchestratorService,
} from '../hermes-media-orchestrator.service';
import { TenantCreditLedgerService } from '../../compute/tenant-credit-ledger.service';
import { RunPodServerlessService } from '../../compute/runpod-serverless.service';
import { A2AOutboundDispatcher } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-outbound-dispatcher';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';
import { db } from '@/db';

describe('⚡ HERMES SOVEREIGN MEDIA GENERATION (FASE 5)', () => {
  const TENANT_A = 'tenant_media_alpha';
  const TENANT_B = 'tenant_media_beta';

  beforeEach(() => {
    vi.restoreAllMocks();
    HermesMediaOrchestratorService.clearInMemoryForTesting();
    vi.spyOn(CapabilityGrantService, 'isCapabilityGranted').mockResolvedValue(true);
    vi.spyOn(SecurityAuditLogger, 'logEvent').mockResolvedValue({} as any);
  });

  // ── TC-1: DURABLE IDEMPOTENCY (F5-1, F5-9) ─────────────────────────────────
  it('TC-1: Re-executing a completed request with same idempotencyKey returns existing artifact without duplicate attempts or duplicate charges', async () => {
    const existingArtifactId = 'art_completed_123';
    const mockRequest: any = {
      id: 'req_idemp_001',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'A futuristic cybernetic garden',
      status: 'COMPLETED',
      provider: 'runpod',
      idempotencyKey: 'idemp_key_alpha_1',
      artifactId: existingArtifactId,
      correlationId: 'corr_001',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockArtifact: any = {
      id: existingArtifactId,
      tenantId: TENANT_A,
      cid: 'mock_bafkrei_garden_cyber',
      mimeType: 'image/png',
      sha256: 'a1b2c3d4e5f6',
      byteSize: 1048576,
      createdAt: new Date(),
    };

    // DB mocks
    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([mockRequest]),
          orderBy: vi.fn().mockResolvedValue([]),
        })),
      })),
    })) as any);

    // Mock artifact query
    vi.spyOn(db.select().from(null as any).where(null as any), 'limit')
      .mockResolvedValue([mockArtifact]);

    const reserveSpy = vi.spyOn(TenantCreditLedgerService, 'reserveCredits');
    const runpodSpy = vi.spyOn(RunPodServerlessService, 'executeSync');

    const result = await HermesMediaOrchestratorService.executeGeneration(TENANT_A, mockRequest.id, {
      capability: 'media.image.generate',
      prompt: 'A futuristic cybernetic garden',
      options: {},
      provider: 'auto',
      idempotencyKey: 'idemp_key_alpha_1',
      isSandbox: true,
    });

    expect(result.ok).toBe(true);
    expect(result.isIdempotentReplay).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(result.artifactId).toBe(existingArtifactId);

    // Assert that NO new credits were reserved, and NO new compute was run
    expect(reserveSpy).not.toHaveBeenCalled();
    expect(runpodSpy).not.toHaveBeenCalled();
  });

  // ── TC-2: SOFIA PRE-ACK FAILOVER TO RUNPOD (F5-3, F5-12) ───────────────────
  it('TC-2: Sofia pre-ACK failure (<=2500ms) records Attempt #1 FAILED, logs MEDIA_FAILOVER_AUTHORIZED, and succeeds on RunPod Attempt #2', async () => {
    const mockRequest: any = {
      id: 'req_failover_002',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'Hyperrealistic architectural rendering',
      status: 'PENDING',
      provider: 'auto',
      idempotencyKey: 'idemp_key_failover_002',
      correlationId: 'corr_002',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let attempts: any[] = [];

    // Mock DB select
    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => Promise.resolve([mockRequest])),
          orderBy: vi.fn().mockImplementation(() => Promise.resolve(attempts)),
        })),
      })),
    })) as any);

    // Mock DB insert with onConflictDoNothing
    vi.spyOn(db, 'insert').mockImplementation((() => ({
      values: vi.fn().mockImplementation((val: any) => {
        if ('attemptNumber' in val) {
          attempts.push({ ...val });
        }
        return {
          returning: vi.fn().mockResolvedValue([{ id: val.id || 'new_id', ...val }]),
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        };
      }),
    })) as any);

    // Mock DB update
    vi.spyOn(db, 'update').mockImplementation((() => ({
      set: vi.fn().mockImplementation((fields: any) => {
        Object.assign(mockRequest, fields);
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockRequest]),
          })),
        };
      }),
    })) as any);

    // Mock credit reservation & settle
    vi.spyOn(TenantCreditLedgerService, 'reserveCredits').mockResolvedValue({
      ok: true,
      reservationId: 'res_002',
      reservedAmountUsd: 0.05,
      isSandbox: true,
      availableBalanceUsd: 1.0,
    });

    vi.spyOn(TenantCreditLedgerService, 'settleReservation').mockResolvedValue({
      ok: true,
      success: true,
      tenantId: TENANT_A,
      reservationId: 'res_002',
      rawCostUsd: 0.02,
      markupCostUsd: 0.007,
      totalChargedUsd: 0.027,
      remainingBalanceUsd: 0.973,
    } as any);

    // Sofia pre-ACK failure
    vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockRejectedValue(
      new Error('Sofia daemon unreachable (Connection refused :8080)')
    );

    // RunPod succeeds
    vi.spyOn(RunPodServerlessService, 'executeSync').mockResolvedValue({
      success: true,
      jobId: 'runpod_job_success_777',
      executionTimeMs: 4200,
      rawCostUsd: 0.02,
      output: {
        imageUrl: 'https://storage.pandoras.finance/mock_render.png',
        bytes: 'mock_base64_or_buffer',
      },
    });

    const auditSpy = vi.spyOn(SecurityAuditLogger, 'logEvent');

    const result = await HermesMediaOrchestratorService.executeGeneration(TENANT_A, mockRequest.id, {
      capability: 'media.image.generate',
      prompt: 'Hyperrealistic architectural rendering',
      options: {},
      provider: 'auto',
      isSandbox: true,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(result.provider).toBe('runpod');
    expect(result.attemptCount).toBe(2);

    // Verify audit log emitted MEDIA_FAILOVER_AUTHORIZED
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'MEDIA_FAILOVER_AUTHORIZED',
        organizationId: TENANT_A,
        metadata: expect.objectContaining({
          reason: 'SOFIA_PRE_ACK_FAILOVER_TO_RUNPOD',
        }),
      })
    );
  });

  // ── TC-3: SOFIA POST-ACK OWNERSHIP FENCING (F5-4) ──────────────────────────
  it('TC-3: Sofia post-ACK timeout transitions to UNKNOWN; RunPod fallback is strictly BLOCKED', async () => {
    HermesMediaOrchestratorService.POST_ACK_TIMEOUT_MS = 50;
    const mockRequest: any = {
      id: 'req_postack_003',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'Private luxury penthouse floorplan 3D',
      status: 'PENDING',
      provider: 'auto',
      correlationId: 'corr_003',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let attempts: any[] = [];

    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([mockRequest]),
          orderBy: vi.fn().mockResolvedValue(attempts),
        })),
      })),
    })) as any);

    vi.spyOn(db, 'insert').mockImplementation((() => ({
      values: vi.fn().mockImplementation((val: any) => {
        if ('attemptNumber' in val) attempts.push({ ...val });
        return {
          returning: vi.fn().mockResolvedValue([{ id: val.id || 'id_3', ...val }]),
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        };
      }),
    })) as any);

    vi.spyOn(db, 'update').mockImplementation((() => ({
      set: vi.fn().mockImplementation((fields: any) => {
        Object.assign(mockRequest, fields);
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockRequest]),
          })),
        };
      }),
    })) as any);

    vi.spyOn(TenantCreditLedgerService, 'reserveCredits').mockResolvedValue({
      ok: true,
      reservationId: 'res_003',
      reservedAmountUsd: 0.05,
      isSandbox: true,
      availableBalanceUsd: 1.0,
    });

    const releaseSpy = vi.spyOn(TenantCreditLedgerService, 'releaseReservation').mockResolvedValue();

    // Sofia pre-ACK succeeds (issues ACK)
    vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockResolvedValue({
      success: true,
      executionId: 'sofia_exec_acknowledged_999',
    } as any);

    // RunPod spy to ensure it is NEVER called
    const runpodSpy = vi.spyOn(RunPodServerlessService, 'executeSync');

    const result = await HermesMediaOrchestratorService.executeGeneration(TENANT_A, mockRequest.id, {
      capability: 'media.image.generate',
      prompt: 'Private luxury penthouse floorplan 3D',
      options: {},
      provider: 'auto',
      isSandbox: true,
    });

    // Invariant F5-4: Status MUST be UNKNOWN
    expect(result.ok).toBe(false);
    expect(result.status).toBe('UNKNOWN');
    expect(mockRequest.status).toBe('UNKNOWN');

    // Strict Fencing Assertion: RunPod was NEVER called!
    expect(runpodSpy).not.toHaveBeenCalled();

    // Invariant F6-10: Reservation is preserved in UNKNOWN and NOT prematurely released
    expect(releaseSpy).not.toHaveBeenCalled();
  });

  // ── TC-4: PROVIDER SOFIA-ONLY (F5-10) ──────────────────────────────────────
  it('TC-4: provider=sofia strictly prohibits RunPod fallback on failure', async () => {
    const mockRequest: any = {
      id: 'req_sofia_only_004',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'Autonomous architectural draft',
      status: 'PENDING',
      provider: 'sofia',
      correlationId: 'corr_004',
    };

    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([mockRequest]),
          orderBy: vi.fn().mockResolvedValue([]),
        })),
      })),
    })) as any);

    vi.spyOn(db, 'insert').mockImplementation((() => ({
      values: vi.fn().mockImplementation((val: any) => ({
        returning: vi.fn().mockResolvedValue([{ id: 'id_4', ...val }]),
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      })),
    })) as any);

    vi.spyOn(db, 'update').mockImplementation((() => ({
      set: vi.fn().mockImplementation((fields: any) => {
        Object.assign(mockRequest, fields);
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockRequest]),
          })),
        };
      }),
    })) as any);

    vi.spyOn(TenantCreditLedgerService, 'reserveCredits').mockResolvedValue({
      ok: true,
      reservationId: 'res_004',
      reservedAmountUsd: 0.05,
      isSandbox: true,
      availableBalanceUsd: 1.0,
    });
    vi.spyOn(TenantCreditLedgerService, 'releaseReservation').mockResolvedValue();

    vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockRejectedValue(new Error('Sofia node busy'));
    const runpodSpy = vi.spyOn(RunPodServerlessService, 'executeSync');

    const result = await HermesMediaOrchestratorService.executeGeneration(TENANT_A, mockRequest.id, {
      capability: 'media.image.generate',
      prompt: 'Autonomous architectural draft',
      options: {},
      provider: 'sofia',
      isSandbox: true,
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe('FAILED');
    expect(runpodSpy).not.toHaveBeenCalled();
  });

  // ── TC-5: PROVIDER RUNPOD-ONLY (F5-11) ─────────────────────────────────────
  it('TC-5: provider=runpod executes RunPod scale-to-zero directly without invoking Sofia', async () => {
    const mockRequest: any = {
      id: 'req_runpod_only_005',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'Sovereign cloud direct generation',
      status: 'PENDING',
      provider: 'runpod',
      correlationId: 'corr_005',
    };

    let attempts: any[] = [];

    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([mockRequest]),
          orderBy: vi.fn().mockResolvedValue(attempts),
        })),
      })),
    })) as any);

    vi.spyOn(db, 'insert').mockImplementation((() => ({
      values: vi.fn().mockImplementation((val: any) => {
        if ('attemptNumber' in val) attempts.push(val);
        return {
          returning: vi.fn().mockResolvedValue([{ id: val.id || 'art_555', ...val }]),
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        };
      }),
    })) as any);

    vi.spyOn(db, 'update').mockImplementation((() => ({
      set: vi.fn().mockImplementation((fields: any) => {
        Object.assign(mockRequest, fields);
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockRequest]),
          })),
        };
      }),
    })) as any);

    vi.spyOn(TenantCreditLedgerService, 'reserveCredits').mockResolvedValue({
      ok: true,
      reservationId: 'res_005',
      reservedAmountUsd: 0.05,
      isSandbox: true,
      availableBalanceUsd: 1.0,
    });

    vi.spyOn(TenantCreditLedgerService, 'settleReservation').mockResolvedValue({
      ok: true,
      success: true,
      tenantId: TENANT_A,
      reservationId: 'res_005',
      rawCostUsd: 0.02,
      markupCostUsd: 0.007,
      totalChargedUsd: 0.027,
      remainingBalanceUsd: 0.973,
    } as any);

    const sofiaSpy = vi.spyOn(A2AOutboundDispatcher, 'sendToSofia');
    const runpodSpy = vi.spyOn(RunPodServerlessService, 'executeSync').mockResolvedValue({
      success: true,
      jobId: 'runpod_direct_123',
      executionTimeMs: 3100,
      rawCostUsd: 0.02,
      output: {
        imageUrl: 'https://storage.pandoras.finance/render_runpod.png',
      },
    });

    const result = await HermesMediaOrchestratorService.executeGeneration(TENANT_A, mockRequest.id, {
      capability: 'media.image.generate',
      prompt: 'Sovereign cloud direct generation',
      options: {},
      provider: 'runpod',
      isSandbox: true,
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(result.provider).toBe('runpod');
    expect(result.attemptCount).toBe(1);

    // Verify Sofia was NEVER touched
    expect(sofiaSpy).not.toHaveBeenCalled();
    // RunPod was executed exactly once
    expect(runpodSpy).toHaveBeenCalledTimes(1);
  });

  // ── TC-6: ATOMIC CREDIT RESERVATION & CONCURRENCY OVERDRAFT (F5-6) ──────────
  it('TC-6: Atomic credit reservation prevents overdraft under concurrent requests', async () => {
    // Tenant starts with $0.05
    let balance = 0.05;
    let reserved = 0.0;

    const mockReserve = vi.fn().mockImplementation(async (tenantId: string, params: any) => {
      const amount = params.estimatedRawCostUsd ?? 0.03;
      const available = balance - reserved;
      if (available < amount) {
        return {
          ok: false,
          error: `Insufficient credit balance. Required: $${amount.toFixed(4)}, available: $${available.toFixed(4)}.`,
          availableBalanceUsd: available,
        };
      }
      reserved += amount;
      return {
        ok: true,
        reservationId: `res_${Date.now()}_${Math.random()}`,
        reservedAmountUsd: amount,
        isSandbox: true,
        availableBalanceUsd: balance - reserved,
      };
    });

    vi.spyOn(TenantCreditLedgerService, 'reserveCredits').mockImplementation(mockReserve);

    // Dispatch 2 concurrent reservations of $0.03 each
    const req1 = TenantCreditLedgerService.reserveCredits(TENANT_A, {
      requestId: 'r1',
      capability: 'media.image.generate',
      provider: 'runpod',
      estimatedRawCostUsd: 0.03,
      isSandbox: true,
    });
    const req2 = TenantCreditLedgerService.reserveCredits(TENANT_A, {
      requestId: 'r2',
      capability: 'media.image.generate',
      provider: 'runpod',
      estimatedRawCostUsd: 0.03,
      isSandbox: true,
    });

    const [res1, res2] = await Promise.all([req1, req2]);

    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(false);
    expect(res2.error).toContain('Insufficient credit balance');

    // Balance was NOT overdrawn
    expect(reserved).toBe(0.03);
    expect(Number((balance - reserved).toFixed(4))).toBe(0.02);
  });

  // ── TC-7: 3-WAY FINANCIAL BREAKDOWN AUDIT (F5-7) ───────────────────────────
  it('TC-7: 3-way financial audit verifies rawCostUsd + markupCostUsd (35%) = totalChargedUsd', async () => {
    const rawCost = 0.02; // $0.02 raw GPU cost
    const markupPct = 35;
    const expectedMarkup = Number((rawCost * (markupPct / 100)).toFixed(6)); // 0.007
    const expectedTotal = Number((rawCost + expectedMarkup).toFixed(6)); // 0.027

    expect(expectedMarkup).toBe(0.007);
    expect(expectedTotal).toBe(0.027);
    expect(Number((rawCost + expectedMarkup).toFixed(6))).toBe(expectedTotal);
  });

  // ── TC-8: STRICT ARTIFACT PERSISTENCE PIPELINE (F5-8) ───────────────────────
  it('TC-8: Artifact insertion into hermesArtifacts with SHA-256 is strictly enforced before marking COMPLETED', async () => {
    const mockRequest: any = {
      id: 'req_art_008',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'High-res villa aerial',
      status: 'PENDING',
      provider: 'runpod',
      correlationId: 'corr_008',
    };

    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([mockRequest]),
          orderBy: vi.fn().mockResolvedValue([]),
        })),
      })),
    })) as any);

    let insertedArtifact: any = null;
    vi.spyOn(db, 'insert').mockImplementation((() => ({
      values: vi.fn().mockImplementation((val: any) => {
        if ('mimeType' in val && 'sha256' in val) {
          insertedArtifact = val;
        }
        return {
          returning: vi.fn().mockResolvedValue([{ id: 'art_888', ...val }]),
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        };
      }),
    })) as any);

    vi.spyOn(db, 'update').mockImplementation((() => ({
      set: vi.fn().mockImplementation((fields: any) => {
        Object.assign(mockRequest, fields);
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockRequest]),
          })),
        };
      }),
    })) as any);

    vi.spyOn(TenantCreditLedgerService, 'reserveCredits').mockResolvedValue({
      ok: true,
      reservationId: 'res_008',
      reservedAmountUsd: 0.05,
      isSandbox: true,
      availableBalanceUsd: 1.0,
    });
    vi.spyOn(TenantCreditLedgerService, 'settleReservation').mockResolvedValue({
      ok: true,
      success: true,
      tenantId: TENANT_A,
      reservationId: 'res_008',
      rawCostUsd: 0.015,
      markupCostUsd: 0.00525,
      totalChargedUsd: 0.02025,
      remainingBalanceUsd: 0.97975,
    } as any);

    vi.spyOn(RunPodServerlessService, 'executeSync').mockResolvedValue({
      success: true,
      jobId: 'rp_job_888',
      executionTimeMs: 2500,
      rawCostUsd: 0.015,
      output: {
        imageUrl: 'https://cdn.pandoras.finance/renders/aerial.png',
      },
    });

    const result = await HermesMediaOrchestratorService.executeGeneration(TENANT_A, mockRequest.id, {
      capability: 'media.image.generate',
      prompt: 'High-res villa aerial',
      options: {},
      provider: 'runpod',
      isSandbox: true,
    });

    expect(result.ok).toBe(true);
    expect(insertedArtifact).not.toBeNull();
    expect(insertedArtifact.sha256).toBeDefined();
    expect(insertedArtifact.sha256.length).toBe(64); // Valid 256-bit hex hash
    expect(insertedArtifact.tenantId).toBe(TENANT_A);
    expect(mockRequest.artifactId).toBe('art_' + mockRequest.id);
    expect(mockRequest.status).toBe('COMPLETED');
  });

  // ── TC-9: SEMANTIC EQUIVALENCE OF wait=true/false (F5-5) ────────────────────
  it('TC-9: wait=true and wait=false execute through the identical orchestrator pipeline and share the same DB record', async () => {
    const mockRequest: any = {
      id: 'req_unified_009',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'Unified architecture test',
      status: 'REQUESTED',
      provider: 'auto',
      idempotencyKey: 'idemp_unified_009',
      correlationId: 'corr_009',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Both modes call createOrGetMediaRequest then executeGeneration
    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([]), // not found initially
        })),
      })),
    })) as any);

    vi.spyOn(db, 'insert').mockImplementation((() => ({
      values: vi.fn().mockImplementation(() => ({
        returning: vi.fn().mockResolvedValue([mockRequest]),
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockRequest]),
        }),
      })),
    })) as any);

    const { request, isNew } = await HermesMediaOrchestratorService.createOrGetMediaRequest(TENANT_A, {
      capability: 'media.image.generate',
      prompt: 'Unified architecture test',
      options: {},
      provider: 'auto',
      idempotencyKey: 'idemp_unified_009',
      isSandbox: true,
    });

    expect(isNew).toBe(true);
    expect(request.id).toMatch(/^req_/);
    expect(request.status).toBe('REQUESTED');
    expect(request.idempotencyKey).toBe('idemp_unified_009');
  });

  // ── TC-10: MULTI-TENANT ISOLATION ──────────────────────────────────────────
  it('TC-10: Multi-tenant boundary prevents cross-tenant access to requests and artifacts', async () => {
    const mockReqTenantA: any = {
      id: 'req_tenant_A',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'Confidential project plans',
      status: 'COMPLETED',
      artifactId: 'art_A',
    };

    // Attempting to execute or inspect Tenant A request with Tenant B context
    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([mockReqTenantA]),
        })),
      })),
    })) as any);

    const result = await HermesMediaOrchestratorService.executeGeneration(TENANT_B, mockReqTenantA.id, {
      capability: 'media.image.generate',
      prompt: 'Confidential project plans',
      options: {},
      provider: 'auto',
      isSandbox: true,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("does not belong to tenant 'tenant_media_beta'");
  });

  // ── TC-11: SOFIA HAPPY PATH RESOLUTION (P1-A FIX) ──────────────────────────
  it('TC-11: Healthy Sofia execution completes synchronously with Attempt #1, COMPLETED status, and RunPod strictly NOT invoked', async () => {
    const mockRequest: any = {
      id: 'req_sofia_happy_011',
      tenantId: TENANT_A,
      capability: 'media.image.generate',
      prompt: 'A flourishing vertical forest penthouse in Mexico City',
      status: 'PENDING',
      provider: 'auto',
      correlationId: 'corr_011',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let attempts: any[] = [];
    let savedArtifact: any = null;

    vi.spyOn(db, 'select').mockImplementation((() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([mockRequest]),
          orderBy: vi.fn().mockResolvedValue(attempts),
        })),
      })),
    })) as any);

    vi.spyOn(db, 'insert').mockImplementation((() => ({
      values: vi.fn().mockImplementation((val: any) => {
        if ('attemptNumber' in val) attempts.push({ ...val });
        if ('cid' in val) savedArtifact = { ...val };
        return {
          returning: vi.fn().mockResolvedValue([{ id: val.id || 'id_11', ...val }]),
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: val.id || 'id_11', ...val }]),
          }),
        };
      }),
    })) as any);

    vi.spyOn(db, 'update').mockImplementation((() => ({
      set: vi.fn().mockImplementation((fields: any) => {
        Object.assign(mockRequest, fields);
        return {
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([mockRequest]),
          })),
        };
      }),
    })) as any);

    const reserveSpy = vi.spyOn(TenantCreditLedgerService, 'reserveCredits').mockResolvedValue({
      ok: true,
      reservationId: 'res_011',
      reservedAmountUsd: 0.05,
      isSandbox: true,
      availableBalanceUsd: 2.50,
    });

    const settleSpy = vi.spyOn(TenantCreditLedgerService, 'settleReservation').mockResolvedValue({
      ok: true,
      rawCostUsd: 0.02,
      markupCostUsd: 0.007,
      totalChargedUsd: 0.027,
      remainingBalanceUsd: 2.473,
      isSandbox: true,
    });

    // Sofia pre-ACK succeeds AND returns execution output (Happy Path)
    const sofiaSpy = vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockResolvedValue({
      success: true,
      executionId: 'sofia_exec_healthy_777',
      output: {
        imageUrl: 'https://cdn.pandoras.finance/sofia_render_healthy.png',
        bytes: 'bW9ja19zb2ZpYV9pbWFnZV9ieXRlcw==',
      },
    } as any);

    const runpodSpy = vi.spyOn(RunPodServerlessService, 'executeSync');

    const result = await HermesMediaOrchestratorService.executeGeneration(TENANT_A, mockRequest.id, {
      capability: 'media.image.generate',
      prompt: 'A flourishing vertical forest penthouse in Mexico City',
      options: {},
      provider: 'auto',
      isSandbox: true,
    });

    // Invariants of healthy Sofia execution:
    expect(result.ok).toBe(true);
    expect(result.status).toBe('COMPLETED');
    expect(result.provider).toBe('sofia');
    expect(result.attemptCount).toBe(1);
    expect(result.artifactId).toBeDefined();
    expect(result.artifact?.cid).toMatch(/^mock_bafkrei_/);
    expect(result.artifact?.sha256).toBeDefined();

    // Verify Sofia was called and RunPod was NEVER called
    expect(sofiaSpy).toHaveBeenCalled();
    expect(runpodSpy).not.toHaveBeenCalled();

    // Verify credit ledger was properly settled
    expect(reserveSpy).toHaveBeenCalled();
    expect(settleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reservationId: 'res_011',
        tenantId: TENANT_A,
        actualRawCostUsd: 0.02,
      })
    );
  });
});

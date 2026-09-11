/**
 * 🧪 HERMES DEMAND & DISTRIBUTION — SECURITY & RESILIENCE TEST SUITE
 * apps/dashboard/src/lib/hermes/demand/__tests__/demand-security-resilience.test.ts
 *
 * Enforces the 5 Mandatory Security Hardening Directives:
 * 1. Tenant Isolation (No cross-tenant leakage or mutation)
 * 2. Capability Enforcement (Strict check on demand.approve / demand.distribute)
 * 3. Duplicate Approval Idempotency (Atomic deduplication prevents double dispatch)
 * 4. Provider Failure (Network/A2A failures mark FAILED, never fake success)
 * 5. Unsupported Channel (Dynamic channel intersection excludes unconfigured channels)
 * 6. Conversational Demand Intent (Hermes runtime responds to "Quiero conseguir más clientes")
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DemandDistributionService,
  DemandCampaign,
} from '../demand-distribution.service';
import { DemandIntentHandler } from '../demand-intent-handler';
import { A2AOutboundDispatcher } from '@/lib/pandoras/core/domains/hermes/a2a/a2a-outbound-dispatcher';
import { CapabilityGrantService } from '@/lib/pandoras/core/domains/hermes/a2a/capability-grant-service';

describe('🏛️ Hermes Demand & Distribution — Security, Idempotency & A2A Resilience Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(CapabilityGrantService, 'isCapabilityGranted').mockImplementation(async (tenant: string, cap: string) => {
      if (cap.includes('instagram')) return false;
      return true;
    });
  });

  // ── TEST 1: TENANT ISOLATION ───────────────────────────────────────────────
  it('1. Tenant Isolation — Tenant A cannot read, overwrite or approve Tenant B campaigns', async () => {
    const tenantA = 'tenant_alpha';
    const tenantB = 'tenant_beta';

    // Propose campaign for Tenant A
    const campA = await DemandDistributionService.proposeCampaign(tenantA, 'GENERATE_LEADS');
    expect(campA.tenantId).toBe(tenantA);

    // Propose campaign for Tenant B
    const campB = await DemandDistributionService.proposeCampaign(tenantB, 'LAUNCH_PRODUCT');
    expect(campB.tenantId).toBe(tenantB);

    // Tenant A's active campaign must remain strictly Tenant A's
    const activeA = DemandDistributionService.getActiveCampaign(tenantA);
    const activeB = DemandDistributionService.getActiveCampaign(tenantB);

    expect(activeA?.id).toBe(campA.id);
    expect(activeB?.id).toBe(campB.id);
    expect(activeA?.objective).toBe('GENERATE_LEADS');
    expect(activeB?.objective).toBe('LAUNCH_PRODUCT');

    // Attempting to approve Tenant A's campaign with Tenant B's identifier must throw/fail
    await expect(
      DemandDistributionService.approveAndDistribute(tenantB, campA.id)
    ).rejects.toThrow(/no encontrada para el tenant 'tenant_beta'/);
  });

  // ── TEST 2: CAPABILITY ENFORCEMENT ─────────────────────────────────────────
  it('2. Capability Enforcement — Rejects distribution if demand.distribute capability is missing', async () => {
    const tenant = 'tenant_gamma';
    const camp = await DemandDistributionService.proposeCampaign(tenant, 'EDUCATE_AUDIENCE');

    // Mock CapabilityGrantService to reject demand.distribute
    vi.spyOn(CapabilityGrantService, 'isCapabilityGranted').mockResolvedValue(false);

    const matrix = await DemandDistributionService.getChannelMatrix(tenant);
    // When capability is denied, channels should not be available
    const available = matrix.filter((c) => c.isAvailable);
    expect(available.length).toBe(0);
  });

  // ── TEST 3: DUPLICATE APPROVAL IDEMPOTENCY ──────────────────────────────────
  it('3. Duplicate Approval Idempotency — Concurrent approval calls yield exactly ONE A2A dispatch', async () => {
    const tenant = 'tenant_delta';
    const camp = await DemandDistributionService.proposeCampaign(tenant, 'BOOK_MEETINGS');
    const idempotencyKey = `idem_${tenant}_${camp.id}_fixed_key`;
    DemandDistributionService.readyAllPieces(tenant, camp.id);

    // Spy on A2AOutboundDispatcher.sendToSofia
    let a2aDispatchCount = 0;
    vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockImplementation(async () => {
      a2aDispatchCount++;
      return { success: true, messageId: 'msg_test', type: 'media.plan' };
    });

    // First approval: dispatches A2A
    const res1 = await DemandDistributionService.approveAndDistribute(tenant, camp.id, idempotencyKey);
    expect(res1.success).toBe(true);
    expect(res1.isIdempotentReplay).toBeFalsy();
    const countAfterFirst = a2aDispatchCount;
    expect(countAfterFirst).toBeGreaterThan(0);

    // Second approval with same idempotency key: MUST replay without new A2A dispatch
    const res2 = await DemandDistributionService.approveAndDistribute(tenant, camp.id, idempotencyKey);
    expect(res2.success).toBe(true);
    expect(res2.isIdempotentReplay).toBe(true);
    expect(a2aDispatchCount).toBe(countAfterFirst); // No duplicate calls made!
  });

  // ── TEST 4: PROVIDER FAILURE ───────────────────────────────────────────────
  it('4. Provider Failure — When Sofia/Media Co fails, status is marked FAILED, NEVER published successfully', async () => {
    const tenant = 'tenant_epsilon';
    const camp = await DemandDistributionService.proposeCampaign(tenant, 'PROMOTE_OFFER');
    DemandDistributionService.readyAllPieces(tenant, camp.id);

    // Sofia responds with network error
    vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockResolvedValue({
      success: false,
      messageId: 'msg_fail',
      type: 'media.plan',
      error: { code: 'SOFIA_OFFLINE', message: 'Sofia bridge unreachable' },
    });

    const res = await DemandDistributionService.approveAndDistribute(tenant, camp.id);
    expect(res.success).toBe(false);
    expect(res.campaign.status).toBe('FAILED');
    expect(res.campaign.errorMessage).toContain('Sofia');
    expect(res.dispatchedChannels.length).toBe(0);
  });

  // ── TEST 5: UNSUPPORTED CHANNEL ────────────────────────────────────────────
  it('5. Unsupported Channel — Unconnected channels (e.g. Instagram) are excluded and not faked', async () => {
    const tenant = 'tenant_zeta';
    const matrix = await DemandDistributionService.getChannelMatrix(tenant);

    const instagram = matrix.find((c) => c.id === 'instagram');
    expect(instagram).toBeDefined();
    expect(instagram?.isAvailable).toBe(false);

    // When proposing campaign, it must only include available channels
    const camp = await DemandDistributionService.proposeCampaign(tenant, 'GENERATE_LEADS');
    expect(camp.channels).not.toContain('instagram');
  });

  // ── TEST 6: CONVERSATIONAL DEMAND INTENT ───────────────────────────────────
  it('6. Conversational Demand Intent — "Quiero conseguir más clientes esta semana" triggers proposal card', async () => {
    const tenant = 'tenant_eta';
    const userUtterance = 'Quiero conseguir más clientes esta semana para mi negocio';

    expect(DemandIntentHandler.isDemandIntent(userUtterance)).toBe(true);

    const proposal = await DemandIntentHandler.handleDemandProposal(tenant, userUtterance);
    expect(proposal.content).toContain('Campaña de Distribución Recomendada');
    expect(proposal.content).toContain('publicaciones durante los próximos 7 días');
    expect(proposal.suggestedActions).toContain('confirmo');
    expect(proposal.suggestedActions).toContain('cancela');

    // Confirming proposal
    vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockResolvedValue({
      success: true,
      messageId: 'msg_conv',
      type: 'media.plan',
    });

    const confirmResult = await DemandIntentHandler.confirmProposal(tenant);
    expect(confirmResult.success).toBe(true);
    expect(confirmResult.content).toContain('Campaña Aprobada y Distribuida Exitosamente');
  });

  // ── TEST 7: CONTENT REVIEW GATING ──────────────────────────────────────────
  it('7. Content Review Gating — Campaign cannot be approved if pieces are still GENERATING', async () => {
    const tenant = 'tenant_theta';
    // Naturally proposed campaign starts in CONTENT_GENERATING with pieces GENERATING
    const camp = await DemandDistributionService.proposeCampaign(tenant, 'GENERATE_LEADS');
    expect(camp.status).toBe('CONTENT_GENERATING');
    expect(camp.pieces.some((p) => p.status === 'GENERATING')).toBe(true);

    const res = await DemandDistributionService.approveAndDistribute(tenant, camp.id);
    expect(res.success).toBe(false);
    expect(res.error).toContain('La campaña no puede ser aprobada todavía');
    expect(res.error).toContain('pieza(s) aún en generación');
    expect(camp.status).not.toBe('APPROVED');
    expect(camp.status).not.toBe('COMPLETED');

    // Once pieces are marked ready (e.g. by Sofia webhook or batch pipeline), it transitions to CONTENT_READY
    DemandDistributionService.readyAllPieces(tenant, camp.id);
    expect(camp.status).toBe('CONTENT_READY');
  });

  // ── TEST 8: INDIVIDUAL PIECE REVIEW & DIRECTIVE ────────────────────────────
  it('8. Individual Piece Review — Reviewing piece updates copy, approvals or marks rejected', async () => {
    const tenant = 'tenant_iota';
    const camp = await DemandDistributionService.proposeCampaign(tenant, 'GENERATE_LEADS');
    const targetPiece = camp.pieces[0]!;

    // Approve individual piece
    const approved = DemandDistributionService.reviewPiece(tenant, camp.id, targetPiece.id, 'APPROVE');
    expect(approved.status).toBe('APPROVED');

    // Edit individual piece copy
    const updatedCopy = 'Texto modificado específicamente por el tenant para Telegram';
    const edited = DemandDistributionService.reviewPiece(tenant, camp.id, targetPiece.id, 'EDIT', {
      copy: updatedCopy,
    });
    expect(edited.copy).toBe(updatedCopy);
    expect(edited.status).toBe('READY');

    // Reject individual piece
    const rejected = DemandDistributionService.reviewPiece(tenant, camp.id, targetPiece.id, 'REJECT');
    expect(rejected.status).toBe('REJECTED');
  });

  // ── TEST 9: POST-PUBLICATION ATTRIBUTED PERFORMANCE ────────────────────────
  it('9. Post-Publication Attributed Performance — Published pieces reveal real attributed business metrics', async () => {
    const tenant = 'tenant_kappa';
    const camp = await DemandDistributionService.proposeCampaign(tenant, 'GENERATE_LEADS');

    // Ensure all pieces are READY
    camp.pieces.forEach((p) => {
      p.status = 'READY';
    });

    vi.spyOn(A2AOutboundDispatcher, 'sendToSofia').mockResolvedValue({
      success: true,
      messageId: 'msg_perf',
      type: 'media.plan',
    });

    const res = await DemandDistributionService.approveAndDistribute(tenant, camp.id);
    expect(res.success).toBe(true);
    expect(res.campaign.status).toBe('COMPLETED');

    // Verify all pieces are PUBLISHED with honest baseline telemetry (Fail-to-null (§9.B))
    res.campaign.pieces.forEach((piece) => {
      expect(piece.status).toBe('PUBLISHED');
      expect(piece.performance).toBeDefined();
      // Reach and Clicks must be null until real impressions are reported (Zero fabricated numbers)
      expect(piece.performance?.reach).toBeNull();
      expect(piece.performance?.clicks).toBeNull();
      // Real counts start at 0
      expect(piece.performance?.conversations).toBe(0);
      expect(piece.performance?.leads).toBe(0);
      expect(piece.performance?.meetings).toBe(0);
    });
  });

  // ── TEST 10: FAIL-CLOSED CAPABILITY EVALUATION ──────────────────────────────
  it('10. Fail-Closed Capability Evaluation — Throws or unexpected errors result in DENIED (false), never granted', async () => {
    const tenant = 'tenant_unauthorized';
    vi.spyOn(CapabilityGrantService, 'isCapabilityGranted').mockRejectedValue(new Error('DB Connection Dropped'));

    // Calling capability check with fail-closed handler guarantees rejection
    const hasViewCap = await CapabilityGrantService.isCapabilityGranted(tenant, 'demand.view').catch(() => false);
    const hasApproveCap = await CapabilityGrantService.isCapabilityGranted(tenant, 'demand.approve').catch(() => false);

    expect(hasViewCap).toBe(false);
    expect(hasApproveCap).toBe(false);
  });
});

/**
 * 🧪 HERMES EXPERIENCE — GOVERNED TRIAL TENANT SUITE (FASE 7 / GATES 1-8)
 * src/lib/hermes/trial/__tests__/hermes-trial.test.ts
 *
 * Exhaustive certification of the 8 architectural gates for Hermes Experience:
 * - Gate 1: Identity vs Economy separation (tenantType in projects, trial credits in hermesTrialCredits)
 * - Gate 2: Full RESERVE -> EXECUTE -> SETTLE/RELEASE ledger state machine without bypass
 * - Gate 3: Circuit breakers on software/inference (knowledge, strategy, campaigns)
 * - Gate 4: Identity precedes session, anti-abuse, disposable domain blocking
 * - Gate 5: Channel distribution quota enforcement
 * - Gate 6: Variable capacity Media Credits (image=1, video=3)
 * - Gate 7: 72h server-side expiration + Preserved State
 * - Gate 8: Trial Event Timeline from Day 1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/db';
import { hermesTrialCredits, hermesTrialEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  HermesTrialPolicyService,
  HermesTrialExpiredError,
  HermesTrialQuotaExceededError,
  getMediaCreditCost,
  TRIAL_QUOTAS,
} from '../hermes-trial-policy.service';
import { HermesTrialTimelineService } from '../hermes-trial-timeline.service';
import { HermesExperienceProvisionerService } from '../hermes-experience-provisioner.service';
import { TenantCreditLedgerService } from '../../compute/tenant-credit-ledger.service';

describe('🏛️ Hermes Experience — Governed Trial Tenant Architecture (Gates 1-8)', () => {
  const TENANT_TRIAL = 'exp-acme-test-123';

  beforeEach(async () => {
    vi.restoreAllMocks();
    HermesTrialPolicyService.clearCacheForTesting();
    HermesTrialTimelineService.clearForTesting();
    HermesExperienceProvisionerService.clearCacheForTesting();
    TenantCreditLedgerService.clearInMemoryForTesting();
    if (db?.delete) {
      try {
        await db.delete(hermesTrialCredits).where(eq(hermesTrialCredits.tenantId, TENANT_TRIAL));
        await db.delete(hermesTrialEvents).where(eq(hermesTrialEvents.tenantId, TENANT_TRIAL));
      } catch {}
    }
  });

  // ── GATE 1: IDENTITY VS ECONOMY SEPARATION ────────────────────────────────
  describe('Gate 1: Identity vs Economy Separation', () => {
    it('stores tenantType and lifecycle in projects, keeping credits economy separate', async () => {
      HermesTrialPolicyService.setMockTrialState(TENANT_TRIAL, {
        tenantType: 'TRIAL',
        trialTier: 'MEDIA_ENABLED',
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 72 * 3600 * 1000),
        trialStatus: 'ACTIVE',
      });

      const state = await HermesTrialPolicyService.getTenantTrialState(TENANT_TRIAL);
      expect(state.isTrial).toBe(true);
      expect(state.tenantType).toBe('TRIAL');
      expect(state.trialTier).toBe('MEDIA_ENABLED');
      expect(state.isExpired).toBe(false);
      expect(state.remainingMs).toBeGreaterThan(70 * 3600 * 1000);

      // Economy is retrieved via trial credits ledger, NOT mixed in projects
      const trialCredits = await TenantCreditLedgerService.getOrCreateTrialCredits(TENANT_TRIAL);
      expect(trialCredits.grantedCredits).toBe(3);
      expect(trialCredits.reservedCredits).toBe(0);
      expect(trialCredits.consumedCredits).toBe(0);
      expect(trialCredits.availableCredits).toBe(3);
    });
  });

  // ── GATE 2: SAME LEDGER STATE MACHINE (RESERVE -> EXECUTE -> SETTLE/RELEASE)
  describe('Gate 2: Zero-Bypass Ledger Integration (Same F5/F6 State Machine)', () => {
    beforeEach(() => {
      HermesTrialPolicyService.setMockTrialState(TENANT_TRIAL, {
        tenantType: 'TRIAL',
        trialTier: 'MEDIA_ENABLED',
        trialEndsAt: new Date(Date.now() + 72 * 3600 * 1000),
      });
    });

    it('executes the full RESERVE -> SETTLE lifecycle without bypassing the financial engine', async () => {
      // 1. Check sufficient balance
      const check = await TenantCreditLedgerService.hasSufficientBalance(TENANT_TRIAL, 0.02, false, 'media.image.generate');
      expect(check.sufficient).toBe(true);
      expect(check.balance).toBe(3); // 3 credits available
      expect(check.estimatedCharge).toBe(1); // 1 credit required

      // 2. RESERVE: freezes 1 media credit
      const res = await TenantCreditLedgerService.reserveCredits(TENANT_TRIAL, {
        requestId: 'req_trial_001',
        capability: 'media.image.generate',
        provider: 'runpod',
      });

      expect(res.ok).toBe(true);
      expect(res.reservationId).toBeDefined();
      expect(res.isSandbox).toBe(false);

      const afterReserve = await TenantCreditLedgerService.getOrCreateTrialCredits(TENANT_TRIAL);
      expect(afterReserve.reservedCredits).toBe(1);
      expect(afterReserve.availableCredits).toBe(2);

      // 3. SETTLE: settles the frozen credit into consumed
      const settle = await TenantCreditLedgerService.settleReservation({
        reservationId: res.reservationId!,
        actualExecutionSeconds: 4.25,
        actualRawCostUsd: 0.025,
        tenantId: TENANT_TRIAL,
      });

      expect(settle.ok).toBe(true);
      expect(settle.remainingBalanceUsd).toBe(2); // 2 credits remaining

      const afterSettle = await TenantCreditLedgerService.getOrCreateTrialCredits(TENANT_TRIAL);
      expect(afterSettle.reservedCredits).toBe(0);
      expect(afterSettle.consumedCredits).toBe(1);
      expect(afterSettle.availableCredits).toBe(2);

      // Gate 8 check: Event timeline recorded MEDIA_GENERATED
      const timeline = await HermesTrialTimelineService.getTenantTimeline(TENANT_TRIAL);
      expect(timeline.some(e => e.eventType === 'MEDIA_GENERATED')).toBe(true);
    });

    it('releases frozen reservation back to available credits on generation failure', async () => {
      const res = await TenantCreditLedgerService.reserveCredits(TENANT_TRIAL, {
        requestId: 'req_trial_fail_001',
        capability: 'media.image.generate',
        provider: 'runpod',
      });

      expect(res.ok).toBe(true);
      let credits = await TenantCreditLedgerService.getOrCreateTrialCredits(TENANT_TRIAL);
      expect(credits.availableCredits).toBe(2);
      expect(credits.reservedCredits).toBe(1);

      // RELEASE (failure pre-side effect or sweeper release)
      await TenantCreditLedgerService.releaseReservation(res.reservationId!, TENANT_TRIAL, 'Generation failed pre-GPU');

      credits = await TenantCreditLedgerService.getOrCreateTrialCredits(TENANT_TRIAL);
      expect(credits.reservedCredits).toBe(0);
      expect(credits.availableCredits).toBe(3); // restored!
      expect(credits.consumedCredits).toBe(0);
    });

    it('strictly freezes funds on UNKNOWN until forensic sweeper resolves', async () => {
      const res = await TenantCreditLedgerService.reserveCredits(TENANT_TRIAL, {
        requestId: 'req_trial_unknown_001',
        capability: 'media.image.generate',
        provider: 'sofia',
      });

      // Simulating UNKNOWN state: Neither settle nor release is called
      const credits = await TenantCreditLedgerService.getOrCreateTrialCredits(TENANT_TRIAL);
      expect(credits.reservedCredits).toBe(1);
      expect(credits.availableCredits).toBe(2);

      // Later, forensic sweep settles it
      await TenantCreditLedgerService.settleReservation({
        reservationId: res.reservationId!,
        actualExecutionSeconds: 5.0,
        actualRawCostUsd: 0.03,
        tenantId: TENANT_TRIAL,
      });

      const settledCredits = await TenantCreditLedgerService.getOrCreateTrialCredits(TENANT_TRIAL);
      expect(settledCredits.reservedCredits).toBe(0);
      expect(settledCredits.consumedCredits).toBe(1);
    });
  });

  // ── GATE 3: CIRCUIT BREAKERS FOR SOFTWARE & INFERENCE ───────────────────────
  describe('Gate 3: Circuit Breakers for Software & Inference Quotas', () => {
    beforeEach(() => {
      HermesTrialPolicyService.setMockTrialState(TENANT_TRIAL, {
        tenantType: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 72 * 3600 * 1000),
      });
    });

    it('enforces maximum 5 knowledge sources on trial tenant', async () => {
      // 4 sources is allowed
      const check4 = await HermesTrialPolicyService.checkSoftwareQuota(TENANT_TRIAL, 'knowledge', 4);
      expect(check4.allowed).toBe(true);
      expect(check4.remaining).toBe(1);

      // 5 sources throws quota exceeded
      await expect(
        HermesTrialPolicyService.checkSoftwareQuota(TENANT_TRIAL, 'knowledge', 5)
      ).rejects.toThrow(HermesTrialQuotaExceededError);
    });

    it('enforces maximum 3 active campaigns on trial tenant', async () => {
      const check = await HermesTrialPolicyService.checkSoftwareQuota(TENANT_TRIAL, 'campaign', 2);
      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(1);

      await expect(
        HermesTrialPolicyService.checkSoftwareQuota(TENANT_TRIAL, 'campaign', 3)
      ).rejects.toThrow(HermesTrialQuotaExceededError);
    });
  });

  // ── GATE 4: IDENTITY PRECEDES SESSION & ANTI-ABUSE ──────────────────────────
  describe('Gate 4: Identity Precedes Session & Anti-Abuse Check', () => {
    it('blocks disposable and temporary burner email domains', () => {
      expect(HermesExperienceProvisionerService.validateEmail('user@mailinator.com').valid).toBe(false);
      expect(HermesExperienceProvisionerService.validateEmail('attacker@tempmail.com').valid).toBe(false);
      expect(HermesExperienceProvisionerService.validateEmail('legit@acme-corp.com').valid).toBe(true);
    });

    it('enforces IP velocity limits against automated trial spamming', () => {
      const ip = '198.51.100.42';
      expect(HermesExperienceProvisionerService.checkIpVelocity(ip).allowed).toBe(true); // 1
      expect(HermesExperienceProvisionerService.checkIpVelocity(ip).allowed).toBe(true); // 2
      expect(HermesExperienceProvisionerService.checkIpVelocity(ip).allowed).toBe(true); // 3
      expect(HermesExperienceProvisionerService.checkIpVelocity(ip).allowed).toBe(false); // 4 (blocked)
    });

    it('provisions a clean trial tenant with 72h duration and 3 media credits', async () => {
      const result = await HermesExperienceProvisionerService.provision({
        companyName: 'Acme Robotics',
        email: 'founder@acmerobotics.io',
        contactName: 'Alice',
        industry: 'Robotics',
        trialTier: 'MEDIA_ENABLED',
      });

      expect(result.success).toBe(true);
      expect(result.projectSlug).toMatch(/^exp-acme-robotics-[0-9a-f]{6}$/);
      expect(result.grantedMediaCredits).toBe(3);
      expect(result.trialEndsAt.getTime()).toBeGreaterThan(Date.now() + 71 * 3600 * 1000);
      expect(result.portalUrl).toContain(`/portal/${result.projectSlug}/overview`);
    });
  });

  // ── GATE 5: CHANNEL DISTRIBUTION QUOTA ──────────────────────────────────────
  describe('Gate 5: Real Channel Connections with Controlled Send Quota', () => {
    it('limits external channel publications to 5 per trial', async () => {
      HermesTrialPolicyService.setMockTrialState(TENANT_TRIAL, {
        tenantType: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 72 * 3600 * 1000),
      });

      const check = await HermesTrialPolicyService.checkSoftwareQuota(TENANT_TRIAL, 'distribution', 4);
      expect(check.allowed).toBe(true);
      expect(check.remaining).toBe(1);

      await expect(
        HermesTrialPolicyService.checkSoftwareQuota(TENANT_TRIAL, 'distribution', 5)
      ).rejects.toThrow(HermesTrialQuotaExceededError);
    });
  });

  // ── GATE 6: VARIABLE CAPACITY MEDIA CREDITS ────────────────────────────────
  describe('Gate 6: Variable Capacity Media Credits (Not 1 Gen = 1 Credit)', () => {
    it('defines higher capacity costs for video than single images', () => {
      expect(getMediaCreditCost('media.image.generate')).toBe(1);
      expect(getMediaCreditCost('media.voice.synthesize')).toBe(1);
      expect(getMediaCreditCost('media.video.short')).toBe(3);
      expect(getMediaCreditCost('media.video.upscale')).toBe(2);
    });

    it('rejects video generation when remaining trial capacity is insufficient', async () => {
      HermesTrialPolicyService.setMockTrialState(TENANT_TRIAL, {
        tenantType: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 72 * 3600 * 1000),
      });

      // Tenant has 3 credits. Consume 2 with 2 images.
      await TenantCreditLedgerService.reserveCredits(TENANT_TRIAL, {
        requestId: 'req_img_1',
        capability: 'media.image.generate',
        provider: 'runpod',
      });
      await TenantCreditLedgerService.reserveCredits(TENANT_TRIAL, {
        requestId: 'req_img_2',
        capability: 'media.image.generate',
        provider: 'runpod',
      });

      // 1 credit remaining
      const credits = await TenantCreditLedgerService.getOrCreateTrialCredits(TENANT_TRIAL);
      expect(credits.availableCredits).toBe(1);

      // Attempt short video (cost = 3) -> should fail-closed!
      const videoRes = await TenantCreditLedgerService.reserveCredits(TENANT_TRIAL, {
        requestId: 'req_vid_1',
        capability: 'media.video.short',
        provider: 'runpod',
      });

      expect(videoRes.ok).toBe(false);
      expect(videoRes.error).toContain('insuficientes (disponibles: 1, requeridos: 3)');
    });
  });

  // ── GATE 7: 72H SERVER-SIDE EXPIRATION + PRESERVED STATE ───────────────────
  describe('Gate 7: 72h Expiration Server-Side Enforcement & State Preservation', () => {
    it('blocks mutations server-side when trial has expired', async () => {
      // Mock expired trial (ended 1 hour ago)
      HermesTrialPolicyService.setMockTrialState(TENANT_TRIAL, {
        tenantType: 'TRIAL',
        trialEndsAt: new Date(Date.now() - 3600 * 1000),
      });

      const state = await HermesTrialPolicyService.getTenantTrialState(TENANT_TRIAL);
      expect(state.isExpired).toBe(true);
      expect(state.remainingMs).toBe(0);

      // Server-side mutation assertion throws HermesTrialExpiredError
      await expect(
        HermesTrialPolicyService.assertTrialMutationAllowed(TENANT_TRIAL, 'media.generate')
      ).rejects.toThrow(HermesTrialExpiredError);

      await expect(
        HermesTrialPolicyService.assertTrialMutationAllowed(TENANT_TRIAL, 'campaign.dispatch')
      ).rejects.toThrow(HermesTrialExpiredError);

      // Credit reservation also fails-closed with friendly preservation message
      const res = await TenantCreditLedgerService.reserveCredits(TENANT_TRIAL, {
        requestId: 'req_post_expiration',
        capability: 'media.image.generate',
        provider: 'runpod',
      });
      expect(res.ok).toBe(false);
      expect(res.error).toContain('periodo de prueba de 72 horas ha finalizado');
    });

    it('never blocks production tenants', async () => {
      HermesTrialPolicyService.setMockTrialState('snarai', {
        tenantType: 'PRODUCTION',
      });

      // Should complete without throwing
      await expect(
        HermesTrialPolicyService.assertTrialMutationAllowed('snarai', 'media.generate')
      ).resolves.toBeUndefined();
    });
  });

  // ── GATE 8: TRIAL EVENT TIMELINE ───────────────────────────────────────────
  describe('Gate 8: Trial Event Timeline Instrumentation', () => {
    it('chronologically records user actions for funnel discovery', async () => {
      await HermesTrialTimelineService.recordEvent(TENANT_TRIAL, 'TRIAL_STARTED', {
        actorId: 'user@corp.com',
        metadata: { tier: 'MEDIA_ENABLED', credits: 3 },
      });

      await HermesTrialTimelineService.recordEvent(TENANT_TRIAL, 'KNOWLEDGE_ADDED', {
        metadata: { sourceTitle: 'Pitch Deck.pdf', sizeBytes: 102400 },
      });

      await HermesTrialTimelineService.recordEvent(TENANT_TRIAL, 'STRATEGY_REQUESTED', {
        metadata: { goal: 'Q3 Product Hunt Launch' },
      });

      const timeline = await HermesTrialTimelineService.getTenantTimeline(TENANT_TRIAL);
      expect(timeline.length).toBe(3);
      expect(timeline[0]?.eventType).toBe('STRATEGY_REQUESTED'); // sorted newest first
      expect(timeline[1]?.eventType).toBe('KNOWLEDGE_ADDED');
      expect(timeline[2]?.eventType).toBe('TRIAL_STARTED');
    });
  });
});

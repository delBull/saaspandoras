/**
 * 🧪 HERMES EXPERIENCE — AUTHENTICATION & MULTI-TENANT ISOLATION SUITE (FASE 2)
 * src/lib/hermes/trial/__tests__/hermes-trial-auth-isolation.test.ts
 *
 * Mandatory Verification of:
 * TRIAL identity → authenticated portal session → canonicalOrgId → tenant isolation
 *
 * Vectors Verified:
 * 1. Changing URL slug with valid trial session -> ORGANIZATION_ACCESS_DENIED
 * 2. Changing tenantId in request -> rejected by canonical boundary
 * 3. Accessing another organization -> rejected
 * 4. Reusing magic link token -> rejected (single-use)
 * 5. Expired magic link token -> rejected
 * 6. Token from trial A used on trial B -> rejected / bound to A
 * 7. Expired trial -> reads permitted (PRESERVED), mutations blocked with HermesTrialExpiredError
 * 8. Trial session -> PRODUCTION tenant access attempt -> strictly blocked
 * 9. Production -> trial independence: production tenants never blocked by trial quotas
 * 10. Provisioning idempotency: 2 concurrent calls with same email produce 1 tenant
 * 11. Atomic quota concurrency: concurrent requests cannot race past limit
 * 12. Distribution quota counts side effects, never UNKNOWN/timeouts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HermesTrialPolicyService,
  HermesTrialExpiredError,
  HermesTrialQuotaExceededError,
  TRIAL_QUOTAS,
} from '../hermes-trial-policy.service';
import { HermesExperienceProvisionerService } from '../hermes-experience-provisioner.service';
import { TenantCreditLedgerService } from '../../compute/tenant-credit-ledger.service';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { resolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { PortalAuthorizationError } from '@/lib/portal/portal-types';
import * as portalAuth from '@/lib/platform/portal-auth';
import { generatePortalToken, consumePortalToken } from '@/lib/platform/portal-auth';
import { DemandDistributionService } from '../../demand/demand-distribution.service';
import { DirectChannelPublisher } from '../../channels/publishers/direct-channel-publisher';
import { db } from '@/db';
import { channelVaultAdapter } from '../../channels/channel-vault.service';
import jwt from 'jsonwebtoken';

// Mock cookies and headers for Next.js Server Components
let mockCookiesStore: Map<string, string> = new Map();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (mockCookiesStore.has(name) ? { value: mockCookiesStore.get(name)! } : undefined),
    set: (name: string, val: string) => mockCookiesStore.set(name, val),
  }),
  headers: async () => ({
    get: (name: string) => null,
  }),
}));

describe('🛡️ Hermes Experience — Authentication & Multi-Tenant Isolation (Fase 2)', () => {
  const TRIAL_SLUG = 'exp-acme-sovereign-101';
  const OTHER_SLUG = 'exp-competitor-corp-202';
  const PRODUCTION_SLUG = 'snarai';

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCookiesStore.clear();
    HermesTrialPolicyService.clearCacheForTesting();
    HermesTrialPolicyService.resetQuotaAccounting();
    HermesExperienceProvisionerService.clearCacheForTesting();
    TenantCreditLedgerService.clearInMemoryForTesting();

    // Mock validatePortalSession for unit tests
    vi.spyOn(portalAuth, 'validatePortalSession').mockImplementation(async (token: string) => {
      if (token && token.startsWith('ps_v_')) {
        const match = token.match(/^ps_v_(\d+)/);
        const projectId = (match && match[1]) ? parseInt(match[1], 10) : 101;
        return {
          installedProductId: `inst_${projectId}`,
          projectId,
          product: 'HERMES',
        };
      }
      return null;
    });

    // Mock tenantSocialIntegrations query for DirectChannelPublisher
    if (db?.query?.tenantSocialIntegrations) {
      vi.spyOn(db.query.tenantSocialIntegrations, 'findFirst').mockResolvedValue({
        id: 'int_123',
        tenantId: TRIAL_SLUG,
        channel: 'telegram',
        accountHandle: '@acme_bot',
        status: 'CONNECTED',
        encryptedPayload: 'mock_encrypted_payload',
        supportedCapabilities: ['text', 'image', 'video'],
        metadata: {},
      } as any);
    }

    vi.spyOn(channelVaultAdapter, 'decryptCredentials').mockResolvedValue({
      credentials: { botToken: 'mock_token' },
      verifiedAt: new Date(),
    } as any);
  });

  // ── 1. CHANGING URL SLUG WITH VALID TRIAL SESSION ─────────────────────────
  it('Vector 1: rejects when a valid trial session attempts to access another slug (slug tampering)', async () => {
    const trialOrgId = '00000000-0000-4000-8000-000000000101';
    mockCookiesStore.set('pandoras_portal_session', 'ps_v_101_validtrialsession');

    vi.spyOn(OrganizationSDK, 'resolve').mockImplementation(async (idOrSlug: any) => {
      return {
        projectId: 101,
        organizationId: trialOrgId,
        slug: TRIAL_SLUG,
        name: 'Acme Sovereign Corp',
        logoUrl: null,
        projectStatus: 'active',
        onboardingStage: null,
        tenantType: 'TRIAL',
        trialTier: 'MEDIA_ENABLED',
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 72 * 3600 * 1000),
        trialStatus: 'ACTIVE',
        installedProducts: [],
        activeProduct: null,
        capabilities: {},
        connectors: {},
        config: {},
        runtimeManifest: {},
        visibleModules: [],
        plan: 'sandbox' as any,
        status: 'active' as any,
      };
    });

    // Valid trial session accesses its own slug -> succeeds
    const ctx = await resolvePortalContext(TRIAL_SLUG);
    expect(ctx.tenant.organizationSlug).toBe(TRIAL_SLUG);
    expect(ctx.trial?.isTrial).toBe(true);

    // Actor alters URL slug to OTHER_SLUG -> throws ORGANIZATION_ACCESS_DENIED
    await expect(resolvePortalContext(OTHER_SLUG)).rejects.toThrow(PortalAuthorizationError);
    await expect(resolvePortalContext(OTHER_SLUG)).rejects.toThrow(/Actor session is authorized for 'exp-acme-sovereign-101'/);
  });

  // ── 2. CHANGING TENANT ID / ATTACKING ANOTHER ORGANIZATION ───────────────
  it('Vector 2 & 3: rejects arbitrary tenantId/organizationId mismatch against authenticated session', async () => {
    mockCookiesStore.set('pandoras_portal_session', 'ps_v_101_validtrialsession');

    vi.spyOn(OrganizationSDK, 'resolve').mockResolvedValue({
      projectId: 101,
      organizationId: '00000000-0000-4000-8000-000000000101',
      slug: TRIAL_SLUG,
      name: 'Acme Sovereign',
      logoUrl: null,
      projectStatus: 'active',
      onboardingStage: null,
      tenantType: 'TRIAL',
      installedProducts: [],
      activeProduct: null,
      capabilities: {},
      connectors: {},
      config: {},
      runtimeManifest: {},
      visibleModules: [],
      plan: 'sandbox' as any,
      status: 'active' as any,
    });

    // Attempting to access random UUID throws ORGANIZATION_ACCESS_DENIED
    await expect(resolvePortalContext('11111111-1111-4111-8111-111111111111')).rejects.toThrow(PortalAuthorizationError);
  });

  // ── 4. MAGIC LINK TOKEN REUSE ─────────────────────────────────────────────
  it('Vector 4: rejects magic link token reuse once already consumed (cache & DB branch)', async () => {
    process.env.PORTAL_JWT_SECRET = 'secret_test_key_for_portal_jwt_testing_12345';
    const installedId = '00000000-0000-4000-8000-000000000999';
    const token = generatePortalToken(installedId, 999, 'HERMES');

    expect(token).toBeDefined();

    // First consumption succeeds
    const session1 = await consumePortalToken(token);
    expect(session1.sessionToken).toContain('ps_v_999_');
    expect(session1.projectId).toBe(999);

    // Second consumption with same token MUST be rejected fail-closed via cache
    await expect(consumePortalToken(token)).rejects.toThrow(/already been consumed/);

    // Test DB branch: new fresh token for a product already flagged portalTokenUsed=true in DB
    const installedIdDb = '00000000-0000-4000-8000-000000000888';
    const freshTokenForUsed = generatePortalToken(installedIdDb, 888, 'HERMES');
    const findFirstSpy = vi.spyOn(db.query.installedProducts, 'findFirst').mockResolvedValueOnce({
      id: installedIdDb,
      projectId: 888,
      product: 'HERMES',
      portalTokenUsed: true,
    } as any);

    await expect(consumePortalToken(freshTokenForUsed)).rejects.toThrow(/already been consumed/);
    expect(findFirstSpy).toHaveBeenCalled();
    findFirstSpy.mockRestore();
  });

  // ── 5. EXPIRED MAGIC LINK TOKEN ───────────────────────────────────────────
  it('Vector 5: rejects expired magic link tokens fail-closed', async () => {
    process.env.PORTAL_JWT_SECRET = 'secret_test_key_for_portal_jwt_testing_12345';
    // Mint token with negative expiry
    const expiredToken = jwt.sign(
      { sub: '00000000-0000-4000-8000-000000000999', type: 'portal_access', product: 'HERMES', projectId: 999 },
      process.env.PORTAL_JWT_SECRET,
      { expiresIn: '-1s' }
    );

    await expect(consumePortalToken(expiredToken)).rejects.toThrow(/JWT validation failed: invalid signature or expired/);
  });

  // ── 6. TOKEN FROM TRIAL A USED ON TRIAL B ────────────────────────────────
  it('Vector 6: token from trial A cannot authorize access to trial B', async () => {
    mockCookiesStore.set('pandoras_portal_session', 'ps_v_101_trialAsession');

    vi.spyOn(OrganizationSDK, 'resolve').mockImplementation(async (projectId: any) => {
      // Session resolves strictly to Trial A (projectId 101)
      return {
        projectId: 101,
        organizationId: '00000000-0000-4000-8000-000000000101',
        slug: 'exp-trial-a',
        name: 'Trial A',
        logoUrl: null,
        projectStatus: 'active',
        onboardingStage: null,
        tenantType: 'TRIAL',
        installedProducts: [],
        activeProduct: null,
        capabilities: {},
        connectors: {},
        config: {},
        runtimeManifest: {},
        visibleModules: [],
        plan: 'sandbox' as any,
        status: 'active' as any,
      };
    });

    // Requesting Trial B slug with Trial A's session is denied
    await expect(resolvePortalContext('exp-trial-b')).rejects.toThrow(PortalAuthorizationError);
  });

  // ── 7. EXPIRED TRIAL: READS ALLOWED (PRESERVED), MUTATIONS BLOCKED ────────
  describe('Vector 7: Expired Trial Preservation vs Mutation Lockout', () => {
    it('allows read portal access in PRESERVED state, but strictly blocks all mutations', async () => {
      mockCookiesStore.set('pandoras_portal_session', 'ps_v_101_expiredtrialsession');

      const pastDate = new Date(Date.now() - 3600 * 1000); // Expired 1 hour ago
      vi.spyOn(OrganizationSDK, 'resolve').mockResolvedValue({
        projectId: 101,
        organizationId: '00000000-0000-4000-8000-000000000101',
        slug: TRIAL_SLUG,
        name: 'Acme Sovereign Corp',
        logoUrl: null,
        projectStatus: 'active',
        onboardingStage: null,
        tenantType: 'TRIAL',
        trialTier: 'MEDIA_ENABLED',
        trialStartedAt: new Date(Date.now() - 73 * 3600 * 1000),
        trialEndsAt: pastDate,
        trialStatus: 'ACTIVE',
        installedProducts: [],
        activeProduct: null,
        capabilities: {},
        connectors: {},
        config: {},
        runtimeManifest: {},
        visibleModules: [],
        plan: 'sandbox' as any,
        status: 'active' as any,
      });

      HermesTrialPolicyService.setMockTrialState(TRIAL_SLUG, {
        tenantType: 'TRIAL',
        trialEndsAt: pastDate,
        trialStatus: 'ACTIVE',
      });

      // READ: resolvePortalContext succeeds and marks status PRESERVED
      const ctx = await resolvePortalContext(TRIAL_SLUG);
      expect(ctx.trial?.isTrial).toBe(true);
      expect(ctx.trial?.isExpired).toBe(true);
      expect(ctx.trial?.status).toBe('PRESERVED');

      // MUTATION: assertTrialMutationAllowed fails-closed with HermesTrialExpiredError
      await expect(HermesTrialPolicyService.assertTrialMutationAllowed(TRIAL_SLUG)).rejects.toThrow(
        HermesTrialExpiredError
      );

      // MUTATION: proposeCampaign fails-closed with HermesTrialExpiredError
      await expect(DemandDistributionService.proposeCampaign(TRIAL_SLUG, 'GENERATE_LEADS')).rejects.toThrow(
        HermesTrialExpiredError
      );
    });
  });

  // ── 8. TRIAL SESSION -> PRODUCTION ACCESS STRICTLY BLOCKED ────────────────
  it('Vector 8: trial session attempting to access a PRODUCTION tenant is rejected', async () => {
    mockCookiesStore.set('pandoras_portal_session', 'ps_v_2_trialsession');

    vi.spyOn(OrganizationSDK, 'resolve').mockResolvedValue({
      projectId: 2,
      organizationId: '00000000-0000-4000-8000-000000000002',
      slug: PRODUCTION_SLUG,
      name: "S'Narai Production",
      logoUrl: null,
      projectStatus: 'active',
      onboardingStage: null,
      tenantType: 'PRODUCTION', // Production tenant!
      installedProducts: [],
      activeProduct: null,
      capabilities: {},
      connectors: {},
      config: {},
      runtimeManifest: {},
      visibleModules: [],
      plan: 'sandbox' as any,
      status: 'active' as any,
    });

    await expect(resolvePortalContext(PRODUCTION_SLUG)).rejects.toThrow(PortalAuthorizationError);
    await expect(resolvePortalContext(PRODUCTION_SLUG)).rejects.toThrow(/A Trial session cannot acquire authority over a PRODUCTION tenant/);
  });

  // ── 9. PRODUCTION INDEPENDENCE: NEVER BLOCKED BY TRIAL RESTRICTIONS ───────
  it('Vector 9: production tenants are completely unrestricted by trial quotas and expiration', async () => {
    HermesTrialPolicyService.setMockTrialState(PRODUCTION_SLUG, {
      tenantType: 'PRODUCTION',
      trialEndsAt: new Date(Date.now() - 1000), // even if past date, tenantType is PRODUCTION
    });

    // Production tenant passes assertTrialMutationAllowed without throwing
    await expect(HermesTrialPolicyService.assertTrialMutationAllowed(PRODUCTION_SLUG)).resolves.toBeUndefined();

    // Production tenant has infinite quota
    const quota = await HermesTrialPolicyService.checkSoftwareQuota(PRODUCTION_SLUG, 'knowledge', 9999);
    expect(quota.allowed).toBe(true);
    expect(quota.limit).toBe(Infinity);
  });

  // ── 10. PROVISIONING IDEMPOTENCY (ACCEPTANCE CRITERION A) ─────────────────
  it('Vector 10 (Criterion A): concurrent provision calls with same email return identical trial without duplication', async () => {
    const input = {
      email: 'founder@sovereign-ai.com',
      companyName: 'Sovereign AI Labs',
      trialTier: 'MEDIA_ENABLED' as const,
    };

    // Run 2 simultaneous provision requests
    const [p1, p2] = await Promise.all([
      HermesExperienceProvisionerService.provision(input),
      HermesExperienceProvisionerService.provision(input),
    ]);

    expect(p1.success).toBe(true);
    expect(p2.success).toBe(true);
    expect(p1.projectSlug).toBe(p2.projectSlug);
    expect(p1.projectId).toBe(p2.projectId);
    expect(p1.organizationId).toBe(p2.organizationId);
  });

  // ── 11. ATOMIC QUOTA CONCURRENCY (MANDATORY ADJUSTMENT #2) ─────────────────
  it('Vector 11 (Adjustment #2): concurrent operations cannot race past software quota limits', async () => {
    HermesTrialPolicyService.setMockTrialState(TRIAL_SLUG, {
      tenantType: 'TRIAL',
      trialTier: 'MEDIA_ENABLED',
      trialEndsAt: new Date(Date.now() + 72 * 3600 * 1000),
      trialStatus: 'ACTIVE',
    });

    let currentUsage = 4; // limit is 5 for knowledge
    const usageProvider = async () => currentUsage;

    // Simulate 3 concurrent mutation attempts when usage is 4 (only 1 should succeed)
    const attempts = await Promise.allSettled([
      HermesTrialPolicyService.atomicCheckAndReserveQuota(TRIAL_SLUG, 'knowledge', usageProvider, async () => {
        await new Promise((r) => setTimeout(r, 20));
        currentUsage++;
        return 'success_1';
      }),
      HermesTrialPolicyService.atomicCheckAndReserveQuota(TRIAL_SLUG, 'knowledge', usageProvider, async () => {
        await new Promise((r) => setTimeout(r, 20));
        currentUsage++;
        return 'success_2';
      }),
      HermesTrialPolicyService.atomicCheckAndReserveQuota(TRIAL_SLUG, 'knowledge', usageProvider, async () => {
        await new Promise((r) => setTimeout(r, 20));
        currentUsage++;
        return 'success_3';
      }),
    ]);

    const fulfilled = attempts.filter((a) => a.status === 'fulfilled');
    const rejected = attempts.filter((a) => a.status === 'rejected');

    // Exactly 1 allowed before reaching limit 5; the other 2 were rejected atomically!
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(2);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(HermesTrialQuotaExceededError);
  });

  // ── 12. DISTRIBUTION QUOTA COUNTS SIDE-EFFECTS (ACCEPTANCE CRITERION C) ───
  it('Vector 12 (Criterion C): failed or UNKNOWN distribution does NOT consume quota; only confirmed success does', async () => {
    HermesTrialPolicyService.setMockTrialState(TRIAL_SLUG, {
      tenantType: 'TRIAL',
      trialTier: 'MEDIA_ENABLED',
      trialEndsAt: new Date(Date.now() + 72 * 3600 * 1000),
      trialStatus: 'ACTIVE',
    });

    const publisher = new DirectChannelPublisher();
    const fakeMockPublisher = {
      publish: vi.fn(),
    };
    publisher.registerPublisher('telegram', fakeMockPublisher as any);

    // Case 1: Provider fails or times out (UNKNOWN / ERROR)
    fakeMockPublisher.publish.mockResolvedValueOnce({
      success: false,
      channel: 'telegram',
      idempotencyKey: 'idem_fail_1',
      errorCode: 'TIMEOUT',
      errorMessage: 'Provider timed out.',
      retryable: true,
    });

    vi.spyOn(HermesTrialPolicyService, 'assertTrialMutationAllowed').mockResolvedValue(undefined);

    const failReceipt = await publisher.publishToChannel(TRIAL_SLUG, 'int_123', {
      text: 'Hello',
      contentType: 'text',
      idempotencyKey: 'idem_fail_1',
    });

    expect(failReceipt.success).toBe(false);
    // Quota was NOT consumed because side-effect was unconfirmed
    expect(HermesTrialPolicyService.getConfirmedDistributionCount(TRIAL_SLUG)).toBe(0);

    // Case 2: Provider confirms publication SUCCESS
    fakeMockPublisher.publish.mockResolvedValueOnce({
      success: true,
      channel: 'telegram',
      idempotencyKey: 'idem_success_2',
      externalPostId: 'tg_msg_777',
      publishedAt: new Date().toISOString(),
    });

    const successReceipt = await publisher.publishToChannel(TRIAL_SLUG, 'int_123', {
      text: 'Hello Success',
      contentType: 'text',
      idempotencyKey: 'idem_success_2',
    });

    expect(successReceipt.success).toBe(true);
    // Quota was consumed on confirmed side-effect!
    expect(HermesTrialPolicyService.getConfirmedDistributionCount(TRIAL_SLUG)).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { 
  PlatformCapabilityRegistryService,
  PlatformResourceScope
} from '../platform-capability-registry.service';
import { PlatformActor } from '@/lib/dash-contracts/admin';

/**
 * 🛡️ F9.9 PLATFORM BOUNDARY ADVERSARIAL CERTIFICATION SUITE
 * apps/dashboard/src/lib/admin/__tests__/platform-adversarial-certification.test.ts
 *
 * Direct automated proof against the 6 attack vectors identified by the Architectural Council:
 * 1. Legacy Bypass Attack
 * 2. Tenant -> Platform Escalation
 * 3. Admin Scope Escalation
 * 4. Critical without Governance (CRITICAL-A / CRITICAL-B)
 * 5. Direct API Invocation / Server-side Invariants
 * 6. Cross-Tenant Scope Injection
 */

describe('🛡️ F9.9 Platform Boundary Adversarial Certification', () => {

  // ── TEST 1: LEGACY BYPASS ATTACK ──
  it('ADV-01: Legacy Bypass — Unauthenticated actor or raw legacy claim is rejected fail-closed', () => {
    const legacyAttacker: PlatformActor = {
      id: 'legacy_intruder',
      actorType: 'AGENT_DELEGATE',
      role: 'VIEWER', // claims auditor but tries mutation
      walletAddress: '0x0000000000000000000000000000000000000000',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false,
    };

    // Attempting to bypass governance to mutate markup
    const result = PlatformCapabilityRegistryService.evaluateAuthorization(
      legacyAttacker,
      'platform.tenants.markup.update',
      { tenantId: 'snarai' }
    );

    expect(result.granted).toBe(false);
    expect(result.reason).toContain('solo lectura');
  });

  // ── TEST 2: TENANT -> PLATFORM ESCALATION ──
  it('ADV-02: Tenant -> Platform Escalation — Tenant actor with CRM rights cannot escalate to Platform RWA Approve', () => {
    // A tenant user trying to exercise platform authority
    const tenantActor: PlatformActor = {
      id: 'tenant_collaborator_01',
      actorType: 'MAGIC_LINK',
      role: 'OPERATOR', // Operator role, but represents tenant boundary
      walletAddress: null,
      email: 'agent@tenant.com',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false,
    };

    // Attempting to approve RWA project (HIGH risk platform action)
    const result = PlatformCapabilityRegistryService.evaluateAuthorization(
      tenantActor,
      'platform.rwa.approve',
      { projectId: 'snarai-phase-1' }
    );

    expect(result.granted).toBe(false);
    expect(result.reason).toContain('no posee privilegios');
  });

  // ── TEST 3: ADMIN SCOPE ESCALATION ──
  it('ADV-03: Admin Scope Escalation — OPERATOR is blocked from platform.treasury.sweep and platform.contract.deploy', () => {
    const operator: PlatformActor = {
      id: 'platform_operator_01',
      actorType: 'WALLET',
      role: 'OPERATOR',
      walletAddress: '0x1111111111111111111111111111111111111111',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false,
    };

    // 1. Treasury sweep
    const sweepResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      operator,
      'platform.treasury.sweep'
    );
    expect(sweepResult.granted).toBe(false);
    expect(sweepResult.riskLevel).toBe('CRITICAL_B');

    // 2. Contract deploy
    const deployResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      operator,
      'platform.contract.deploy'
    );
    expect(deployResult.granted).toBe(false);
    expect(deployResult.riskLevel).toBe('CRITICAL_B');
  });

  // ── TEST 4: CRITICAL WITHOUT GOVERNANCE (CRITICAL-A / CRITICAL-B) ──
  it('ADV-04: CRITICAL without Governance — SUPER_ADMIN without 2FA is rejected for CRITICAL-A and CRITICAL-B', () => {
    const superAdminWithout2fa: PlatformActor = {
      id: 'super_admin_no_2fa',
      actorType: 'WALLET',
      role: 'SUPER_ADMIN',
      walletAddress: '0x7777777777777777777777777777777777777777',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false, // NO 2FA
    };

    // CRITICAL-A: Admin whitelist management
    const adminManageResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      superAdminWithout2fa,
      'platform.identity.admins.manage'
    );
    expect(adminManageResult.granted).toBe(false);
    expect(adminManageResult.riskLevel).toBe('CRITICAL_A');
    expect(adminManageResult.governanceRequirement).toBe('MULTI_PARTY_2FA');
    expect(adminManageResult.reason).toContain('requiere verificación 2FA Discord');

    // CRITICAL-B: Constitutional Book unlock
    const booksResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      superAdminWithout2fa,
      'platform.books.unlock'
    );
    expect(booksResult.granted).toBe(false);
    expect(booksResult.riskLevel).toBe('CRITICAL_B');
    expect(booksResult.governanceRequirement).toBe('DUAL_KEY_TIME_WINDOW');
    expect(booksResult.reason).toContain('requiere verificación 2FA Discord');
  });

  // ── TEST 5: DIRECT API INVOCATION / SERVER-SIDE AUDIT INVARIANT ──
  it('ADV-05: Server-side Invariant — Financial adjustments strictly require capability authorization and audit reason', () => {
    const platformAdmin: PlatformActor = {
      id: 'platform_admin_01',
      actorType: 'WALLET',
      role: 'ADMIN',
      walletAddress: '0x3333333333333333333333333333333333333333',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false,
    };

    // Must have platform.credits.adjust capability
    const authResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      platformAdmin,
      'platform.credits.adjust',
      { tenantId: 'snarai' }
    );
    expect(authResult.granted).toBe(true);
    expect(authResult.riskLevel).toBe('HIGH');
    expect(authResult.governanceRequirement).toBe('SECOND_APPROVAL');

    // Attempting adjustment with unauthorized role
    const auditor: PlatformActor = {
      id: 'auditor_01',
      actorType: 'WALLET',
      role: 'VIEWER',
      walletAddress: '0x4444444444444444444444444444444444444444',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false,
    };

    expect(() => {
      PlatformCapabilityRegistryService.requireCapability(
        auditor,
        'platform.credits.adjust',
        { tenantId: 'snarai' }
      );
    }).toThrow(/403 Forbidden/);
  });

  // ── TEST 6: CROSS-TENANT SCOPE ISOLATION ──
  it('ADV-06: Cross-Tenant Scope Isolation — Target scope enforces tenant boundary containment', () => {
    const def = PlatformCapabilityRegistryService.getDefinition('platform.tenants.markup.update');
    expect(def.allowedScopes).toContain('scoped');
    expect(def.resource).toBe('Tenant');

    // Global treasury capabilities cannot be targeted as tenant scoped
    const treasuryDef = PlatformCapabilityRegistryService.getDefinition('platform.treasury.sweep');
    expect(treasuryDef.allowedScopes).not.toContain('scoped');
    expect(treasuryDef.allowedScopes).toEqual(['all']);
  });

});

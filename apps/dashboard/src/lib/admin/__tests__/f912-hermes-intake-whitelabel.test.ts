import { describe, it, expect } from 'vitest';
import { PlatformCapabilityRegistryService } from '../platform-capability-registry.service';
import { PlatformActor } from '@/lib/dash-contracts/admin';
import { HQProvisioningHandoffService } from '../hq-provisioning-handoff.service';

describe('🛡️ F9.12 HQ Commercial Plane Certification', () => {

  // ── TEST 1: AGENT DELEGATE RESTRICTIONS ──
  it('F912-01: AGENT_DELEGATE is allowed to perform hq.crm.outreach but denied HIGH risk actions', () => {
    const delegateAttacker: PlatformActor = {
      id: 'hermes_worker',
      role: 'SUPER_ADMIN', // Even if role says SUPER_ADMIN
      actorType: 'AGENT_DELEGATE', // The critical differentiator
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false
    };

    // Should ALLOW outreach (MEDIUM risk)
    const outreachResult = PlatformCapabilityRegistryService.evaluateAuthorization(delegateAttacker, 'hq.crm.outreach', 'all');
    expect(outreachResult.granted).toBe(true);

    // Should DENY Whitelabel (HIGH risk)
    const whitelabelResult = PlatformCapabilityRegistryService.evaluateAuthorization(delegateAttacker, 'admin.whitelabel', 'all');
    expect(whitelabelResult.granted).toBe(false);
    expect(whitelabelResult.reason).toContain('prohibida la ejecución de capacidades HIGH');
  });

  // ── TEST 2: WHITELABEL 2FA REQUIREMENT ──
  it('F912-02: Whitelabel modification requires REINFORCED_AUTH (2FA) for ADMIN', () => {
    const adminWithout2FA: PlatformActor = {
      id: 'human_admin',
      role: 'PLATFORM_ADMIN',
      actorType: 'MAGIC_LINK',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false
    };

    const adminWith2FA: PlatformActor = {
      id: 'human_admin',
      role: 'PLATFORM_ADMIN',
      actorType: 'MAGIC_LINK',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: true
    };

    // Should DENY because Whitelabel is HIGH and requires REINFORCED_AUTH which translates to 2FA for ADMIN
    const resultWithout2FA = PlatformCapabilityRegistryService.evaluateAuthorization(adminWithout2FA, 'admin.whitelabel', 'all');
    expect(resultWithout2FA.granted).toBe(false);

    // Should ALLOW because 2FA is present
    const resultWith2FA = PlatformCapabilityRegistryService.evaluateAuthorization(adminWith2FA, 'admin.whitelabel', 'all');
    expect(resultWith2FA.granted).toBe(true);
  });

  // ── TEST 3: ISOLATED COMMERCIAL ROLES ──
  it('F912-03: HQ CRM capabilities are allowed for ADMINs without 2FA', () => {
    const salesAdmin: PlatformActor = {
      id: 'sales_rep',
      role: 'PLATFORM_ADMIN',
      actorType: 'MAGIC_LINK',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false
    };

    const classifyResult = PlatformCapabilityRegistryService.evaluateAuthorization(salesAdmin, 'hq.crm.classify', 'all');
    expect(classifyResult.granted).toBe(true);

    const enrichResult = PlatformCapabilityRegistryService.evaluateAuthorization(salesAdmin, 'hq.crm.enrich', 'all');
    expect(enrichResult.granted).toBe(true);
  });

  // ── TEST 4: DOMAIN SEPARATION: CRM vs INTEGRATION vs OPERATIONS ──
  it('F912-04: Clean Domain Boundary — Provisioning is CRITICAL_B and strictly barred from CRM Agents', async () => {
    const agentActor: PlatformActor = {
      id: 'hermes_agent',
      role: 'SUPER_ADMIN',
      actorType: 'AGENT_DELEGATE',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false
    };

    // Agent cannot execute ops.tenant.provision
    const agentProvisionEval = PlatformCapabilityRegistryService.evaluateAuthorization(
      agentActor,
      'ops.tenant.provision',
      'all'
    );
    expect(agentProvisionEval.granted).toBe(false);

    // Handoff service throws if agent attempts provisioning
    await expect(
      HQProvisioningHandoffService.initiateProvisioningHandoff(
        agentActor,
        'mock-lead-id',
        'tenant-slug',
        'Tenant Title'
      )
    ).rejects.toThrow(/Unauthorized/);

    // Human PLATFORM_ADMIN cannot execute ops.tenant.provision (CRITICAL_B is SUPER_ADMIN only)
    const humanAdmin: PlatformActor = {
      id: 'human_admin',
      role: 'PLATFORM_ADMIN',
      actorType: 'MAGIC_LINK',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: true
    };
    const adminProvisionEval = PlatformCapabilityRegistryService.evaluateAuthorization(
      humanAdmin,
      'ops.tenant.provision',
      'all'
    );
    expect(adminProvisionEval.granted).toBe(false);
    expect(adminProvisionEval.reason).toContain('es exclusiva de SUPER_ADMIN');

    // Super Admin WITH 2FA CAN authorize ops.tenant.provision
    const superAdminWith2FA: PlatformActor = {
      id: 'super_admin',
      role: 'SUPER_ADMIN',
      actorType: 'MAGIC_LINK',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: true
    };
    const superAdminProvisionEval = PlatformCapabilityRegistryService.evaluateAuthorization(
      superAdminWith2FA,
      'ops.tenant.provision',
      'all'
    );
    expect(superAdminProvisionEval.granted).toBe(true);
  });

  // ── TEST 5: INTEGRATION DOMAIN (DEVELOPER HUB KEYS) ──
  it('F912-05: Integration Keys — Reading keys is MEDIUM (allowed for ADMIN), Managing keys is HIGH (requires 2FA)', () => {
    const adminWithout2FA: PlatformActor = {
      id: 'admin_dev',
      role: 'PLATFORM_ADMIN',
      actorType: 'MAGIC_LINK',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false
    };

    // Read keys in Developer Hub: ALLOWED for ADMIN without 2FA (MEDIUM risk)
    const readEval = PlatformCapabilityRegistryService.evaluateAuthorization(
      adminWithout2FA,
      'platform.integration.keys.read',
      'all'
    );
    expect(readEval.granted).toBe(true);

    // Manage/Rotate keys: DENIED without 2FA (HIGH risk)
    const manageEvalWithout2FA = PlatformCapabilityRegistryService.evaluateAuthorization(
      adminWithout2FA,
      'platform.integration.keys.manage',
      'all'
    );
    expect(manageEvalWithout2FA.granted).toBe(false);

    // Manage/Rotate keys: ALLOWED with 2FA
    const adminWith2FA: PlatformActor = { ...adminWithout2FA, isDiscord2faVerified: true };
    const manageEvalWith2FA = PlatformCapabilityRegistryService.evaluateAuthorization(
      adminWith2FA,
      'platform.integration.keys.manage',
      'all'
    );
    expect(manageEvalWith2FA.granted).toBe(true);
  });

});

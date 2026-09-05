/**
 * 🧪 TESTS: PLATFORM CAPABILITY REGISTRY & AUTHORIZATION ENGINE (F9.2)
 * apps/dashboard/src/lib/admin/__tests__/platform-capability-registry.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  PlatformCapabilityRegistryService,
  PlatformCapability,
} from '../platform-capability-registry.service';
import { PlatformActor } from '@/lib/dash-contracts/admin';

describe('PlatformCapabilityRegistryService (F9.2)', () => {
  const superAdminWith2fa: PlatformActor = {
    id: 'actor_super_1',
    actorType: 'WALLET',
    role: 'SUPER_ADMIN',
    walletAddress: '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: true,
  };

  const superAdminWithout2fa: PlatformActor = {
    ...superAdminWith2fa,
    id: 'actor_super_2',
    isDiscord2faVerified: false,
  };

  const platformAdmin: PlatformActor = {
    id: 'actor_admin_1',
    actorType: 'WALLET',
    role: 'ADMIN',
    walletAddress: '0x1111111111111111111111111111111111111111',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: false,
  };

  const operator: PlatformActor = {
    id: 'actor_operator_1',
    actorType: 'MAGIC_LINK',
    role: 'OPERATOR',
    email: 'operator@pandoras.finance',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: false,
  };

  const auditor: PlatformActor = {
    id: 'actor_auditor_1',
    actorType: 'WALLET',
    role: 'VIEWER',
    walletAddress: '0x2222222222222222222222222222222222222222',
    sessionStartedAt: new Date().toISOString(),
    isDiscord2faVerified: false,
  };

  it('PCAP-01: Catalog contains exactly 13 canonical platform capabilities', () => {
    const all = PlatformCapabilityRegistryService.getAllDefinitions();
    expect(all.length).toBe(13);
  });

  it('PCAP-02: SUPER_ADMIN with 2FA has authority over all capabilities including CRITICAL (A and B)', () => {
    const criticalCaps: PlatformCapability[] = [
      'platform.contract.deploy',
      'platform.treasury.sweep',
      'platform.identity.admins.manage',
      'platform.books.unlock',
    ];

    for (const cap of criticalCaps) {
      const result = PlatformCapabilityRegistryService.evaluateAuthorization(superAdminWith2fa, cap);
      expect(result.granted).toBe(true);
      expect(result.riskLevel.startsWith('CRITICAL')).toBe(true);
      expect(
        result.governanceRequirement === 'MULTI_PARTY_2FA' || 
        result.governanceRequirement === 'DUAL_KEY_TIME_WINDOW'
      ).toBe(true);
    }
  });

  it('PCAP-03: SUPER_ADMIN without 2FA is rejected for CRITICAL actions requiring 2FA', () => {
    const result = PlatformCapabilityRegistryService.evaluateAuthorization(
      superAdminWithout2fa,
      'platform.treasury.sweep'
    );
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('2FA Discord previa');
  });

  it('PCAP-04: ADMIN can execute LOW, MEDIUM, and HIGH but NOT CRITICAL', () => {
    // LOW
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(platformAdmin, 'platform.tenants.read').granted
    ).toBe(true);

    // MEDIUM
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(
        platformAdmin,
        'platform.tenants.markup.update'
      ).granted
    ).toBe(true);

    // HIGH
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(platformAdmin, 'platform.tenants.suspend').granted
    ).toBe(true);

    // CRITICAL is blocked
    const criticalResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      platformAdmin,
      'platform.contract.deploy'
    );
    expect(criticalResult.granted).toBe(false);
    expect(criticalResult.reason).toContain('exclusiva de SUPER_ADMIN');
  });

  it('PCAP-05: OPERATOR is restricted to designated LOW and MEDIUM capabilities', () => {
    // Permitted
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(operator, 'platform.tenants.read').granted
    ).toBe(true);
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(operator, 'platform.tenants.markup.update')
        .granted
    ).toBe(true);

    // Forbidden HIGH
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(operator, 'platform.tenants.suspend').granted
    ).toBe(false);

    // Forbidden CRITICAL
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(operator, 'platform.treasury.sweep').granted
    ).toBe(false);
  });

  it('PCAP-06: VIEWER has read-only access (LOW) and is blocked for any mutation (MEDIUM, HIGH, CRITICAL)', () => {
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(auditor, 'platform.treasury.read').granted
    ).toBe(true);
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(auditor, 'platform.security.audit').granted
    ).toBe(true);

    // Blocked
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(auditor, 'platform.tenants.markup.update')
        .granted
    ).toBe(false);
    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(auditor, 'platform.credits.adjust').granted
    ).toBe(false);
  });

  it('PCAP-07: requireCapability throws fail-closed error when unauthorized', () => {
    expect(() => {
      PlatformCapabilityRegistryService.requireCapability(auditor, 'platform.tenants.suspend');
    }).toThrowError(/403 Forbidden/);
  });
});

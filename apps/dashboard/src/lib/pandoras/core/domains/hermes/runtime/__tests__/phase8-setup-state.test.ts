/**
 * 🧪 Phase 8.2 Invariant Test Suite: Setup State & Activation Progress
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/__tests__/phase8-setup-state.test.ts
 */

import { describe, it, expect } from 'vitest';
import { SetupProgressService } from '@/lib/mesh/setup-progress.service';

describe('🏛️ Phase 8.2 Invariant Test Suite: Setup State & Activation Progress', () => {
  it('SETUP-01: Returns zeroed empty summary when organization project is not found', async () => {
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
    };

    const service = new SetupProgressService(mockDb);
    const summary = await service.getEcosystemSetupState('non_existent_tenant');

    expect(summary.organizationSlug).toBe('non_existent_tenant');
    expect(summary.overallPercentage).toBe(0);
    expect(summary.totalActiveModules).toBe(0);
    expect(summary.modules).toEqual([]);
  });

  it('SETUP-02: Calculates Hermes AI and Growth OS progress with real signals', async () => {
    // 1. Mock project
    const mockProject = {
      id: 101,
      slug: 'snarai',
      applicantWalletAddress: '0x1234567890123456789012345678901234567890',
      applicantEmail: 'founder@snarai.com',
      website: 'https://snarai.com',
      treasuryAddress: '0xsafe1234567890',
      contractAddress: '0xcontract12345',
      deploymentStatus: 'deployed',
      extraConfig: { widgetEnabled: true, emailVerified: true },
    };

    // 2. Mock installed products (Hermes + Growth OS active)
    const mockInstalled = [
      { productFamily: 'HERMES', status: 'active', config: { persona: 'Real Estate AI', tone: 'formal' } },
      { productFamily: 'GROWTH_OS', status: 'active', config: {} },
    ];

    let callIndex = 0;
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => {
            callIndex++;
            if (callIndex === 1) {
              return {
                limit: () => Promise.resolve([mockProject]),
              };
            }
            if (callIndex === 2) {
              return Promise.resolve(mockInstalled);
            }
            if (callIndex === 3) {
              return Promise.resolve([{ count: 5 }]); // 5 docs in vault
            }
            if (callIndex === 4) {
              return Promise.resolve([{ count: 1 }]); // 1 bot
            }
            if (callIndex === 5) {
              return Promise.resolve([{ count: 12 }]); // 12 leads
            }
            return Promise.resolve([]);
          },
        }),
      }),
    };

    const service = new SetupProgressService(mockDb);
    const summary = await service.getEcosystemSetupState('snarai');

    expect(summary.organizationSlug).toBe('snarai');
    expect(summary.totalActiveModules).toBeGreaterThanOrEqual(2);

    const hermes = summary.modules.find((m) => m.productKey === 'HERMES');
    expect(hermes).toBeDefined();
    expect(hermes?.status).toBe('ACTIVE');
    expect(hermes?.progressPercentage).toBe(100); // Vault + Bot + Persona + Widget all true
    expect(hermes?.completedSteps).toBe(4);

    const growth = summary.modules.find((m) => m.productKey === 'GROWTH_OS');
    expect(growth).toBeDefined();
    expect(growth?.status).toBe('ACTIVE');
    expect(growth?.completedSteps).toBe(4); // Leads + Email + Treasury + Contract all true
    expect(growth?.progressPercentage).toBe(100);

    expect(summary.overallPercentage).toBe(75);
  });

  it('SETUP-03: Handles AVAILABLE module correctly without skewing active progress', async () => {
    const mockProject = {
      id: 202,
      slug: 'fresh_tenant',
      applicantWalletAddress: '0x9999999999999999999999999999999999999999',
      contractAddress: null,
    };

    // Only Hermes installed
    const mockInstalled = [
      { productFamily: 'HERMES', status: 'trial', config: {} },
    ];

    let callIndex = 0;
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => {
            callIndex++;
            if (callIndex === 1) return { limit: () => Promise.resolve([mockProject]) };
            if (callIndex === 2) return Promise.resolve(mockInstalled);
            if (callIndex === 3) return Promise.resolve([{ count: 0 }]); // 0 docs
            if (callIndex === 4) return Promise.resolve([{ count: 0 }]); // 0 bots
            if (callIndex === 5) return Promise.resolve([{ count: 0 }]); // 0 leads
            return Promise.resolve([]);
          },
        }),
      }),
    };

    const service = new SetupProgressService(mockDb);
    const summary = await service.getEcosystemSetupState('fresh_tenant');

    const hermes = summary.modules.find((m) => m.productKey === 'HERMES');
    const growth = summary.modules.find((m) => m.productKey === 'GROWTH_OS');
    const rwa = summary.modules.find((m) => m.productKey === 'PANDORAS_RWA');

    expect(hermes?.status).toBe('TRIAL');
    expect(hermes?.progressPercentage).toBe(0);

    expect(growth?.status).toBe('AVAILABLE');
    expect(growth?.progressPercentage).toBe(0);

    expect(rwa?.status).toBe('AVAILABLE');
    expect(rwa?.progressPercentage).toBe(0);

    expect(summary.totalActiveModules).toBe(1); // Only Hermes is active
  });

  it('SETUP-04: Every checklist item provides valid navigation URLs and action labels', async () => {
    const mockProject = { id: 303, slug: 'test_org' };
    const mockInstalled = [
      { productFamily: 'HERMES', status: 'active', config: {} },
      { productFamily: 'GROWTH_OS', status: 'active', config: {} },
    ];

    let callIndex = 0;
    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => {
            callIndex++;
            if (callIndex === 1) return { limit: () => Promise.resolve([mockProject]) };
            if (callIndex === 2) return Promise.resolve(mockInstalled);
            return Promise.resolve([{ count: 0 }]);
          },
        }),
      }),
    };

    const service = new SetupProgressService(mockDb);
    const summary = await service.getEcosystemSetupState('test_org');

    for (const mod of summary.modules) {
      expect(mod.checklist.length).toBe(4);
      for (const step of mod.checklist) {
        expect(step.id).toBeDefined();
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.actionUrl.startsWith('/')).toBe(true);
        expect(step.actionLabel.length).toBeGreaterThan(0);
      }
    }
  });
});

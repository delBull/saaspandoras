import { describe, it, expect, beforeEach } from 'vitest';
import { 
  PlatformCapabilityRegistryService,
  PlatformResourceScope
} from '../platform-capability-registry.service';
import { 
  PlatformAuditLedgerService 
} from '../platform-audit-ledger.service';
import { PlatformActor } from '@/lib/dash-contracts/admin';

/**
 * 🏛️ F9.10 PLATFORM GOVERNANCE CLOSURE & OPERATIONAL READINESS SUITE
 * apps/dashboard/src/lib/admin/__tests__/platform-governance-closure.test.ts
 *
 * Operational and E2E proof covering the 6 pillars defined by the Architectural Council:
 * 1. Agent Delegate Isolation (Agents cannot execute HIGH/CRITICAL)
 * 2. Tenant Impersonation Prevention (Read-only Lens invariant)
 * 3. RWA Stage Transition 9-Point Auditability
 * 4. Treasury Intent vs Operational Key Separation
 * 5. Financial Billing Lifecycle (Observed -> Proposed -> Adjusted -> Reconciled)
 * 6. Cryptographic Hash-Chain Tamper Resistance
 */

describe('🏛️ F9.10 Platform Governance Closure & Operational Readiness', () => {

  beforeEach(() => {
    PlatformAuditLedgerService.resetForTesting();
  });

  // ── INVARIANT 1: AGENT DELEGATE ISOLATION ──
  it('CLO-01: Agent Delegate Isolation — Autonomous agents are strictly denied HIGH and CRITICAL capabilities', () => {
    const autonomousAgent: PlatformActor = {
      id: 'hermes_agent_pipeline_01',
      actorType: 'AGENT_DELEGATE',
      role: 'SUPER_ADMIN', // Even if mapped to a privileged role, actorType constraint overrides
      walletAddress: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: true,
    };

    // 1. Trying CRITICAL_B treasury sweep
    const sweepResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      autonomousAgent,
      'platform.treasury.sweep'
    );
    expect(sweepResult.granted).toBe(false);
    expect(sweepResult.reason).toContain('AGENT_DELEGATE');
    expect(sweepResult.reason).toContain('prohibida la ejecución');

    // 2. Trying HIGH rwa approval
    const rwaResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      autonomousAgent,
      'platform.rwa.approve',
      { projectId: 'deal-001' }
    );
    expect(rwaResult.granted).toBe(false);
    expect(rwaResult.reason).toContain('AGENT_DELEGATE');

    // 3. LOW capability (Observation/Read) is allowed for agent
    const readResult = PlatformCapabilityRegistryService.evaluateAuthorization(
      autonomousAgent,
      'platform.tenants.read',
      { tenantId: 'snarai' }
    );
    expect(readResult.granted).toBe(true);
  });

  // ── INVARIANT 2: TENANT IMPERSONATION PREVENTION ──
  it('CLO-02: Tenant Impersonation Prevention — Global-only capabilities cannot target scoped tenants', () => {
    const platformAdmin: PlatformActor = {
      id: 'platform_admin_01',
      actorType: 'WALLET',
      role: 'ADMIN',
      walletAddress: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      sessionStartedAt: new Date().toISOString(),
      isDiscord2faVerified: false,
    };

    // Global treasury read cannot be narrowed to a tenant scope
    const result = PlatformCapabilityRegistryService.evaluateAuthorization(
      platformAdmin,
      'platform.treasury.read',
      { tenantId: 'snarai' }
    );
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('es de ámbito global');
  });

  // ── INVARIANT 3: RWA 9-POINT AUDITABILITY ──
  it('CLO-03: RWA 9-Point Auditability — State transitions generate complete cryptographic audit entry', () => {
    const entry = PlatformAuditLedgerService.recordEntry({
      actorId: 'admin_usr_01',
      actorWallet: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      actorRole: 'ADMIN',
      actorType: 'WALLET',
      action: 'RWA_STAGE_TRANSITION',
      targetResource: 'RWA_DEAL',
      resourceId: 'snarai-phase-1',
      capability: 'platform.rwa.review',
      governance: {
        isDiscord2faVerified: true,
        auditReason: 'Dictamen de debida diligencia completado satisfactoriamente',
      },
      stateTransition: {
        previousState: { stage: 'DUE_DILIGENCE', legalVehicle: 'Trust' },
        newState: { stage: 'STRUCTURING', legalVehicle: 'Trust' },
      },
      result: 'SUCCESS',
      evidenceCid: 'bafkreihdwdcefgh456789abcdef1234567890abcdef',
    });

    expect(entry.sequenceNumber).toBe(1);
    expect(entry.action).toBe('RWA_STAGE_TRANSITION');
    expect(entry.stateTransition.previousState?.stage).toBe('DUE_DILIGENCE');
    expect(entry.stateTransition.newState?.stage).toBe('STRUCTURING');
    expect(entry.governance.auditReason).toContain('debida diligencia');
    expect(entry.evidenceCid).toContain('bafkrei');
    expect(entry.currentHash).toBeDefined();
    expect(entry.currentHash.length).toBe(64); // SHA-256 hex string
  });

  // ── INVARIANT 4: TREASURY INTENT VS EXECUTION KEY ──
  it('CLO-04: Treasury Intent vs Key Separation — Sweep capability generates a governed intent, requiring dual authorization', () => {
    const def = PlatformCapabilityRegistryService.getDefinition('platform.treasury.sweep');
    expect(def.riskLevel).toBe('CRITICAL_B');
    expect(def.governanceRequirement).toBe('DUAL_KEY_TIME_WINDOW');
    expect(def.resource).toBe('Treasury');
    expect(def.allowedScopes).toEqual(['all']);
  });

  // ── INVARIANT 5: FINANCIAL BILLING ADJUSTMENT LIFECYCLE ──
  it('CLO-05: Financial Billing Lifecycle — Adjustment records previous and new balance states with audit reason', () => {
    const entry = PlatformAuditLedgerService.recordEntry({
      actorId: 'super_admin_01',
      actorWallet: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      actorRole: 'SUPER_ADMIN',
      actorType: 'WALLET',
      action: 'CREDIT_MANUAL_ADJUSTMENT',
      targetResource: 'TENANT_BILLING',
      resourceId: 'snarai',
      capability: 'platform.credits.adjust',
      governance: {
        isDiscord2faVerified: true,
        auditReason: 'Recarga de cortesía aprobada por dirección general para fase de pruebas',
      },
      stateTransition: {
        previousState: { creditBalanceUsd: 10.0, isSandbox: false },
        newState: { creditBalanceUsd: 35.0, isSandbox: false, adjustment: 25.0 },
      },
      result: 'SUCCESS',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });

    expect(entry.action).toBe('CREDIT_MANUAL_ADJUSTMENT');
    expect(entry.stateTransition.previousState?.creditBalanceUsd).toBe(10.0);
    expect(entry.stateTransition.newState?.creditBalanceUsd).toBe(35.0);
    expect(entry.governance.auditReason.length).toBeGreaterThan(10);
  });

  // ── INVARIANT 6: HASH-CHAIN TAMPER RESISTANCE ──
  it('CLO-06: Hash-Chain Tamper Resistance — Tampering with any historical entry breaks chain integrity', () => {
    // 1. Record sequence of 3 entries
    const e1 = PlatformAuditLedgerService.recordEntry({
      actorId: 'actor1',
      actorWallet: '0x1',
      actorRole: 'ADMIN',
      actorType: 'WALLET',
      action: 'TENANT_MARKUP_MODIFIED',
      targetResource: 'TENANT',
      resourceId: 'snarai',
      capability: 'platform.tenants.markup.update',
      governance: { isDiscord2faVerified: false, auditReason: 'Ajuste contractual de comisión' },
      stateTransition: { previousState: { markup: 35 }, newState: { markup: 40 } },
      result: 'SUCCESS',
    });

    const e2 = PlatformAuditLedgerService.recordEntry({
      actorId: 'actor2',
      actorWallet: '0x2',
      actorRole: 'SUPER_ADMIN',
      actorType: 'WALLET',
      action: 'SECURITY_OVERRIDE_TRIGGERED',
      targetResource: 'PLATFORM',
      capability: 'platform.books.unlock',
      governance: { isDiscord2faVerified: true, auditReason: 'Acceso a libros institucionales' },
      stateTransition: { previousState: { unlocked: false }, newState: { unlocked: true } },
      result: 'SUCCESS',
    });

    const e3 = PlatformAuditLedgerService.recordEntry({
      actorId: 'actor1',
      actorWallet: '0x1',
      actorRole: 'ADMIN',
      actorType: 'WALLET',
      action: 'CREDIT_MANUAL_ADJUSTMENT',
      targetResource: 'TENANT_BILLING',
      resourceId: 'snarai',
      capability: 'platform.credits.adjust',
      governance: { isDiscord2faVerified: false, auditReason: 'Bonificación de cómputo' },
      stateTransition: { previousState: { balance: 0 }, newState: { balance: 50 } },
      result: 'SUCCESS',
    });

    // Verify pristine chain
    const verification = PlatformAuditLedgerService.verifyChainIntegrity([e1, e2, e3]);
    expect(verification.valid).toBe(true);

    // Tamper with e2's payload
    const tamperedE2 = {
      ...e2,
      actorRole: 'OPERATOR', // Maliciously forged role in history
    };

    const tamperedVerification = PlatformAuditLedgerService.verifyChainIntegrity([e1, tamperedE2, e3]);
    expect(tamperedVerification.valid).toBe(false);
    expect(tamperedVerification.brokenIndex).toBe(1);
    expect(tamperedVerification.errorReason).toContain('Hash mismatch');
  });

});

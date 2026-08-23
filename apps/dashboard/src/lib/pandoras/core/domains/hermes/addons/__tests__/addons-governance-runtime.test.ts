/**
 * 🏛️ Hermes OS — Add-Ons Governance, Lifecycle & Runtime Certification
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/addons/__tests__/addons-governance-runtime.test.ts
 *
 * Tests:
 * 1. Global Catalog & Add-On Registry (AddOnRegistryService)
 * 2. Add-On Activation, Dual-Write, and Symmetric Audit Trail
 * 3. ContextMerger Runtime Injection (Capabilities, Style Overlays, Diagnostics)
 * 4. Multi-Tenant Isolation & Boundary Invariants
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db } from '@/db';
import { hermesAddons, hermesAddonInstallations, hermesAddonAudit } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { AddOnRegistryService } from '../registry';
import { CANONICAL_ADDONS, ensureCanonicalAddOnsRegistered, activateTenantAddOn } from '../catalog';
import { AddOnInstallationManager } from '../installation-manager';
import { CognitiveContextBuilder } from '../context-merger';
import { HermesAddOnManifest } from '../contracts';

describe('Hermes OS — Add-Ons Governance, Lifecycle & Runtime Certification', () => {
  const TEST_TENANT_A = `test_addon_tenant_a_${Date.now()}`;
  const TEST_TENANT_B = `test_addon_tenant_b_${Date.now()}`;

  beforeEach(async () => {
    // Ensure catalog is loaded
    await ensureCanonicalAddOnsRegistered();
  });

  afterAll(async () => {
    // Clean up test tenant installations and audits
    await db
      .delete(hermesAddonInstallations)
      .where(
        or(
          eq(hermesAddonInstallations.organizationId, TEST_TENANT_A),
          eq(hermesAddonInstallations.organizationId, TEST_TENANT_B)
        )
      );

    await db
      .delete(hermesAddonAudit)
      .where(
        or(
          eq(hermesAddonAudit.organizationId, TEST_TENANT_A),
          eq(hermesAddonAudit.organizationId, TEST_TENANT_B)
        )
      );
  });

  // ─── SUITE 1: CATALOG & REGISTRY ──────────────────────────────────────────

  it('ADDON-001: Registers and verifies all canonical Add-Ons in the global catalog', async () => {
    const available = await AddOnRegistryService.getAvailableAddOns();
    expect(available.length).toBeGreaterThanOrEqual(CANONICAL_ADDONS.length);

    const vipFamily = await AddOnRegistryService.getAddOn('vip_family_concierge');
    expect(vipFamily).toBeDefined();
    expect(vipFamily?.name).toContain('VIP Family Concierge');
    expect(vipFamily?.status).toBe('AVAILABLE');
    expect(vipFamily?.capabilities.length).toBe(4);

    const familyOffice = await AddOnRegistryService.getAddOn('family_office_succession');
    expect(familyOffice).toBeDefined();
    expect(familyOffice?.type).toBe('COMPOSITE');
    expect(familyOffice?.capabilities.some(c => c.id === 'family_office_governance')).toBe(true);

    const referralTrust = await AddOnRegistryService.getAddOn('referral_trust_solution');
    expect(referralTrust).toBeDefined();
    expect(referralTrust?.type).toBe('JOURNEY_PACK');
  });

  it('ADDON-002: Rejects installation of deprecated or non-existent Add-Ons', async () => {
    expect(async () => {
      await AddOnRegistryService.validateAddOnAvailability('non_existent_addon_xyz');
    }).toThrow(/not found in the Registry/);

    const mockDeprecated: HermesAddOnManifest = {
      id: `deprecated_addon_${Date.now()}`,
      name: 'Old Module',
      version: '0.1.0',
      type: 'CAPABILITY',
      description: 'Deprecated test addon',
      capabilities: [],
      governanceRequirements: { requiresHumanApproval: false },
      compatibility: { minHermesVersion: '1.0.0' },
      status: 'DEPRECATED',
    };

    await AddOnRegistryService.register(mockDeprecated);

    expect(async () => {
      await AddOnRegistryService.validateAddOnAvailability(mockDeprecated.id);
    }).toThrow(/is DEPRECATED and cannot be installed/);
  });

  // ─── SUITE 2: LIFECYCLE & SYMMETRIC AUDIT ─────────────────────────────────

  it('ADDON-003: Activates an Add-On and emits an immutable ACTIVATED audit record', async () => {
    await activateTenantAddOn(TEST_TENANT_A, 'vip_family_concierge', {
      installedBy: 'test_admin_user',
      configuration: { referralMode: 'PRIVATE', founderAccess: true },
    });

    const inst = await AddOnInstallationManager.getInstallation(TEST_TENANT_A, 'vip_family_concierge');
    expect(inst).toBeDefined();
    expect(inst?.status).toBe('ACTIVE');
    expect((inst?.configuration as any)?.referralMode).toBe('PRIVATE');

    // Verify audit record
    const audits = await db
      .select()
      .from(hermesAddonAudit)
      .where(
        and(
          eq(hermesAddonAudit.organizationId, TEST_TENANT_A),
          eq(hermesAddonAudit.addonId, 'vip_family_concierge')
        )
      );

    expect(audits.length).toBeGreaterThanOrEqual(1);
    const activationAudit = audits.find(a => a.eventType === 'ACTIVATED');
    expect(activationAudit).toBeDefined();
    expect(activationAudit?.newStatus).toBe('ACTIVE');
    expect(activationAudit?.installationId).toBe(inst!.installationId);
  });

  it('ADDON-004: Reactivates an existing Add-On and maintains symmetric audit trail', async () => {
    // 1. Manually deactivate
    await db
      .update(hermesAddonInstallations)
      .set({ status: 'DEACTIVATED', updatedAt: new Date() })
      .where(
        and(
          eq(hermesAddonInstallations.organizationId, TEST_TENANT_A),
          eq(hermesAddonInstallations.addonId, 'vip_family_concierge')
        )
      );

    // 2. Reactivate via activateTenantAddOn
    await activateTenantAddOn(TEST_TENANT_A, 'vip_family_concierge', {
      installedBy: 'test_reactivator',
      configuration: { referralMode: 'RESTRICTED' },
    });

    const inst = await AddOnInstallationManager.getInstallation(TEST_TENANT_A, 'vip_family_concierge');
    expect(inst?.status).toBe('ACTIVE');

    // Verify reactivation audit record with oldStatus = 'DEACTIVATED'
    const audits = await db
      .select()
      .from(hermesAddonAudit)
      .where(
        and(
          eq(hermesAddonAudit.organizationId, TEST_TENANT_A),
          eq(hermesAddonAudit.addonId, 'vip_family_concierge')
        )
      );

    const reactivationAudit = audits.find(
      a => a.eventType === 'ACTIVATED' && a.oldStatus === 'DEACTIVATED'
    );
    expect(reactivationAudit).toBeDefined();
    expect(reactivationAudit?.installationId).toBe(inst!.installationId);
  });

  // ─── SUITE 3: RUNTIME INJECTION (CONTEXT MERGER) ──────────────────────────

  it('ADDON-005: ContextMerger injects active capabilities and style overlays into cognitive runtime', async () => {
    // Install two add-ons for Tenant A
    await activateTenantAddOn(TEST_TENANT_A, 'vip_family_concierge');
    await activateTenantAddOn(TEST_TENANT_A, 'family_office_succession');

    const merged = await CognitiveContextBuilder.buildEffectiveContext(TEST_TENANT_A, 'contact_test_123');
    expect(merged).toBeDefined();
    expect(merged.activeCapabilities.length).toBeGreaterThanOrEqual(7);

    // Check specific capabilities from both add-ons
    const capIds = merged.activeCapabilities.map(c => c.id);
    expect(capIds).toContain('vip_referral_management');
    expect(capIds).toContain('vip_founder_connection');
    expect(capIds).toContain('family_office_governance');
    expect(capIds).toContain('syndicate_onboarding');

    // Check diagnostics
    expect(merged.diagnostics?.activeAddOns).toContain('vip_family_concierge');
    expect(merged.diagnostics?.activeAddOns).toContain('family_office_succession');
  });

  // ─── SUITE 4: MULTI-TENANT ISOLATION ──────────────────────────────────────

  it('ADDON-006: Enforces strict multi-tenant boundary — Tenant B does not inherit Tenant A Add-Ons', async () => {
    // Tenant A has active Add-Ons (from previous tests)
    const tenantAInstalls = await AddOnInstallationManager.getActiveAddOns(TEST_TENANT_A);
    expect(tenantAInstalls.length).toBeGreaterThanOrEqual(2);

    const mergedB = await CognitiveContextBuilder.buildEffectiveContext(TEST_TENANT_B, 'contact_test_456');
    expect(mergedB.activeCapabilities.length).toBe(0);
    expect(mergedB.diagnostics?.activeAddOns.length).toBe(0);
  });

  // ─── SUITE 5: STYLE SYNTHESIS & ADAPTER MAPPING ───────────────────────────

  it('ADDON-007: Synthesizes rich communication tone from active Add-Ons into styleOverlay', async () => {
    await activateTenantAddOn(TEST_TENANT_A, 'family_office_succession');

    const merged = await CognitiveContextBuilder.buildEffectiveContext(TEST_TENANT_A, 'contact_style_test');
    expect(merged.style).toBeDefined();
    expect(merged.style.tone).toContain('Family Office');
    expect(merged.style.tone).toContain('exclusividad');
    expect(merged.style.tone).toContain('sin presión');
  });
});

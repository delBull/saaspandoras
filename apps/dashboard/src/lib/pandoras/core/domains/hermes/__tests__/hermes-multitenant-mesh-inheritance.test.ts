/**
 * 🏛️ Hermes OS — Multi-Tenant Mesh Inheritance & Isolation Suite
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/__tests__/hermes-multitenant-mesh-inheritance.test.ts
 *
 * Verifies that:
 * 1. S'Narai, ELD and all projects inherit baseline Search & SEO capabilities.
 * 2. Cross-tenant boundaries remain strictly enforced (Zero-Trust).
 * 3. High-risk capabilities (web.browser) remain gated behind explicit clearance.
 * 4. CANONICAL_ADDONS includes hermes.composite.search_intelligence.
 */

import { describe, it, expect } from '@jest/globals';
import { CognitiveContextBuilder } from '../addons/context-merger';
import { CANONICAL_ADDONS } from '../addons/catalog';
import { ToolAuthorizationGate } from '../runtime/tool-authorization-gate';

describe('🏛️ Hermes Multi-Tenant Mesh Inheritance & Isolation Suite', () => {

  // ── TEST 1: S'NARAI INHERITS BASELINE INTELLIGENCE CAPABILITIES ────────
  it('Test 1: S\'Narai inherits baseline Search & SEO Intelligence capabilities by default', async () => {
    const context = await CognitiveContextBuilder.buildEffectiveContext('snarai', 'user_snarai_01');

    const capIds = context.activeCapabilities.map((c: any) => c.id);
    expect(capIds).toContain('web.extract');
    expect(capIds).toContain('web.search');
    expect(capIds).toContain('web.crawl');
    expect(capIds).toContain('seo.audit');
    expect(capIds).toContain('seo.content');
    expect(capIds).toContain('seo.schema');
    expect(capIds).toContain('seo.competitor');
    expect(capIds).toContain('seo.geo');
    expect(capIds).toContain('seo.llms_txt');
    expect(capIds).toContain('research.run_mission');

    // High-risk tools are NOT in baseline by default
    expect(capIds).not.toContain('web.browser');
  });

  // ── TEST 2: ARBITRARY NEW TENANT ALSO INHERITS CAPABILITIES ────────────
  it('Test 2: Any new or arbitrary tenant (e.g. eld) inherits baseline capabilities', async () => {
    const context = await CognitiveContextBuilder.buildEffectiveContext('eld', 'user_eld_01');

    const capIds = context.activeCapabilities.map((c: any) => c.id);
    expect(capIds).toContain('seo.audit');
    expect(capIds).toContain('seo.geo');
    expect(capIds).toContain('research.run_mission');
  });

  // ── TEST 3: CROSS-TENANT DEFENSE REMAINS ENFORCED ──────────────────────
  it('Test 3: Cross-tenant isolation strictly blocks tenant A from executing on behalf of tenant B', async () => {
    const decision = await ToolAuthorizationGate.authorizeAsync(
      {
        organizationId: 'snarai',
        actorId: 'attacker_snarai',
        capabilityId: 'research.run_mission',
        toolName: 'research.run_mission',
        parameters: { targetOrgId: 'eld_victim' },
      },
      [{ id: 'research.run_mission' }]
    );

    expect(decision.authorized).toBe(false);
    expect(decision.reason).toContain('Cross-tenant parameter mismatch');
  });

  // ── TEST 4: CANONICAL ADD-ON CATALOG INCLUDES SEARCH INTELLIGENCE ──────
  it('Test 4: CANONICAL_ADDONS catalog exposes hermes.composite.search_intelligence', () => {
    const searchAddon = CANONICAL_ADDONS.find(a => a.id === 'hermes.composite.search_intelligence');
    expect(searchAddon).toBeDefined();
    expect(searchAddon?.name).toContain('Search, SEO & GEO Intelligence Mesh');
    expect(searchAddon?.capabilities.some(c => c.id === 'seo.audit')).toBe(true);
    expect(searchAddon?.capabilities.some(c => c.id === 'seo.geo')).toBe(true);
    expect(searchAddon?.capabilities.some(c => c.id === 'research.run_mission')).toBe(true);
  });
});

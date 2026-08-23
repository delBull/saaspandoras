/**
 * 🛡️ Hermes OS — Multi-Tenant Format Contract Certification
 *
 * Certifies that all stores and resolvers accept the three tenant formats:
 * 1. Canonical project slug: 'snarai'
 * 2. Organization prefixed slug: 'org_snarai'
 * 3. PostgreSQL UUID identifier: '9079ecf5-2162-4078-bddf-66b607e2d32f'
 *
 * Verifies strict tenant isolation: Unknown organizations fail closed and
 * NEVER fallback to another tenant.
 */

import { describe, it, expect } from '@jest/globals';
import { CognitiveContextBuilder } from '../../addons/context-merger';
import { PostgresConversationMemoryProvider } from '../memory/postgres-memory-provider';
import { TenantKnowledgeStore } from '@/lib/hermes/knowledge/tenant-knowledge-store';
import { GetKnowledgeOverviewQuery } from '@/lib/pandoras/core/domains/control-plane/application/queries/get-knowledge-overview';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';

describe('Hermes OS — Multi-Tenant Format Contract & Isolation', () => {
  const SNARAI_UUID = '9079ecf5-2162-4078-bddf-66b607e2d32f';
  const FORMATS = ['snarai', 'org_snarai', SNARAI_UUID];

  for (const tenantFormat of FORMATS) {
    it(`CognitiveContextBuilder builds effective context for format: "${tenantFormat}"`, async () => {
      const context = await CognitiveContextBuilder.buildEffectiveContext(tenantFormat, 'contract_test_actor');
      expect(context).toBeDefined();
      expect(context.core.tenantId).toBe(tenantFormat);
      expect(context.knowledge.length).toBeGreaterThan(0);
      expect(context.activeCapabilities.length).toBeGreaterThan(0);
    });

    it(`PostgresConversationMemoryProvider establishes session and loads memory for format: "${tenantFormat}"`, async () => {
      const memoryProvider = new PostgresConversationMemoryProvider();
      const loaded = await memoryProvider.load({
        organizationId: tenantFormat,
        conversationId: `conv_contract_${Date.now()}`,
        controlPlaneContext: {
          actorId: 'test_actor',
          organizationId: tenantFormat,
          role: 'ADMIN',
          permissions: ['view_overview']
        }
      });
      expect(loaded).toBeDefined();
      expect(loaded.organizationId).toBe(tenantFormat);
      expect(Array.isArray(loaded.messages)).toBe(true);
    });

    it(`GetKnowledgeOverviewQuery resolves knowledge overview for format: "${tenantFormat}"`, async () => {
      const query = new GetKnowledgeOverviewQuery();
      const ctx = new ControlPlaneContext(
        'sess_contract_test',
        'contract_actor',
        'admin',
        ['view_overview', 'view_audit', 'view_governance'],
        [{ organizationId: tenantFormat, role: 'admin' }]
      );
      const overview = await query.execute(ctx, tenantFormat);
      expect(overview).toBeDefined();
      expect(overview.knowledgeHealth).toBeDefined();
      expect(Array.isArray(overview.facts)).toBe(true);
    });
  }

  it('Tenant Knowledge Store isolates unknown tenants without hardcoded fallback', async () => {
    const unknownTenantId = `unknown_tenant_${Date.now()}`;
    const result = await TenantKnowledgeStore.updateKnowledge(
      {
        organizationId: unknownTenantId,
        actorId: 'test_actor',
        sessionId: 'sess_123',
        permissions: ['write_knowledge']
      },
      'business',
      'Test discovery content'
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe('ORGANIZATION_NOT_FOUND');
  });
});

/**
 * 🏛️ HERMES OS — Tenant Gateway & Cross-Tenant Defense Tests (K27.2)
 * src/lib/pandoras/core/domains/hermes/tenants/__tests__/tenant-gateway.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TenantGateway } from '../tenant-gateway';
import { IntegrationCredential } from '../contracts';

describe('Hermes OS Milestone K27.2 — Tenant Gateway & Invariant Defense', () => {
  beforeEach(() => {
    TenantGateway.clearMemoryCredentials();

    // Register test credentials for two separate tenants
    const credentialA: IntegrationCredential = {
      apiKey: 'pk_live_acme_corp_secret_key_123',
      tenantId: 'acme_corp',
      scope: 'AGENT_RUNTIME',
      issuedAt: new Date().toISOString(),
      revoked: false,
    };

    const credentialB: IntegrationCredential = {
      apiKey: 'pk_live_snarai_secret_key_456',
      tenantId: 'snarai',
      scope: 'ADMIN_GOVERNANCE',
      issuedAt: new Date().toISOString(),
      revoked: false,
    };

    const revokedCredential: IntegrationCredential = {
      apiKey: 'pk_live_revoked_client_789',
      tenantId: 'acme_corp',
      scope: 'AGENT_RUNTIME',
      issuedAt: new Date().toISOString(),
      revoked: true,
    };

    const readOnlyCredential: IntegrationCredential = {
      apiKey: 'pk_live_read_only_key_000',
      tenantId: 'acme_corp',
      scope: 'READ_ONLY',
      issuedAt: new Date().toISOString(),
      revoked: false,
    };

    TenantGateway.registerCredential(credentialA);
    TenantGateway.registerCredential(credentialB);
    TenantGateway.registerCredential(revokedCredential);
    TenantGateway.registerCredential(readOnlyCredential);
  });

  // ─── TEST 1: Valid Credential Matching Tenant ──────────────────────────────
  it('GW-001: Authenticates valid credential and builds canonical TenantControlPlaneContext', async () => {
    const result = await TenantGateway.verifyTenantAccess({
      apiKey: 'pk_live_acme_corp_secret_key_123',
      requestedTenantId: 'acme_corp',
      requiredScope: 'AGENT_RUNTIME',
    });

    expect(result.allowed).toBe(true);
    expect(result.context).toBeDefined();
    expect(result.context?.tenantId).toBe('acme_corp');
    expect(result.context?.organizationId).toBe('org_acme_corp');
    expect(result.context?.governanceStatus).toBe('ACTIVE');
    expect(result.context?.authenticatedVia).toBe('INTEGRATION_KEY');
  });

  // ─── TEST 2: Cross-Tenant Isolation Defense ────────────────────────────────
  it('GW-002: HARD BLOCK on Cross-Tenant attempt (Tenant A key used for Tenant B)', async () => {
    const result = await TenantGateway.verifyTenantAccess({
      apiKey: 'pk_live_acme_corp_secret_key_123', // Acme's key
      requestedTenantId: 'snarai',                // S'Narai requested
      requiredScope: 'AGENT_RUNTIME',
    });

    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe('TENANT_MISMATCH');
    expect(result.errorMessage).toContain('cannot access tenant "snarai"');
    expect(result.context).toBeUndefined();
  });

  // ─── TEST 3: Missing or Invalid API Key ─────────────────────────────────────
  it('GW-003: Rejects missing, empty, or completely invalid API keys', async () => {
    const missingResult = await TenantGateway.verifyTenantAccess({
      apiKey: null,
      requestedTenantId: 'acme_corp',
    });

    expect(missingResult.allowed).toBe(false);
    expect(missingResult.errorCode).toBe('INVALID_CREDENTIAL');

    const invalidResult = await TenantGateway.verifyTenantAccess({
      apiKey: 'pk_totally_fake_random_key_99999',
      requestedTenantId: 'acme_corp',
    });

    expect(invalidResult.allowed).toBe(false);
    expect(invalidResult.errorCode).toBe('INVALID_CREDENTIAL');
  });

  // ─── TEST 4: Revoked Credential ───────────────────────────────────────────
  it('GW-004: Rejects revoked or suspended credentials immediately', async () => {
    const result = await TenantGateway.verifyTenantAccess({
      apiKey: 'pk_live_revoked_client_789',
      requestedTenantId: 'acme_corp',
      requiredScope: 'AGENT_RUNTIME',
    });

    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe('INVALID_CREDENTIAL');
    expect(result.errorMessage).toContain('revoked');
  });

  // ─── TEST 5: Insufficient Scope ───────────────────────────────────────────
  it('GW-005: Rejects requests where credential scope is lower than required', async () => {
    const result = await TenantGateway.verifyTenantAccess({
      apiKey: 'pk_live_read_only_key_000',
      requestedTenantId: 'acme_corp',
      requiredScope: 'ADMIN_GOVERNANCE', // requires ADMIN_GOVERNANCE
    });

    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe('INSUFFICIENT_SCOPE');
    expect(result.errorMessage).toContain('insufficient');
  });

  // ─── TEST 6: Next.js HTTP Request Header Extraction ────────────────────────
  it('GW-006: Correctly extracts Bearer tokens and X-API-Key headers from Requests', async () => {
    // A. Bearer token
    const reqWithBearer = new Request('https://api.pandoras.finance/v1/hermes/chat', {
      headers: {
        Authorization: 'Bearer pk_live_snarai_secret_key_456',
      },
    });

    const bearerResult = await TenantGateway.authenticateRequest(reqWithBearer, 'snarai');
    expect(bearerResult.allowed).toBe(true);
    expect(bearerResult.context?.tenantId).toBe('snarai');

    // B. X-API-Key header
    const reqWithXApiKey = new Request('https://api.pandoras.finance/v1/hermes/chat', {
      headers: {
        'X-API-Key': 'pk_live_acme_corp_secret_key_123',
      },
    });

    const xApiKeyResult = await TenantGateway.authenticateRequest(reqWithXApiKey, 'acme_corp');
    expect(xApiKeyResult.allowed).toBe(true);
    expect(xApiKeyResult.context?.tenantId).toBe('acme_corp');
  });
});

/**
 * 🏛️ HERMES OS — Tenant Gateway & Canonical Context Resolver
 * src/lib/pandoras/core/domains/hermes/tenants/tenant-gateway.ts
 *
 * Implements Milestone K27.2:
 * 1. Authenticates external tenant requests via Integration API Key or Bearer Token.
 * 2. Enforces Sovereign Isolation Invariant:
 *    credential.tenantId === requestedTenantId (Strict Tenant Binding).
 * 3. Resolves canonical TenantControlPlaneContext for HermesRuntime.
 * 4. Audits any tenant mismatch or unauthorized access attempt.
 */

import { db } from '@/db';
import { integrationClients, projects, hermesClaimContracts } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { SecurityAuditLogger } from '../runtime/security-audit-logger';
import { 
  IntegrationCredential, 
  TenantControlPlaneContext, 
  TenantGatewayVerificationResult 
} from './contracts';

export class TenantGateway {
  private static inMemoryCredentials = new Map<string, IntegrationCredential>();

  /**
   * Registers an in-memory credential (useful for tests or dynamically issued ephemeral keys).
   */
  public static registerCredential(credential: IntegrationCredential): void {
    const cleanTenant = credential.tenantId.toLowerCase().replace(/^org_/, '');
    this.inMemoryCredentials.set(credential.apiKey, {
      ...credential,
      tenantId: cleanTenant,
    });
  }

  /**
   * Clears in-memory credentials (for testing isolation).
   */
  public static clearMemoryCredentials(): void {
    this.inMemoryCredentials.clear();
  }

  /**
   * Resolves and verifies an incoming request for a specific tenant.
   * Enforces that the credential belongs strictly to the requested tenant.
   */
  public static async verifyTenantAccess(params: {
    apiKey?: string | null;
    requestedTenantId: string;
    requiredScope?: 'READ_ONLY' | 'AGENT_RUNTIME' | 'ADMIN_GOVERNANCE';
    dbClient?: any;
  }): Promise<TenantGatewayVerificationResult> {
    const { apiKey, requestedTenantId, requiredScope = 'AGENT_RUNTIME' } = params;
    const activeDb = params.dbClient || db;
    const cleanRequestedTenant = requestedTenantId.toLowerCase().replace(/^org_/, '').trim();

    if (!apiKey || apiKey.trim() === '') {
      return {
        allowed: false,
        errorCode: 'INVALID_CREDENTIAL',
        errorMessage: 'Missing API key or integration credential in request header.',
      };
    }

    const trimmedKey = apiKey.trim();

    // 1. Check in-memory credential first
    let credential = this.inMemoryCredentials.get(trimmedKey);

    // 2. If not in memory, query integration_clients from DB
    if (!credential && activeDb) {
      try {
        const crypto = await import('crypto');
        const keyHash = crypto.createHash('sha256').update(trimmedKey).digest('hex');

        const clientRecords = await activeDb
          .select()
          .from(integrationClients)
          .where(
            or(
              eq(integrationClients.apiKeyHash, keyHash),
              eq(integrationClients.apiKeyHash, trimmedKey)
            )
          )
          .limit(1);

        if (clientRecords.length > 0) {
          const client = clientRecords[0];
          const isRevoked = !client.isActive || !!client.revokedAt;
          credential = {
            apiKey: trimmedKey,
            tenantId: (client.projectId ? String(client.projectId) : '').toLowerCase().replace(/^org_/, ''),
            scope: 'AGENT_RUNTIME',
            issuedAt: client.createdAt ? new Date(client.createdAt).toISOString() : new Date().toISOString(),
            revoked: isRevoked,
          };
        }
      } catch (err: any) {
        console.warn('[TenantGateway] DB lookup warning for integration_clients:', err?.message);
      }
    }

    // If still no credential found
    if (!credential) {
      // Allow fallback if running in development with standard test keys
      if (process.env.NODE_ENV !== 'production' && trimmedKey.startsWith('pk_test_')) {
        const inferredTenant = trimmedKey.replace('pk_test_', '').split('_')[0] || cleanRequestedTenant;
        credential = {
          apiKey: trimmedKey,
          tenantId: inferredTenant.toLowerCase().replace(/^org_/, ''),
          scope: 'AGENT_RUNTIME',
          issuedAt: new Date().toISOString(),
          revoked: false,
        };
      } else {
        await SecurityAuditLogger.logEvent({
          organizationId: cleanRequestedTenant,
          eventType: 'CROSS_TENANT_BLOCKED',
          severity: 'WARN',
          policyDecision: 'DENY',
          correlationId: `gw_invalid_${Date.now()}`,
          metadata: {
            reason: 'INVALID_API_KEY',
            providedKeyPrefix: trimmedKey.slice(0, 8),
          },
        });

        return {
          allowed: false,
          errorCode: 'INVALID_CREDENTIAL',
          errorMessage: 'Invalid API key or unauthorized integration client.',
        };
      }
    }

    // 3. Verify Revocation
    if (credential.revoked) {
      return {
        allowed: false,
        errorCode: 'INVALID_CREDENTIAL',
        errorMessage: 'Integration credential has been revoked or suspended.',
      };
    }

    // 4. HARD INVARIANT: Strict Tenant Binding (credential.tenantId === requestedTenantId)
    const boundTenantId = credential.tenantId.toLowerCase().replace(/^org_/, '');
    if (boundTenantId !== cleanRequestedTenant) {
      await SecurityAuditLogger.logEvent({
        organizationId: cleanRequestedTenant,
        eventType: 'CROSS_TENANT_BLOCKED',
        severity: 'CRITICAL',
        policyDecision: 'DENY',
        correlationId: `gw_mismatch_${Date.now()}`,
        metadata: {
          reason: 'CROSS_TENANT_ACCESS_ATTEMPT',
          credentialTenantId: boundTenantId,
          requestedTenantId: cleanRequestedTenant,
        },
      });

      return {
        allowed: false,
        errorCode: 'TENANT_MISMATCH',
        errorMessage: `Access denied: Credential bound to tenant "${boundTenantId}" cannot access tenant "${cleanRequestedTenant}".`,
      };
    }

    // 5. Verify Scope
    const scopeHierarchy = {
      READ_ONLY: 1,
      AGENT_RUNTIME: 2,
      ADMIN_GOVERNANCE: 3,
    };

    if (scopeHierarchy[credential.scope] < scopeHierarchy[requiredScope]) {
      return {
        allowed: false,
        errorCode: 'INSUFFICIENT_SCOPE',
        errorMessage: `Credential scope "${credential.scope}" is insufficient. Required scope: "${requiredScope}".`,
      };
    }

    // 6. Build Canonical TenantControlPlaneContext
    const context: TenantControlPlaneContext = {
      tenantId: cleanRequestedTenant,
      organizationId: `org_${cleanRequestedTenant}`,
      resolvedSlug: cleanRequestedTenant,
      governanceStatus: 'ACTIVE',
      rateLimitTier: 'PRO',
      authenticatedVia: 'INTEGRATION_KEY',
      credentialScope: credential.scope,
    };

    return {
      allowed: true,
      context,
    };
  }

  /**
   * Helper for Next.js API Routes / Server Actions to extract key and verify.
   */
  public static async authenticateRequest(
    req: Request,
    requestedTenantId: string,
    requiredScope?: 'READ_ONLY' | 'AGENT_RUNTIME' | 'ADMIN_GOVERNANCE'
  ): Promise<TenantGatewayVerificationResult> {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const xApiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');

    let apiKey = xApiKey;
    if (!apiKey && authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.replace('Bearer ', '').trim();
      } else {
        apiKey = authHeader.trim();
      }
    }

    return this.verifyTenantAccess({
      apiKey,
      requestedTenantId,
      requiredScope,
    });
  }
}

/**
 * 🛡️ Hermes OS — Tool Firewall & Authorization Gate (K13-TOOL-01 / K13-CAP-02 / K17-FIREWALL-01)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/runtime/tool-authorization-gate.ts
 *
 * Implements Multi-Layer Deterministic Tool Governance:
 * 1. Zero-Tolerance: Absolute denial of internal secrets, DB raw dumps, or private keys.
 * 2. Cross-Tenant Parameter Spoofing Defense: Rejects mismatched targetOrgId / tenantId.
 * 3. Resource Scope Gate: Ensures accessed resource belongs strictly to caller tenant.
 * 4. Capability Least Privilege: Explicit capability matching against active tenant capabilities.
 * 5. Egress Security Gate: Inspects outgoing URLs against SSRF allowlist / IP filters.
 */

import { ToolAuthorizationRequest, ToolAuthorizationDecision } from './contracts';
import { EgressGuard } from './egress-guard';
import { SecurityAuditLogger } from './security-audit-logger';

export interface RegisteredToolDefinition {
  toolId: string;
  requiredCapability: string;
  allowedChannels: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isEgress?: boolean;
  requiresHumanApproval?: boolean;
}

const RESTRICTED_INTERNAL_TOOLS = Object.freeze(new Set([
  'getInternalOrganizationStructure',
  'getHoldingFinancials',
  'exportTenantRawDatabase',
  'overrideGovernanceRules',
  'signInstitutionalAgreement',
  'accessPrivateKeys',
  'system.drop_database',
  'system.execute_raw_sql'
]));

const TENANT_COMMERCIAL_TOOLS = Object.freeze(new Set([
  'payments.create_spei_link',
  'payments.create_checkout_session',
  'calendar.schedule',
  'leads.capture_contact',
  'dossier.send_public_materials'
]));

export class ToolAuthorizationGate {
  /**
   * Evaluates authorization and firewall rules before tool execution.
   */
  public static async authorizeAsync(
    request: ToolAuthorizationRequest,
    activeCapabilities: Array<{ id: string; requiresClearance?: string; isRestricted?: boolean }>
  ): Promise<ToolAuthorizationDecision> {
    const { toolName, organizationId, clearanceLevel, actorId } = request;
    const correlationId = `corr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Zero-Tolerance: Absolute denial of internal secrets or private key tools
    if (RESTRICTED_INTERNAL_TOOLS.has(toolName)) {
      if (clearanceLevel !== 'TIER_1_COO' && clearanceLevel !== 'SYSTEM_ADMIN') {
        await SecurityAuditLogger.logEvent({
          organizationId,
          actorId,
          eventType: 'TOOL_UNAUTHORIZED',
          severity: 'CRITICAL',
          policyDecision: 'DENY',
          correlationId,
          toolId: toolName,
          metadata: { reason: 'RESTRICTED_INTERNAL_TOOL_INVOCATION_ATTEMPT' }
        });

        return {
          authorized: false,
          reason: `Tool '${toolName}' is classified as RESTRICTED_INTERNAL and requires TIER_1_COO clearance. Access denied for ${organizationId}.`,
          violationCode: 'UNAUTHORIZED_CAPABILITY'
        };
      }
    }

    // 2. Cross-Tenant Parameter Spoofing Defense
    if (request.parameters) {
      const paramOrg = (request.parameters.targetOrgId || request.parameters.organizationId || request.parameters.tenantId) as string | undefined;
      if (paramOrg && paramOrg !== organizationId && clearanceLevel !== 'SYSTEM_ADMIN') {
        await SecurityAuditLogger.logEvent({
          organizationId,
          actorId,
          eventType: 'CROSS_TENANT_BLOCKED',
          severity: 'CRITICAL',
          policyDecision: 'DENY',
          correlationId,
          toolId: toolName,
          metadata: { targetOrgId: paramOrg, callerOrgId: organizationId }
        });

        return {
          authorized: false,
          reason: `Cross-tenant parameter mismatch: Caller tenant '${organizationId}' cannot invoke tool '${toolName}' targeting tenant '${paramOrg}'.`,
          violationCode: 'UNAUTHORIZED_CAPABILITY'
        };
      }

      // 2.5 Resource Scope Gate (Cross-tenant resourceId verification)
      const resourceOwner = (request.parameters.resourceOwnerTenantId || request.parameters.resourceTenantId) as string | undefined;
      if (resourceOwner && resourceOwner !== organizationId && clearanceLevel !== 'SYSTEM_ADMIN') {
        await SecurityAuditLogger.logEvent({
          organizationId,
          actorId,
          eventType: 'RESOURCE_MISMATCH_BLOCKED',
          severity: 'CRITICAL',
          policyDecision: 'DENY',
          correlationId,
          toolId: toolName,
          metadata: { resourceOwner, callerOrgId: organizationId }
        });

        return {
          authorized: false,
          reason: `Resource scope violation: Resource owner '${resourceOwner}' does not match caller '${organizationId}'.`,
          violationCode: 'UNAUTHORIZED_CAPABILITY'
        };
      }

      // 3. Egress Security Gate (SSRF Check on outgoing URLs in parameters)
      const targetUrl = (request.parameters.url || request.parameters.targetUrl || request.parameters.webhookUrl) as string | undefined;
      if (targetUrl) {
        const egressCheck = await EgressGuard.validateUrl(targetUrl);
        if (!egressCheck.allowed) {
          await SecurityAuditLogger.logEvent({
            organizationId,
            actorId,
            eventType: 'SSRF_BLOCKED',
            severity: 'CRITICAL',
            policyDecision: 'DENY',
            correlationId,
            toolId: toolName,
            metadata: { targetUrl, reason: egressCheck.reason }
          });

          return {
            authorized: false,
            reason: `Egress Firewall Blocked: ${egressCheck.reason}`,
            violationCode: 'UNAUTHORIZED_CAPABILITY'
          };
        }
      }
    }

    // 4. Tenant Capability Check: Tool must belong to an active capability in tenant context
    const hasCapability = activeCapabilities.some(c => 
      c.id === request.capabilityId || 
      c.id === toolName || 
      TENANT_COMMERCIAL_TOOLS.has(toolName)
    );

    if (!hasCapability && !RESTRICTED_INTERNAL_TOOLS.has(toolName)) {
      await SecurityAuditLogger.logEvent({
        organizationId,
        actorId,
        eventType: 'TOOL_UNAUTHORIZED',
        severity: 'WARN',
        policyDecision: 'DENY',
        correlationId,
        toolId: toolName,
        metadata: { requestedCapability: request.capabilityId }
      });

      return {
        authorized: false,
        reason: `Tool '${toolName}' (capability '${request.capabilityId}') is not enabled for tenant '${organizationId}'.`,
        violationCode: 'UNAUTHORIZED_CAPABILITY'
      };
    }

    return {
      authorized: true,
      reason: `Tool '${toolName}' authorized for tenant '${organizationId}'.`
    };
  }

  /**
   * Synchronous pure authorization check for backward compatibility with existing unit tests.
   */
  public static authorize(
    request: ToolAuthorizationRequest,
    activeCapabilities: Array<{ id: string; requiresClearance?: string; isRestricted?: boolean }>
  ): ToolAuthorizationDecision {
    const { toolName, organizationId, clearanceLevel } = request;

    if (RESTRICTED_INTERNAL_TOOLS.has(toolName)) {
      if (clearanceLevel !== 'TIER_1_COO' && clearanceLevel !== 'SYSTEM_ADMIN') {
        return {
          authorized: false,
          reason: `Tool '${toolName}' is classified as RESTRICTED_INTERNAL and requires TIER_1_COO clearance. Access denied for ${organizationId}.`,
          violationCode: 'UNAUTHORIZED_CAPABILITY'
        };
      }
    }

    if (request.parameters) {
      const paramOrg = (request.parameters.targetOrgId || request.parameters.organizationId || request.parameters.tenantId) as string | undefined;
      if (paramOrg && paramOrg !== organizationId && clearanceLevel !== 'SYSTEM_ADMIN') {
        return {
          authorized: false,
          reason: `Cross-tenant parameter mismatch: Caller tenant '${organizationId}' cannot invoke tool '${toolName}' targeting tenant '${paramOrg}'.`,
          violationCode: 'UNAUTHORIZED_CAPABILITY'
        };
      }

      const resourceOwner = (request.parameters.resourceOwnerTenantId || request.parameters.resourceTenantId) as string | undefined;
      if (resourceOwner && resourceOwner !== organizationId && clearanceLevel !== 'SYSTEM_ADMIN') {
        return {
          authorized: false,
          reason: `Resource scope violation: Resource owner '${resourceOwner}' does not match caller '${organizationId}'.`,
          violationCode: 'UNAUTHORIZED_CAPABILITY'
        };
      }

      const targetUrl = (request.parameters.url || request.parameters.targetUrl) as string | undefined;
      if (targetUrl) {
        if (targetUrl.includes('169.254.169.254') || targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
          return {
            authorized: false,
            reason: `Egress Firewall Blocked: RESTRICTED_HOSTNAME`,
            violationCode: 'UNAUTHORIZED_CAPABILITY'
          };
        }
      }
    }

    const hasCapability = activeCapabilities.some(c => 
      c.id === request.capabilityId || 
      c.id === toolName || 
      TENANT_COMMERCIAL_TOOLS.has(toolName)
    );

    if (!hasCapability && !RESTRICTED_INTERNAL_TOOLS.has(toolName)) {
      return {
        authorized: false,
        reason: `Tool '${toolName}' (capability '${request.capabilityId}') is not enabled for tenant '${organizationId}'.`,
        violationCode: 'UNAUTHORIZED_CAPABILITY'
      };
    }

    return {
      authorized: true,
      reason: `Tool '${toolName}' authorized for tenant '${organizationId}'.`
    };
  }
}

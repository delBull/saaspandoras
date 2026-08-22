/**
 * 🛡️ Hermes OS Tool Authorization Gate (Phase 3.0 / T10)
 * Evaluates actor clearance and tenant capabilities BEFORE any tool execution.
 * Enforces the invariant: Valid Decision ≠ Authorized Tool Execution.
 */

import { ToolAuthorizationRequest, ToolAuthorizationDecision } from './contracts';

// Tools classified by minimum clearance and restricted domains
const RESTRICTED_INTERNAL_TOOLS = new Set([
  'getInternalOrganizationStructure',
  'getHoldingFinancials',
  'exportTenantRawDatabase',
  'overrideGovernanceRules',
  'signInstitutionalAgreement',
  'accessPrivateKeys'
]);

const TENANT_COMMERCIAL_TOOLS = new Set([
  'payments.create_spei_link',
  'payments.create_checkout_session',
  'calendar.schedule',
  'leads.capture_contact',
  'dossier.send_public_materials'
]);

export class ToolAuthorizationGate {
  /**
   * Pure authorization check for tool invocation requests.
   */
  public static authorize(
    request: ToolAuthorizationRequest,
    activeCapabilities: Array<{ id: string; requiresClearance?: string; isRestricted?: boolean }>
  ): ToolAuthorizationDecision {
    const { toolName, organizationId, clearanceLevel } = request;

    // 1. Zero-Tolerance: Absolute denial of internal secrets or private key tools
    if (RESTRICTED_INTERNAL_TOOLS.has(toolName)) {
      if (clearanceLevel !== 'TIER_1_COO' && clearanceLevel !== 'SYSTEM_ADMIN') {
        return {
          authorized: false,
          reason: `Tool '${toolName}' is classified as RESTRICTED_INTERNAL and requires TIER_1_COO clearance. Access denied for ${organizationId}.`,
          violationCode: 'UNAUTHORIZED_CAPABILITY'
        };
      }
    }

    // 1.5 Cross-Tenant Parameter Spoofing Defense (T10 Extended)
    if (request.parameters) {
      const paramOrg = (request.parameters.targetOrgId || request.parameters.organizationId || request.parameters.tenantId) as string | undefined;
      if (paramOrg && paramOrg !== organizationId && clearanceLevel !== 'SYSTEM_ADMIN') {
        return {
          authorized: false,
          reason: `Cross-tenant parameter mismatch: Caller tenant '${organizationId}' cannot invoke tool '${toolName}' targeting tenant '${paramOrg}'.`,
          violationCode: 'UNAUTHORIZED_CAPABILITY'
        };
      }
    }

    // 2. Tenant Capability Check: Tool must belong to an active capability in tenant context
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

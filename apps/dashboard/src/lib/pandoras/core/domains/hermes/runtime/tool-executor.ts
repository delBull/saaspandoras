/**
 * 🛡️ Hermes OS Tool Executor & Gatekeeper (Phase 3.0 Gate T10)
 *
 * ARCHITECTURAL INVARIANT (K13-TOOL-01):
 * All cognitive tool calls, action executions, and external integrations MUST dispatch
 * strictly through `HermesToolExecutor.executeTool()`. Direct invocation of handlers
 * without passing `ToolAuthorizationGate` is strictly forbidden across the platform.
 *
 * Default handlers provided herein serve as safe development/sandbox implementations.
 * Production integrations (e.g. live SPEI checkout, CRM sync, Calendar booking) register
 * custom handlers via `registerHandler()`, maintaining absolute enforcement of the gate.
 */

import { ToolAuthorizationGate } from './tool-authorization-gate';
import { 
  ToolAuthorizationRequest, 
  ToolAuthorizationDecision, 
  PolicyViolationCode, 
  KnowledgeClassificationTier 
} from './contracts';
import { HermesIdentityVerifier } from '../identity/identity-verifier';
import { ToolCircuitBreaker } from './operational-governance-contract';

export type ToolHandler = (params?: Record<string, unknown>, context?: Record<string, unknown>) => Promise<{ data: unknown; classification?: KnowledgeClassificationTier } | unknown>;

export interface ToolExecutionResponse {
  success: boolean;
  unauthorized?: boolean;
  violationCode?: PolicyViolationCode;
  reason?: string;
  classification?: KnowledgeClassificationTier;
  data?: unknown;
}

export class HermesToolExecutor {
  private handlers: Map<string, ToolHandler> = new Map();
  private circuitBreakers: Map<string, ToolCircuitBreaker> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Register a capability tool handler.
   */
  public registerHandler(toolName: string, handler: ToolHandler): void {
    this.handlers.set(toolName, handler);
  }

  /**
   * Executes a tool with strict boundary enforcement and circuit breaker reliability.
   */
  public async executeTool(
    request: ToolAuthorizationRequest,
    activeCapabilities: Array<{ id: string; requiresClearance?: string; isRestricted?: boolean }>,
    context?: Record<string, unknown>
  ): Promise<ToolExecutionResponse> {
    // 1. Mandatory Tool Authorization Precondition (Async Firewall & Egress Guard)
    const authDecision: ToolAuthorizationDecision = await ToolAuthorizationGate.authorizeAsync(request, activeCapabilities);

    if (!authDecision.authorized) {
      return {
        success: false,
        unauthorized: true,
        violationCode: authDecision.violationCode,
        reason: authDecision.reason
      };
    }

    // 1.5 Mandatory Cryptographic Action Intent Verification (K23)
    const isRestrictedInternalTool = 
      request.toolName === 'getInternalOrganizationStructure' ||
      request.toolName === 'getHoldingFinancials' ||
      request.toolName === 'exportTenantRawDatabase' ||
      request.toolName === 'overrideGovernanceRules' ||
      request.toolName === 'signInstitutionalAgreement' ||
      request.toolName === 'accessPrivateKeys' ||
      request.toolName === 'system.drop_database' ||
      request.toolName === 'system.execute_raw_sql' ||
      request.toolName.startsWith('system.') ||
      request.toolName.startsWith('admin.') ||
      context?.requireSignedIntent === true;

    if (isRestrictedInternalTool && !context?.signedIntent) {
      return {
        success: false,
        unauthorized: true,
        violationCode: 'UNAUTHORIZED_CAPABILITY',
        reason: `[K23_INTENT_REQUIRED] Cryptographic signed action intent is mandatory for restricted tool '${request.toolName}'.`,
      };
    }

    if (context?.signedIntent) {
      const requiredCapability = request.capabilityId || request.toolName.split('.')[0];
      const verification = await HermesIdentityVerifier.verifyIntent(context.signedIntent as any, {
        requiredCapability,
      });
      if (!verification.valid) {
        return {
          success: false,
          unauthorized: true,
          violationCode: 'UNAUTHORIZED_CAPABILITY',
          reason: `[K23_IDENTITY_REJECTED] ${verification.errorMessage}`,
        };
      }
    }

    // 2. Lookup Handler
    const handler = this.handlers.get(request.toolName);
    if (!handler) {
      return {
        success: false,
        reason: `Handler for tool '${request.toolName}' is not registered.`
      };
    }

    // 3. Safe Execution with ToolCircuitBreaker protection
    const tenantKey = request.organizationId || 'global';
    const breakerKey = `${tenantKey}::${request.toolName}`;
    let breaker = this.circuitBreakers.get(breakerKey);
    if (!breaker) {
      breaker = new ToolCircuitBreaker(request.toolName, tenantKey);
      this.circuitBreakers.set(breakerKey, breaker);
    }

    try {
      const data = await breaker.executeProtected(async () => {
        return await handler(request.parameters, context);
      });
      return {
        success: true,
        data
      };
    } catch (err: any) {
      return {
        success: false,
        reason: `Tool execution failed: ${err.message || String(err)}`
      };
    }
  }

  private registerDefaultHandlers(): void {
    // Default commercial actions for tenants
    this.handlers.set('payments.create_spei_link', async (params) => {
      const amount = (params as any)?.amount || 50;
      return {
        clabe: '646180123456789012',
        beneficiary: 'Pandoras Growth OS / S\'Narai Vault',
        amountUsd: amount,
        reference: `SPEI_${Date.now()}`
      };
    });

    this.handlers.set('calendar.schedule', async (params) => {
      return {
        eventScheduled: true,
        calendarUrl: 'https://cal.pandoras.finance/snarai/briefing',
        timeSlot: (params as any)?.timeSlot || '2026-08-25T16:00:00Z'
      };
    });

    this.handlers.set('leads.capture_contact', async (params) => {
      return {
        saved: true,
        contactId: `lead_${Date.now()}`
      };
    });
  }
}

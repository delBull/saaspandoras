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
   * Executes a tool with strict boundary enforcement.
   */
  public async executeTool(
    request: ToolAuthorizationRequest,
    activeCapabilities: Array<{ id: string; requiresClearance?: string; isRestricted?: boolean }>,
    context?: Record<string, unknown>
  ): Promise<ToolExecutionResponse> {
    // 1. Mandatory Tool Authorization Precondition
    const authDecision: ToolAuthorizationDecision = ToolAuthorizationGate.authorize(request, activeCapabilities);

    if (!authDecision.authorized) {
      return {
        success: false,
        unauthorized: true,
        violationCode: authDecision.violationCode,
        reason: authDecision.reason
      };
    }

    // 2. Lookup Handler
    const handler = this.handlers.get(request.toolName);
    if (!handler) {
      return {
        success: false,
        reason: `Handler for tool '${request.toolName}' is not registered.`
      };
    }

    // 3. Safe Execution
    try {
      const data = await handler(request.parameters, context);
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

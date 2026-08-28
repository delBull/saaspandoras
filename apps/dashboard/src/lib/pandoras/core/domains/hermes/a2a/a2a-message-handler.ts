/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.0 — MESSAGE HANDLER
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/a2a-message-handler.ts
 *
 * Implements capability dispatching and policy execution for incoming A2A messages.
 */

import { A2AMessage, A2AProcessingResult } from './contracts';
import { A2ASecurityValidator } from './a2a-security-validator';
import { AgentRegistry } from './agent-registry';
import { ClaimContractEngine } from '../knowledge/claim-contract-engine';
import { TenantAuthorityService } from '../tenants/tenant-authority';
import { SecurityAuditLogger } from '../runtime/security-audit-logger';

export class A2AMessageHandler {
  public static async processIncomingMessage(message: A2AMessage): Promise<A2AProcessingResult> {
    // 1. Security & Identity Validation
    const validation = A2ASecurityValidator.validate(message);
    if (!validation.valid) {
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: message.type,
        error: {
          code: validation.errorCode || 'SECURITY_VALIDATION_FAILED',
          message: validation.errorMessage || 'Validation failed',
        },
      };
    }

    // 2. Capability Check based on Message Type
    const requiredCapability = this.getRequiredCapability(message.type);
    if (!AgentRegistry.hasCapability(message.from, requiredCapability)) {
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: message.type,
        error: {
          code: 'CAPABILITY_DENIED',
          message: `Agent '${message.from}' lacks capability grant for '${requiredCapability}'`,
        },
      };
    }

    // 3. Dispatch to Domain Handlers
    try {
      switch (message.type) {
        case 'knowledge.query':
          return await this.handleKnowledgeQuery(message);

        case 'event.escalation':
          return await this.handleEscalationEvent(message);

        case 'status.query':
          return await this.handleStatusQuery(message);

        case 'artifact.share':
          return await this.handleArtifactShare(message);

        default:
          return {
            success: false,
            messageId: message.messageId,
            correlationId: message.correlationId,
            type: message.type,
            error: {
              code: 'UNSUPPORTED_MESSAGE_TYPE',
              message: `Message type '${message.type}' is not supported by Hermes OS A2A Ingress`,
            },
          };
      }
    } catch (err: any) {
      console.error('[A2AMessageHandler] Execution error:', err);
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: message.type,
        error: {
          code: 'HANDLER_EXECUTION_ERROR',
          message: err?.message || 'Internal error processing A2A message',
        },
      };
    }
  }

  private static getRequiredCapability(type: string): string {
    switch (type) {
      case 'knowledge.query':
        return 'hermes.knowledge.query';
      case 'status.query':
        return 'hermes.status.read';
      case 'event.escalation':
        return 'hermes.escalation.create';
      case 'artifact.share':
        return 'hermes.artifact.share';
      case 'artifact.request':
        return 'hermes.artifact.request';
      default:
        return `hermes.${type}`;
    }
  }

  private static async handleKnowledgeQuery(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const tenantId = payload.tenantId || 'snarai';

    // Fetch tenant authority and claim facts
    const tenantAuth = await TenantAuthorityService.resolveCanonicalTenant(tenantId);
    const contract = await ClaimContractEngine.getOrLoadContract(tenantId);

    const facts = contract?.claims.map(c => ({
      claimId: c.claimId,
      category: c.category,
      assertion: c.canonicalAssertion,
      ipfsCid: c.provenance.ipfsCid,
    })) || [];

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'knowledge.response',
      payload: {
        tenantId,
        canonicalOrgId: tenantAuth?.canonicalOrgId || tenantId,
        projectSlug: tenantAuth?.projectSlug || tenantId,
        verifiedFactsCount: facts.length,
        contractHash: contract?.contractHash,
        ipfsCid: contract?.ipfsCid,
        claims: facts,
      },
    };
  }

  private static async handleEscalationEvent(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const priority = payload.priority || 'high';
    const summary = payload.summary || 'Escalation received from Sofia';

    // Log security audit trail for the escalation
    await SecurityAuditLogger.logEvent({
      organizationId: payload.organizationId || 'pandoras',
      actorId: `a2a:${message.from}`,
      eventType: 'A2A_ESCALATION_TRIGGERED', // Recorded on sovereign audit spine
      severity: priority === 'critical' ? 'CRITICAL' : 'WARN',
      policyDecision: 'ESCALATE',
      correlationId: message.messageId,
      metadata: {
        fromAgent: message.from,
        summary,
        details: payload.details,
      },
    });

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'knowledge.response',
      payload: {
        status: 'ESCALATION_RECORDED',
        receivedAt: new Date().toISOString(),
        auditTrackingId: message.messageId,
      },
    };
  }

  private static async handleStatusQuery(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'status.response',
      payload: {
        agent: 'hermes',
        role: 'COGNITIVE_OS',
        status: 'HEALTHY',
        activeTenants: ['snarai', 'eld', 'pandoras'],
        timestamp: new Date().toISOString(),
      },
    };
  }

  private static async handleArtifactShare(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'knowledge.response',
      payload: {
        status: 'ARTIFACT_ACKNOWLEDGED',
        cid: payload.cid,
        registeredAt: new Date().toISOString(),
      },
    };
  }
}

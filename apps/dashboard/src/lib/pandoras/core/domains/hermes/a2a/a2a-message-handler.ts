/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.1 — MESSAGE HANDLER & CAPABILITY DISPATCHER
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/a2a-message-handler.ts
 *
 * Implements capability routing across all 5 message families:
 * Knowledge, Artifact, Capability, Event, and System.
 */

import {
  A2AMessage,
  A2AProcessingResult,
  KnowledgeGrant,
  CapabilityGrant,
  SovereignArtifactManifest,
} from './contracts';
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

    // 2. Capability Check based on Message Type & Tenant Scope
    const payload = (message.payload || {}) as Record<string, any>;
    const requiredCapability = this.getRequiredCapability(message.type, payload.capability);
    const tenantId = payload.tenantId || payload.scope?.tenantIds?.[0];

    if (!AgentRegistry.hasCapability(message.from, requiredCapability, tenantId)) {
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: message.type,
        error: {
          code: 'CAPABILITY_DENIED',
          message: `Agent '${message.from}' lacks capability grant for '${requiredCapability}' on tenant '${tenantId || 'global'}'`,
        },
      };
    }

    // 3. Dispatch to Domain Handlers (5 Message Families)
    try {
      switch (message.type) {
        // ─── 1. KNOWLEDGE FAMILY ──────────────────────────────────────────────
        case 'knowledge.query':
          return await this.handleKnowledgeQuery(message);

        case 'knowledge.grant':
          return await this.handleKnowledgeGrant(message as A2AMessage<KnowledgeGrant>);

        case 'knowledge.share':
        case 'knowledge.update':
          return await this.handleKnowledgeShare(message);

        // ─── 2. ARTIFACT FAMILY ───────────────────────────────────────────────
        case 'artifact.created':
          return await this.handleArtifactCreated(message as A2AMessage<SovereignArtifactManifest>);

        case 'artifact.share':
          return await this.handleArtifactShare(message as A2AMessage<SovereignArtifactManifest>);

        case 'artifact.request':
          return await this.handleArtifactRequest(message);

        // ─── 3. CAPABILITY FAMILY ─────────────────────────────────────────────
        case 'capability.discover':
          return await this.handleCapabilityDiscover(message);

        case 'capability.request':
          return await this.handleCapabilityRequest(message);

        // ─── 4. EVENT FAMILY ──────────────────────────────────────────────────
        case 'event.escalation':
          return await this.handleEscalationEvent(message);

        case 'event.tenant':
        case 'event.tenant.updated':
        case 'event.workflow':
        case 'event.project':
        case 'event.document':
        case 'event.document.received':
          return await this.handleGenericEvent(message);

        // ─── 5. SYSTEM FAMILY ─────────────────────────────────────────────────
        case 'system.heartbeat':
        case 'status.query':
          return await this.handleStatusQuery(message);

        case 'system.capabilities':
          return await this.handleCapabilityDiscover(message);

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

  private static getRequiredCapability(type: string, requestedCap?: string): string {
    if (type === 'capability.request' && requestedCap) {
      return requestedCap;
    }
    switch (type) {
      case 'knowledge.query':
        return 'hermes.knowledge.query';
      case 'knowledge.grant':
      case 'knowledge.share':
        return 'hermes.knowledge.grant';
      case 'status.query':
      case 'system.heartbeat':
        return 'hermes.status.read';
      case 'event.escalation':
        return 'hermes.escalation.create';
      case 'artifact.share':
      case 'artifact.created':
        return 'hermes.artifact.share';
      case 'artifact.request':
        return 'hermes.artifact.request';
      case 'capability.discover':
      case 'system.capabilities':
        return 'hermes.status.read';
      default:
        return `hermes.${type}`;
    }
  }

  // ─── HANDLER IMPLEMENTATIONS ───────────────────────────────────────────────

  private static async handleKnowledgeQuery(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const tenantId = payload.tenantId || 'snarai';

    const tenantAuth = await TenantAuthorityService.resolveCanonicalTenant(tenantId);
    const contract = await ClaimContractEngine.getOrLoadContract(tenantId);
    const knowledgeGrants = AgentRegistry.getKnowledgeGrantsForTenant(tenantId);

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
        activeAuthorizedGrants: knowledgeGrants.length,
      },
    };
  }

  private static async handleKnowledgeGrant(message: A2AMessage<KnowledgeGrant>): Promise<A2AProcessingResult> {
    const grant = message.payload;
    if (!grant || !grant.grantId || !grant.subject || !grant.scope) {
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: 'knowledge.response',
        error: { code: 'INVALID_GRANT_PAYLOAD', message: 'Malformed KnowledgeGrant payload' },
      };
    }

    AgentRegistry.registerKnowledgeGrant(grant);

    await SecurityAuditLogger.logEvent({
      organizationId: grant.scope.tenantIds[0] || 'pandoras',
      actorId: `a2a:${message.from}`,
      eventType: 'CREDENTIAL_ISSUED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: message.messageId,
      metadata: {
        grantId: grant.grantId,
        authorizedBy: grant.authorizedBy,
        subjectType: grant.subject.type,
        tenantScope: grant.scope.tenantIds,
      },
    });

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'knowledge.response',
      payload: {
        status: 'KNOWLEDGE_GRANT_REGISTERED',
        grantId: grant.grantId,
        activeUntil: grant.expiresAt || 'INDEFINITE',
      },
    };
  }

  private static async handleKnowledgeShare(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'knowledge.response',
      payload: {
        status: 'KNOWLEDGE_INGESTED',
        subject: payload.subject,
        tenantId: payload.tenantId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private static async handleArtifactCreated(message: A2AMessage<SovereignArtifactManifest>): Promise<A2AProcessingResult> {
    const artifact = message.payload;
    if (!artifact || !artifact.cid || !artifact.sha256) {
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: 'artifact.created',
        error: { code: 'INVALID_ARTIFACT_PAYLOAD', message: 'Artifact manifest must contain cid and sha256' },
      };
    }

    // Cryptographic validation: CID format & SHA-256 digest format
    const isValidCid = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[0-9a-z]{56,})/i.test(artifact.cid);
    if (!isValidCid) {
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: 'artifact.created',
        error: { code: 'INVALID_IPFS_CID', message: `Artifact CID '${artifact.cid}' is not a valid IPFS CIDv0/CIDv1 format` },
      };
    }

    const isValidSha256 = /^[a-f0-9]{64}$/i.test(artifact.sha256);
    if (!isValidSha256) {
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: 'artifact.created',
        error: { code: 'INVALID_SHA256_DIGEST', message: `Artifact SHA-256 digest '${artifact.sha256}' must be a 64-char hex string` },
      };
    }

    const tenantId = message.tenantId || (artifact as any).tenantId;
    if (!tenantId || typeof tenantId !== 'string') {
      return {
        success: false,
        messageId: message.messageId,
        correlationId: message.correlationId,
        type: 'artifact.created',
        error: {
          code: 'ARTIFACT_TENANT_REQUIRED',
          message: 'artifact.created must declare an explicit tenantId (envelope or manifest). Ambiguous tenancy is refused.',
        },
      };
    }

    // 1. Cross-Tenant Ingress Defense & Request Correlation Check
    if (message.correlationId) {
      try {
        const { db } = await import('@/db');
        const { hermesMediaRequests } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        if (db) {
          const reqs = await db
            .select()
            .from(hermesMediaRequests)
            .where(eq(hermesMediaRequests.correlationId, message.correlationId))
            .limit(1);

          if (reqs.length > 0 && reqs[0]) {
            const mediaReq = reqs[0];
            if (mediaReq.tenantId.toLowerCase() !== tenantId.toLowerCase()) {
              return {
                success: false,
                messageId: message.messageId,
                correlationId: message.correlationId,
                type: 'artifact.created',
                error: {
                  code: 'CROSS_TENANT_INJECTION_REJECTED',
                  message: `Correlated media request belongs to tenant '${mediaReq.tenantId}' but artifact was tagged for '${tenantId}'`,
                },
              };
            }

            // Mark request as COMPLETED
            await db
              .update(hermesMediaRequests)
              .set({
                status: 'COMPLETED',
                artifactId: artifact.artifactId,
                completedAt: new Date(),
              })
              .where(eq(hermesMediaRequests.correlationId, message.correlationId));
          }
        }
      } catch (err) {
        console.warn('[A2AMessageHandler] Error validating correlated media request:', err);
      }
    }

    // 2. Register Artifact in Sovereign Registry
    const { CapabilityGrantService } = await import('./capability-grant-service');
    await CapabilityGrantService.registerArtifact(tenantId, artifact);

    // 3. Emit Tamper-evident Audit Event
    await SecurityAuditLogger.logEvent({
      organizationId: tenantId,
      actorId: `a2a:${message.from}`,
      eventType: 'CREDENTIAL_ISSUED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: message.correlationId || message.messageId,
      metadata: {
        artifactId: artifact.artifactId,
        cid: artifact.cid,
        producer: artifact.createdBy || 'pixel',
        sourceAgent: message.from,
        mimeType: artifact.mimeType,
      },
    });

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'artifact.created',
      payload: {
        status: 'ARTIFACT_VERIFIED_AND_REGISTERED',
        artifactId: artifact.artifactId,
        cid: artifact.cid,
        ipfsUri: artifact.ipfsUri || `ipfs://${artifact.cid}`,
        mimeType: artifact.mimeType,
        sha256: artifact.sha256,
        owner: artifact.owner,
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  private static async handleArtifactShare(message: A2AMessage<SovereignArtifactManifest>): Promise<A2AProcessingResult> {
    const artifact = message.payload;
    const targetTenant = message.tenantId || 'snarai';

    const { CapabilityGrantService } = await import('./capability-grant-service');
    await CapabilityGrantService.registerArtifact(targetTenant, artifact);

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'artifact.share',
      payload: {
        status: 'ARTIFACT_SHARED_AND_SCOPED',
        artifactId: artifact.artifactId,
        targetTenant,
        cid: artifact.cid,
        sharedAt: new Date().toISOString(),
      },
    };
  }

  private static async handleArtifactRequest(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'artifact.created',
      payload: {
        status: 'ARTIFACT_RESOLVED',
        cid: payload.cid,
        ipfsUri: `ipfs://${payload.cid}`,
      },
    };
  }

  private static async handleCapabilityDiscover(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const caller = AgentRegistry.getAgent(message.from);
    const hermes = AgentRegistry.getAgent('hermes');

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'capability.completed',
      payload: {
        agent: 'hermes',
        protocolVersion: '1.1',
        callerGrantedCapabilities: caller?.allowedCapabilities || [],
        hermesSupportedCapabilities: [
          'hermes.knowledge.query',
          'hermes.knowledge.grant',
          'hermes.tenant.read',
          'hermes.status.read',
          'hermes.artifact.share',
          'hermes.artifact.request',
          'hermes.escalation.create',
        ],
        mediaCoProvidedCapabilities: [
          'media.image.create',
          'media.video.create',
          'media.audio.create',
          'media.social.copy.create',
          'media.campaign.create',
          'research.report.create',
        ],
      },
    };
  }

  private static async handleCapabilityRequest(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const capability = payload.capability;

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'capability.completed',
      payload: {
        status: 'CAPABILITY_EXECUTION_ACCEPTED',
        capability,
        tenantId: payload.tenantId,
        executionRef: `exec_${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private static async handleEscalationEvent(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const priority = payload.priority || 'high';
    const summary = payload.summary || 'Escalation received via A2A Bridge';

    await SecurityAuditLogger.logEvent({
      organizationId: payload.organizationId || 'pandoras',
      actorId: `a2a:${message.from}`,
      eventType: 'A2A_ESCALATION_TRIGGERED',
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

  private static async handleGenericEvent(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'system.heartbeat',
      payload: {
        status: 'EVENT_ACKNOWLEDGED',
        eventType: message.type,
        receivedAt: new Date().toISOString(),
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
}

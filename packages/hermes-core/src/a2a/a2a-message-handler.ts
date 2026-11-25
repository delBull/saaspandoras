/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.1 — MESSAGE HANDLER & CAPABILITY DISPATCHER
 * apps/dashboard/src/lib/@/a2a/a2a-message-handler.ts
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
import { COMMUNITY_CAPABILITIES } from '../community/community-capabilities';
import { buildCommunityDigest, createCommunityProposal } from '../community/community-gateway';
import { db } from "@saasfly/db-core";
import { hermesAgentSkills } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";

export class A2AMessageHandler {
  public static async processIncomingMessage(message: A2AMessage): Promise<A2AProcessingResult> {
    // 1. Security & Identity Validation
    const validation = await A2ASecurityValidator.validateAsync(message);
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

    const hasCap = await AgentRegistry.hasCapabilityAsync(message.from, requiredCapability, tenantId);
    if (!hasCap) {
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
        case 'sofia.context.request':
          return await this.handleSofiaContextRequest(message);
        case 'sofia.contact.sync':
          return await this.handleSofiaContactSync(message);
        // ─── 1. KNOWLEDGE FAMILY ──────────────────────────────────────────────
        case 'knowledge.query':
          return await this.handleKnowledgeQuery(message);

        case 'contacts.query':
          return await this.handleContactsQuery(message);

        case 'deals.query':
          return await this.handleDealsQuery(message);

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

        case 'event.contact':
          return await this.handleContactEvent(message);

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
      case 'sofia.context.request':
        return 'hermes.knowledge.query';
      case 'contacts.query':
        return 'hermes.contacts.read';
      case 'deals.query':
        return 'hermes.deals.read';
      case 'knowledge.grant':
      case 'knowledge.share':
      case 'sofia.contact.sync':
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

    // Hechos gobernados (hermes_knowledge ACTIVE con contenido), filtrados por el
    // techo de clasificación del agente solicitante. Aditivo: `claims` se mantiene.
    const canonicalOrgId = tenantAuth?.canonicalOrgId || tenantId;
    const governed = await this.readGovernedKnowledge(message.from, canonicalOrgId);

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'knowledge.response',
      payload: {
        tenantId,
        canonicalOrgId,
        projectSlug: tenantAuth?.projectSlug || tenantId,
        verifiedFactsCount: facts.length,
        contractHash: contract?.contractHash,
        ipfsCid: contract?.ipfsCid,
        claims: facts,
        governedFacts: governed.facts,
        governedFactsCount: governed.facts.length,
        excludedByClearance: governed.excluded,
        knowledgeCeiling: governed.ceiling,
        activeAuthorizedGrants: knowledgeGrants.length,
      },
    };
  }

  /**
   * Lectura gobernada de `hermes_knowledge` para agentes A2A.
   *
   * Reglas (no negociables):
   *  - sólo `status = ACTIVE` y con `content` (los hechos sin contenido no son
   *    legibles: el texto vive en un vault IPFS que hoy no responde);
   *  - sólo hasta el techo `maxClearance` del agente (sin techo ⇒ PUBLIC);
   *  - sólo la organización canónica solicitada;
   *  - `excluded` informa cuántos quedaron fuera por clasificación, nunca su texto.
   */
  private static async readGovernedKnowledge(
    agentId: string,
    canonicalOrgId: string,
  ): Promise<{ facts: Array<Record<string, unknown>>; excluded: number; ceiling: string }> {
    const { CLASSIFICATION_LATTICE_RANK } = await import('../runtime/contracts');
    const entry = await AgentRegistry.getAgentAsync(agentId as any);
    const ceiling = (entry?.maxClearance || 'PUBLIC').toUpperCase();
    const maxRank = CLASSIFICATION_LATTICE_RANK[ceiling as keyof typeof CLASSIFICATION_LATTICE_RANK] ?? 1;

    const { hermesKnowledge } = await import('@saasfly/db-core');
    const { and, eq, isNotNull } = await import('@saasfly/db-core');

    const rows = await db
      .select({
        key: hermesKnowledge.key,
        dimension: hermesKnowledge.dimension,
        classification: hermesKnowledge.classification,
        content: hermesKnowledge.content,
        version: hermesKnowledge.version,
        updatedAt: hermesKnowledge.updatedAt,
      })
      .from(hermesKnowledge)
      .where(and(
        eq(hermesKnowledge.organizationId, canonicalOrgId),
        eq(hermesKnowledge.status, 'ACTIVE'),
        isNotNull(hermesKnowledge.content),
      ))
      .limit(200);

    const visible: Array<Record<string, unknown>> = [];
    let excluded = 0;
    for (const row of rows) {
      const rank = CLASSIFICATION_LATTICE_RANK[row.classification as keyof typeof CLASSIFICATION_LATTICE_RANK] ?? 1;
      if (rank > maxRank) { excluded++; continue; }
      visible.push({
        key: row.key,
        dimension: row.dimension,
        classification: row.classification,
        version: row.version,
        updatedAt: row.updatedAt,
        content: row.content,
      });
    }

    await SecurityAuditLogger.logEvent({
      organizationId: canonicalOrgId,
      actorId: `a2a:${agentId}`,
      eventType: 'A2A_MESSAGE_RECEIVED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: `knowledge_read_${Date.now()}`,
      metadata: { scope: 'knowledge', ceiling, returned: visible.length, excludedByClearance: excluded },
    });

    return { facts: visible, excluded, ceiling };
  }

  /**
   * Contactos del Fundador: fichas de Deal Pods + colaboradores del ecosistema.
   * Sólo lectura. Nunca expone tokens, permisos granulares ni secretos de canal.
   */
  private static async handleContactsQuery(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const requestedOrg = String(payload.tenantId || 'pandoras');
    const tenantAuth = await TenantAuthorityService.resolveCanonicalTenant(requestedOrg);
    const canonicalOrgId = tenantAuth?.canonicalOrgId || 'pandoras';

    const { nexusPodContacts, nexusDealPods, nexusCollaborators } = await import('@saasfly/db-core');
    const { eq } = await import('@saasfly/db-core');

    const podContacts = await db
      .select({
        name: nexusPodContacts.name,
        role: nexusPodContacts.role,
        relationship: nexusPodContacts.relationship,
        phone: nexusPodContacts.phone,
        email: nexusPodContacts.email,
        context: nexusPodContacts.context,
        podCode: nexusDealPods.code,
        podName: nexusDealPods.displayName,
        updatedAt: nexusPodContacts.updatedAt,
      })
      .from(nexusPodContacts)
      .leftJoin(nexusDealPods, eq(nexusPodContacts.podId, nexusDealPods.id))
      .where(eq(nexusPodContacts.canonicalOrgId, canonicalOrgId))
      .limit(200);

    const collaborators = await db
      .select({
        name: nexusCollaborators.name,
        role: nexusCollaborators.role,
        email: nexusCollaborators.email,
        whatsappPhone: nexusCollaborators.whatsappPhone,
        status: nexusCollaborators.status,
      })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.canonicalOrgId, canonicalOrgId))
      .limit(100);

    await SecurityAuditLogger.logEvent({
      organizationId: canonicalOrgId,
      actorId: `a2a:${message.from}`,
      eventType: 'A2A_MESSAGE_RECEIVED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: message.messageId,
      metadata: {
        scope: 'contacts',
        podContacts: podContacts.length,
        collaborators: collaborators.length,
      },
    });

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'knowledge.response',
      payload: {
        status: 'CONTACTS_SHARED',
        tenantId: requestedOrg,
        canonicalOrgId,
        podContacts,
        collaborators,
        counts: { podContacts: podContacts.length, collaborators: collaborators.length },
      },
    };
  }

  /**
   * Deal Rooms de Pandora's (lectura). El scope es deliberadamente el del
   * Fundador: si el tenant solicitado no es `pandoras`, se devuelve vacío en
   * lugar de mezclar operaciones de otros tenants.
   */
  private static async handleDealsQuery(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const requestedOrg = String(payload.tenantId || 'pandoras');
    const tenantAuth = await TenantAuthorityService.resolveCanonicalTenant(requestedOrg);
    const canonicalOrgId = tenantAuth?.canonicalOrgId || requestedOrg;

    if (canonicalOrgId !== 'pandoras') {
      return {
        success: true,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'knowledge.response',
        payload: {
          status: 'NO_DEALS_IN_SCOPE',
          tenantId: requestedOrg,
          canonicalOrgId,
          rooms: [],
          pods: [],
          reason: 'DEALS_SCOPE_PANDORAS_ONLY',
        },
      };
    }

    const { nexusDealRooms, nexusDealPods } = await import('@saasfly/db-core');

    const rooms = await db
      .select({
        publicId: nexusDealRooms.publicId,
        kind: nexusDealRooms.kind,
        status: nexusDealRooms.status,
        title: nexusDealRooms.title,
        counterparty: nexusDealRooms.counterparty,
        company: nexusDealRooms.company,
        summary: nexusDealRooms.summary,
        ndaEnabled: nexusDealRooms.ndaEnabled,
        pofEnabled: nexusDealRooms.pofEnabled,
        createdAt: nexusDealRooms.createdAt,
        updatedAt: nexusDealRooms.updatedAt,
      })
      .from(nexusDealRooms)
      .limit(200);

    const pods = await db
      .select({
        code: nexusDealPods.code,
        displayName: nexusDealPods.displayName,
        status: nexusDealPods.status,
        confidentiality: nexusDealPods.confidentiality,
        currency: nexusDealPods.currency,
      })
      .from(nexusDealPods)
      .limit(50);

    await SecurityAuditLogger.logEvent({
      organizationId: canonicalOrgId,
      actorId: `a2a:${message.from}`,
      eventType: 'A2A_MESSAGE_RECEIVED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: message.messageId,
      metadata: { scope: 'deals', rooms: rooms.length, pods: pods.length },
    });

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'knowledge.response',
      payload: {
        status: 'DEALS_SHARED',
        tenantId: requestedOrg,
        canonicalOrgId,
        rooms,
        pods,
        counts: { rooms: rooms.length, pods: pods.length },
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
        const { db } = await import('@saasfly/db-core');
        const { hermesMediaRequests } = await import('@saasfly/db-core');
        const { eq } = await import("@saasfly/db-core");
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

            // Cerrar el INTENTO de generación. Sin esto, `awaitSofiaResult`
            // (que sondea hermes_generation_attempts) expira, el job queda
            // UNKNOWN y la reserva de crédito se congela aunque Sofía sí generó.
            const { closeGenerationAttemptForArtifact } = await import('./artifact-attempt-link');
            await closeGenerationAttemptForArtifact({
              tenantId: mediaReq.tenantId,
              requestId: mediaReq.id,
              artifactId: artifact.artifactId,
              dbClient: db,
            });
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

    // 3b. Emit outbound `capability.completed` to Media Co so its dashboard reflects
    //     finalized generations. Fire-and-forget + fail-safe behind
    //     A2A_OUTBOUND_EVENTS_ENABLED=true.
    if (process.env.A2A_OUTBOUND_EVENTS_ENABLED === 'true') {
      try {
        const { A2AOutboundDispatcher } = await import('./a2a-outbound-dispatcher');
        const capability = (artifact.metadata?.capability as string | undefined) || 'media.asset.create';
        A2AOutboundDispatcher.dispatch(
          'capability.completed',
          {
            grantId: message.correlationId || artifact.artifactId,
            tenantId,
            providerId: 'pandoras-media-co',
            granteeAgentId: 'sofia',
            capability,
            artifactId: artifact.artifactId,
            cid: artifact.cid,
            ipfsUri: artifact.ipfsUri || `ipfs://${artifact.cid}`,
            sha256: artifact.sha256,
            mimeType: artifact.mimeType,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          },
          { tenantId, correlationId: message.correlationId }
        ).catch(err => console.warn('[A2AMessageHandler] capability.completed dispatch warning:', err));
      } catch (err) {
        console.warn('[A2AMessageHandler] capability.completed emission error:', err);
      }
    }

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
    const caller = await AgentRegistry.getAgentAsync(message.from);
    const hermes = await AgentRegistry.getAgentAsync('hermes');

    // Load available shared skills from the Cognitive Hub Repository (DB)
    let sharedSkills: string[] = [];
    try {
      const skillsRecords = await db.select({ name: hermesAgentSkills.capabilityName })
        .from(hermesAgentSkills)
        .where(eq(hermesAgentSkills.isActive, true));
      sharedSkills = skillsRecords.map(r => r.name);
    } catch (err) {
      console.warn('[A2AMessageHandler] Failed to query shared skills:', err);
    }

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
        harnessSharedSkills: sharedSkills,
      },
    };
  }

  /**
   * Despacho real de capacidades (ADR-019).
   *
   * Antes esta función respondía "ACCEPTED" sin ejecutar nada. Ahora:
   *  - `community.report` lee el embudo (solo lectura).
   *  - `community.publish_post` valida contra la política del tenant y crea una
   *    aprobación; NO publica.
   *  - Cualquier otra capacidad falla cerrada (`CAPABILITY_NOT_IMPLEMENTED`).
   */
  private static async handleCapabilityRequest(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const capability = String(payload.capability || '');
    const canonicalOrgId = String(payload.canonicalOrgId || payload.tenantId || 'snarai');
    const projectId = Number(payload.projectId ?? 17);

    if (capability === COMMUNITY_CAPABILITIES.REPORT) {
      const digest = await buildCommunityDigest({
        projectId,
        canonicalOrgId,
        windowDays: Number(payload.windowDays) || undefined,
      });
      await SecurityAuditLogger.logEvent({
        organizationId: canonicalOrgId,
        actorId: `a2a:${message.from}`,
        eventType: 'A2A_MESSAGE_RECEIVED',
        severity: 'INFO',
        policyDecision: 'ALLOW',
        correlationId: message.messageId,
        metadata: { capability, scope: 'community.report', stages: digest.funnel.length, links: digest.links.length },
      }).catch(() => {});
      return {
        success: true,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'capability.completed',
        payload: { status: 'REPORT_READY', capability, digest },
      };
    }

    if (capability === COMMUNITY_CAPABILITIES.PROPOSE_PUBLISH) {
      const result = await createCommunityProposal({
        canonicalOrgId,
        projectId,
        posts: Array.isArray(payload.posts) ? payload.posts : [],
        requestedBy: `a2a:${message.from}`,
        intent: typeof payload.intent === 'string' ? payload.intent : undefined,
        proposalKey: typeof payload.proposalKey === 'string' ? payload.proposalKey : undefined,
      });
      await SecurityAuditLogger.logEvent({
        organizationId: canonicalOrgId,
        actorId: `a2a:${message.from}`,
        eventType: 'A2A_MESSAGE_RECEIVED',
        severity: result.status === 'REJECTED_BY_POLICY' ? 'WARN' : 'INFO',
        policyDecision: result.status === 'REJECTED_BY_POLICY' ? 'DENY' : 'ESCALATE',
        correlationId: message.messageId,
        metadata: {
          capability,
          status: result.status,
          posts: Array.isArray(payload.posts) ? payload.posts.length : 0,
          approvalId: result.status === 'PENDING_APPROVAL' ? result.approvalId : undefined,
          violations: result.status === 'REJECTED_BY_POLICY' ? result.violations.slice(0, 5) : undefined,
        },
      }).catch(() => {});
      return {
        success: true,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'capability.completed',
        payload: { capability, ...result },
      };
    }

    // ── Redes sociales (ADR-020): la propuesta es la misma, cambia la plataforma ──
    const socialMatch = /^media\.publish\.channel:(instagram|facebook)$/.exec(capability);
    if (socialMatch) {
      const platform = socialMatch[1] as 'instagram' | 'facebook';
      const result = await createCommunityProposal({
        canonicalOrgId,
        projectId,
        posts: [{
          channel: String(payload.channel || payload.handle || '').trim(),
          text: String(payload.text || ''),
          platform,
          imageUrl: typeof payload.imageUrl === 'string' ? payload.imageUrl : undefined,
        }],
        requestedBy: `a2a:${message.from}`,
        intent: typeof payload.intent === 'string' ? payload.intent : `Publicación en ${platform}`,
        proposalKey: typeof payload.proposalKey === 'string' ? payload.proposalKey : undefined,
      });

      await SecurityAuditLogger.logEvent({
        organizationId: canonicalOrgId,
        actorId: `a2a:${message.from}`,
        eventType: 'A2A_MESSAGE_RECEIVED',
        severity: result.status === 'REJECTED_BY_POLICY' ? 'WARN' : 'INFO',
        policyDecision: result.status === 'REJECTED_BY_POLICY' ? 'DENY' : 'ESCALATE',
        correlationId: message.messageId,
        metadata: {
          capability,
          platform,
          status: result.status,
          approvalId: result.status === 'PENDING_APPROVAL' ? result.approvalId : undefined,
          violations: result.status === 'REJECTED_BY_POLICY' ? result.violations.slice(0, 5) : undefined,
        },
      }).catch(() => {});

      return {
        success: true,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'capability.completed',
        payload: { capability, platform, ...result },
      };
    }

    return {
      success: false,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'error',
      error: {
        code: 'CAPABILITY_NOT_IMPLEMENTED',
        message: `La capacidad '${capability}' no está implementada en el Action Gateway.`,
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

  // ─── SOFIA CONTEXT SYNC (IPFS + Cognitive Profile) ─────────────────

  /**
   * Uploads a JSON payload to the Sovereign IPFS Vault (Railway node).
   * Falls back to a deterministic LOCAL sha-256 reference when the node is
   * unreachable (offline/deploy), so Sofía still receives a resolvable content
   * address. Honest storage reporting via `storage: 'IPFS' | 'LOCAL'`.
   */
  private static async uploadJsonToIPFS(json: any): Promise<{
    cid: string;
    storage: 'IPFS' | 'LOCAL';
    uri: string | null;
  }> {
    const ipfsNodeUrl = process.env.RAILWAY_IPFS_URL || 'https://rpc.ipfs.pandoras.finance';
    try {
      const bytes = Buffer.from(JSON.stringify(json), 'utf-8');
      const fd = new FormData();
      fd.append('file', new Blob([bytes], { type: 'application/json' }), 'profile.json');
      const res = await fetch(`${ipfsNodeUrl}/api/v0/add`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`IPFS node HTTP ${res.status}`);
      const data = (await res.json()) as { Hash: string };
      return { cid: data.Hash, storage: 'IPFS', uri: `ipfs://${data.Hash}` };
    } catch (err) {
      console.warn('[A2A Sofía] IPFS node unreachable — using LOCAL content hash.', err);
      const hashBuf = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(JSON.stringify(json)),
      );
      const sha = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return { cid: `local_sha256_${sha.slice(0, 32)}`, storage: 'LOCAL', uri: null };
    }
  }

  /**
   * Core merge: upserts a contact/identity payload into hermesCognitiveProfiles.
   * Shared by sofia.contact.sync and event.contact. Behavioral traits are merged
   * as a union preserving previously learned traits. Governance: writes are
   * tenant-scoped by identityId and never override transactional learning blindly.
   */
  private static async mergeContactIntoProfile(payload: any): Promise<{
    userId: string;
    profileId: string;
    mergedTraits: string[];
    status: 'CREATED' | 'UPDATED';
  }> {
    const userId = String(payload.identityId || payload.userId || payload.contactId || '');
    if (!userId) throw new Error('identityId/userId required');

    const { db } = await import('@saasfly/db-core');
    const { hermesCognitiveProfiles } = await import('@saasfly/db-core');
    const { eq } = await import("@saasfly/db-core");

    const [existing] = await db
      .select()
      .from(hermesCognitiveProfiles)
      .where(eq(hermesCognitiveProfiles.userId, userId))
      .limit(1);

    const incomingTraits: string[] = Array.isArray(payload.traits)
      ? payload.traits.map((t: any) => (typeof t === 'string' ? t : JSON.stringify(t)))
      : [];
    const existingTraits = existing?.behavioralTraits || [];
    const mergedTraits = Array.from(new Set([...existingTraits, ...incomingTraits]));
    const persona = typeof payload.persona === 'string' ? payload.persona : existing?.persona || 'UNKNOWN';
    const optimalApproach =
      typeof payload.optimalApproach === 'string' ? payload.optimalApproach : existing?.optimalApproach;

    const values = {
      userId,
      behavioralTraits: mergedTraits,
      persona,
      optimalApproach,
      ...(Number.isFinite(payload.transactionalScore) ? { transactionalScore: Number(payload.transactionalScore) } : {}),
      ...(Number.isFinite(payload.educationalScore) ? { educationalScore: Number(payload.educationalScore) } : {}),
      lastInteractionAt: new Date(),
    };

    const [upserted] = await db
      .insert(hermesCognitiveProfiles)
      .values(values)
      .onConflictDoUpdate({
        target: hermesCognitiveProfiles.userId,
        set: {
          behavioralTraits: mergedTraits,
          ...(persona ? { persona } : {}),
          ...(optimalApproach !== undefined ? { optimalApproach: optimalApproach ?? null } : {}),
          ...(Number.isFinite(payload.transactionalScore) ? { transactionalScore: Number(payload.transactionalScore) } : {}),
          ...(Number.isFinite(payload.educationalScore) ? { educationalScore: Number(payload.educationalScore) } : {}),
          lastInteractionAt: new Date(),
        },
      })
      .returning({ id: hermesCognitiveProfiles.id });

    return {
      userId,
      profileId: upserted?.id || existing?.id || userId,
      mergedTraits,
      status: existing ? 'UPDATED' : 'CREATED',
    };
  }

  private static async handleSofiaContextRequest(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const identityId = payload.identityId;
    const organizationId = payload.tenantId || 'pandoras';

    if (!identityId) {
      return {
        success: false,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'error',
        error: { code: 'BAD_REQUEST', message: 'identityId required' }
      };
    }

    const { db } = await import('@saasfly/db-core');
    const { hermesCognitiveProfiles } = await import('@saasfly/db-core');
    const { eq } = await import("@saasfly/db-core");

    const [profile] = await db.select().from(hermesCognitiveProfiles).where(eq(hermesCognitiveProfiles.userId, identityId)).limit(1);

    // Publish to the Sovereign IPFS Vault (real node, LOCAL fallback if offline)
    const profileJson = profile
      ? {
          identityId,
          organizationId,
          profile: {
            persona: profile.persona,
            transactionalScore: profile.transactionalScore,
            educationalScore: profile.educationalScore,
            behavioralTraits: profile.behavioralTraits,
            optimalApproach: profile.optimalApproach,
            lastInteractionAt: profile.lastInteractionAt,
          },
        }
      : { identityId, organizationId, status: 'NOT_FOUND' };

    const { cid, storage, uri } = await this.uploadJsonToIPFS(profileJson);

    return {
      success: true,
      messageId: `resp_${crypto.randomUUID()}`,
      correlationId: message.messageId,
      type: 'sofia.context.response',
      payload: {
        status: 'CONTEXT_SHARED',
        cid,
        ipfsUri: uri,
        storage,
        profileFound: !!profile,
        profile: profile
          ? {
              persona: profile.persona,
              transactionalScore: profile.transactionalScore,
              educationalScore: profile.educationalScore,
              behavioralTraits: profile.behavioralTraits,
            }
          : null,
      },
    };
  }

  private static async handleSofiaContactSync(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    const cid = payload.cid;
    const identityId = payload.identityId || payload.userId || payload.contactId;

    if (!cid && !identityId) {
      return {
        success: false,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'error',
        error: { code: 'BAD_REQUEST', message: 'cid or identityId required' }
      };
    }

    try {
      const result = await this.mergeContactIntoProfile(payload);

      return {
        success: true,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'sofia.contact.synced',
        payload: {
          status: 'CONTEXT_MERGED',
          profileId: result.profileId,
          identityId: result.userId,
          syncedTraitsCount: result.mergedTraits.length,
          mergedFromCid: cid || null,
          profileStatus: result.status,
        },
      };
    } catch (err: any) {
      console.error('[A2A Sofía] contact.sync merge failed:', err);
      return {
        success: false,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'error',
        error: { code: 'MERGE_FAILED', message: err?.message || 'Profile merge failed' },
      };
    }
  }

  private static async handleContactEvent(message: A2AMessage<any>): Promise<A2AProcessingResult> {
    const payload = message.payload || {};
    try {
      const result = await this.mergeContactIntoProfile(payload);
      return {
        success: true,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'system.heartbeat',
        payload: {
          status: 'EVENT_ACKNOWLEDGED',
          eventType: message.type,
          profileId: result.profileId,
          identityId: result.userId,
          traitsMerged: result.mergedTraits.length,
          receivedAt: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      return {
        success: false,
        messageId: `resp_${crypto.randomUUID()}`,
        correlationId: message.messageId,
        type: 'error',
        error: { code: 'MERGE_FAILED', message: err?.message || 'Contact event merge failed' },
      };
    }
  }
}

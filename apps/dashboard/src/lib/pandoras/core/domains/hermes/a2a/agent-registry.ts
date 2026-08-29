/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.1 — AGENT REGISTRY & CAPABILITY MANAGER
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/agent-registry.ts
 *
 * Authoritative registry of sovereign agents, capability grants, and knowledge grants.
 */

import { AgentId, AgentRegistryEntry, CapabilityGrant, KnowledgeGrant } from './contracts';

export class AgentRegistry {
  private static registry: Map<AgentId, AgentRegistryEntry> = new Map();
  private static capabilityGrants: Map<string, CapabilityGrant> = new Map();
  private static knowledgeGrants: Map<string, KnowledgeGrant> = new Map();

  static {
    this.initDefaultRegistry();
  }

  private static initDefaultRegistry(): void {
    const sofiaWallet = (process.env.SOFIA_WALLET_ADDRESS || '0x19F3e224b55ff38c33a577E43000f83B14207f8e').toLowerCase();
    const hermesWallet = (process.env.HERMES_WALLET_ADDRESS || '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa').toLowerCase();

    // 👩🏻 SOFÍA — Media Co / Chief of Staff Agent
    this.registry.set('sofia', {
      agentId: 'sofia',
      displayName: "Sofía (Pandora's Media Co Chief of Staff)",
      organizationId: 'pandoras-media',
      role: 'CHIEF_OF_STAFF',
      walletAddress: sofiaWallet,
      endpoint: process.env.SOFIA_BRIDGE_WEBHOOK_URL || 'https://bullss-mac-mini.taild7a2e2.ts.net/api/v1/sofia/a2a/webhook',
      protocolVersion: '1.1',
      status: 'ACTIVE',
      allowedCapabilities: [
        // Hermes capabilities Sofia can invoke
        'hermes.status.read',
        'hermes.knowledge.query',
        'hermes.knowledge.grant',
        'hermes.tenant.read',
        'hermes.artifact.share',
        'hermes.artifact.request',
        'hermes.escalation.create',
        // Media Co capabilities Sofia provides to Hermes
        'media.image.create',
        'media.video.create',
        'media.audio.create',
        'media.social.copy.create',
        'media.campaign.create',
        'research.web.search',
        'research.report.create',
        'editorial.article.create',
      ],
    });

    // 🧠 HERMES — Cognitive Operating System
    this.registry.set('hermes', {
      agentId: 'hermes',
      displayName: "Hermes OS (Pandora's Growth OS)",
      organizationId: 'pandoras',
      role: 'COGNITIVE_OS',
      walletAddress: hermesWallet,
      endpoint: 'https://dash.pandoras.finance/api/v1/a2a/messages',
      protocolVersion: '1.1',
      status: 'ACTIVE',
      allowedCapabilities: [
        'sofia.notify',
        'sofia.contact.sync',
        'sofia.context.request',
        'media.image.create',
        'media.video.create',
        'media.social.copy.create',
        'research.report.create',
      ],
    });
  }

  public static getAgent(agentId: AgentId): AgentRegistryEntry | undefined {
    return this.registry.get(agentId);
  }

  public static getAllAgents(): AgentRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  public static isAgentActive(agentId: AgentId): boolean {
    const entry = this.getAgent(agentId);
    return Boolean(entry && entry.status === 'ACTIVE');
  }

  public static hasCapability(agentId: AgentId, capability: string, tenantId?: string): boolean {
    const entry = this.getAgent(agentId);
    if (!entry || entry.status !== 'ACTIVE') return false;

    // Provider agents (e.g. Sofia) provide capabilities from their declared catalog
    if (agentId === 'sofia' && !tenantId) {
      return entry.allowedCapabilities.includes(capability) || entry.allowedCapabilities.includes('*');
    }

    // Consumer agents (e.g. Hermes) requesting tenant media capabilities strictly require an active CapabilityGrant
    if (tenantId && (capability.startsWith('media.') || capability.startsWith('research.'))) {
      for (const grant of this.capabilityGrants.values()) {
        if (grant.capability === capability) {
          if (grant.expiresAt && Date.now() > new Date(grant.expiresAt).getTime()) {
            continue;
          }
          if (grant.scope.tenantIds && (grant.scope.tenantIds.includes(tenantId) || grant.scope.tenantIds.includes('*'))) {
            return true;
          }
        }
      }
      return false;
    }

    // Check baseline capabilities for system-level messages
    const hasBaseline = entry.allowedCapabilities.includes(capability) || entry.allowedCapabilities.includes('*');
    if (hasBaseline) return true;

    // Check dynamic CapabilityGrants
    for (const grant of this.capabilityGrants.values()) {
      if (grant.grantee === agentId && grant.capability === capability) {
        if (grant.expiresAt && Date.now() > new Date(grant.expiresAt).getTime()) {
          continue;
        }
        if (tenantId && grant.scope.tenantIds && !grant.scope.tenantIds.includes(tenantId) && !grant.scope.tenantIds.includes('*')) {
          continue;
        }
        return true;
      }
    }

    return false;
  }

  public static registerCapabilityGrant(grant: CapabilityGrant): void {
    this.capabilityGrants.set(grant.grantId, grant);
  }

  public static revokeCapabilityGrant(grantId: string): void {
    this.capabilityGrants.delete(grantId);
  }

  public static registerKnowledgeGrant(grant: KnowledgeGrant): void {
    this.knowledgeGrants.set(grant.grantId, grant);
  }

  public static getKnowledgeGrantsForTenant(tenantId: string): KnowledgeGrant[] {
    const now = Date.now();
    return Array.from(this.knowledgeGrants.values()).filter(g => {
      if (g.expiresAt && now > new Date(g.expiresAt).getTime()) return false;
      return g.scope.tenantIds.includes(tenantId) || g.scope.tenantIds.includes('*');
    });
  }
}

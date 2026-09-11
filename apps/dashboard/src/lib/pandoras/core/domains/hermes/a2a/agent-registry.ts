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
    const sofiaWallet = (process.env.SOFIA_WALLET_ADDRESS || process.env.A2A_SOFIA_WALLET || '0x19F3e224b55ff38c33a577E43000f83B14207f8e').toLowerCase();
    const hermesWallet = (process.env.HERMES_WALLET_ADDRESS || '0x76CA36103286dd320981133826425270e9902722').toLowerCase();

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
        'media.plan',
        'media.create',
        'media.publish.channel:x',
        'media.publish.channel:telegram',
        'media.publish.channel:newsletter',
        'media.publish.channel:instagram',
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
        'demand.plan',
        'demand.propose',
        'demand.approve',
        'demand.distribute',
        'media.plan',
        'media.create',
        'media.publish.channel:x',
        'media.publish.channel:telegram',
        'media.publish.channel:newsletter',
        'media.publish.channel:instagram',
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

  public static async getAgentAsync(agentId: string): Promise<AgentRegistryEntry | undefined> {
    // 1. Check in-memory hardcoded agents first (Sofia, Hermes)
    const memAgent = this.registry.get(agentId as AgentId);
    if (memAgent) return memAgent;

    // 2. Fallback to Database for dynamic agents
    try {
      const { db } = await import('@/db');
      const { hermesAgents } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      const [dbAgent] = await db.select().from(hermesAgents).where(eq(hermesAgents.agentId, agentId)).limit(1);
      
      if (dbAgent && dbAgent.isActive) {
        return {
          agentId: dbAgent.agentId as AgentId,
          displayName: dbAgent.name,
          organizationId: 'external',
          role: 'EXTERNAL_AGENT' as any,
          walletAddress: dbAgent.walletAddress || '',
          endpoint: '', // Optional for dynamic clients that only call in
          protocolVersion: '1.1',
          status: 'ACTIVE',
          allowedCapabilities: dbAgent.capabilities as string[],
        };
      }
    } catch (err) {
      console.error('[AgentRegistry] Failed to fetch dynamic agent from DB:', err);
    }
    
    return undefined;
  }

  /**
   * Returns the AES-256-GCM encrypted HMAC secret for a dynamic agent.
   * Used by A2ASecurityValidator for bilateral HMAC verification.
   * Returns null for hardcoded agents (sofia/hermes) — they use A2A_HMAC_SECRET env var.
   */
  public static async getAgentSecretEncrypted(agentId: string): Promise<string | null> {
    // Hardcoded agents never have a DB encrypted secret — they use shared env var
    if (this.registry.has(agentId as AgentId)) return null;

    try {
      const { db } = await import('@/db');
      const { hermesAgents } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      const [dbAgent] = await db
        .select({ hmacSecretEncrypted: hermesAgents.hmacSecretEncrypted, isActive: hermesAgents.isActive })
        .from(hermesAgents)
        .where(eq(hermesAgents.agentId, agentId))
        .limit(1);

      if (dbAgent?.isActive && dbAgent.hmacSecretEncrypted) {
        return dbAgent.hmacSecretEncrypted;
      }
    } catch (err) {
      console.error('[AgentRegistry] Failed to fetch agent secret from DB:', err);
    }
    return null;
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
      return false; // Fail closed for tenant media/research without grant
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

  public static async hasCapabilityAsync(agentId: string, capability: string, tenantId?: string): Promise<boolean> {
    const entry = await this.getAgentAsync(agentId);
    if (!entry || entry.status !== 'ACTIVE') return false;

    // If it's a known static agent, fallback to the synchronous logic
    if (agentId === 'sofia' || agentId === 'hermes') {
      return this.hasCapability(agentId as AgentId, capability, tenantId);
    }

    // For dynamic external agents, check their allowed capabilities array
    return entry.allowedCapabilities.includes(capability) || entry.allowedCapabilities.includes('*');
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

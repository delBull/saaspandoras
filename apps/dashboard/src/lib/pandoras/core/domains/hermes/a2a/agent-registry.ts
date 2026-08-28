/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.0 — AGENT REGISTRY
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/agent-registry.ts
 *
 * Authoritative registry of known sovereign agents and their capability grants.
 */

import { AgentId, AgentRegistryEntry } from './contracts';

export class AgentRegistry {
  private static registry: Map<AgentId, AgentRegistryEntry> = new Map();

  static {
    this.initDefaultRegistry();
  }

  private static initDefaultRegistry(): void {
    const sofiaWallet = (process.env.SOFIA_WALLET_ADDRESS || '0x438676d1eec366838848fa5cf78e63ee9a3d4669').toLowerCase();
    const hermesWallet = (process.env.HERMES_WALLET_ADDRESS || '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa').toLowerCase();

    // 👩🏻 SOFÍA — Media Co / Chief of Staff Agent
    this.registry.set('sofia', {
      agentId: 'sofia',
      displayName: 'Sofía (Pandora\'s Media Co)',
      organizationId: 'pandoras-media',
      role: 'CHIEF_OF_STAFF',
      walletAddress: sofiaWallet,
      endpoint: process.env.SOFIA_BRIDGE_WEBHOOK_URL || 'https://sofia-api.up.railway.app/bridge/webhook',
      protocolVersion: '1.0',
      status: 'ACTIVE',
      allowedCapabilities: [
        'hermes.status.read',
        'hermes.knowledge.query',
        'hermes.tenant.read',
        'hermes.escalation.create',
        'hermes.artifact.share',
        'hermes.artifact.request',
      ],
    });

    // 🧠 HERMES — Cognitive Operating System
    this.registry.set('hermes', {
      agentId: 'hermes',
      displayName: 'Hermes OS (Pandora\'s Growth OS)',
      organizationId: 'pandoras',
      role: 'COGNITIVE_OS',
      walletAddress: hermesWallet,
      endpoint: 'https://dash.pandoras.finance/api/v1/a2a/messages',
      protocolVersion: '1.0',
      status: 'ACTIVE',
      allowedCapabilities: [
        'sofia.notify',
        'sofia.escalation.notify',
        'sofia.contact.sync',
        'sofia.context.request',
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

  public static hasCapability(agentId: AgentId, capability: string): boolean {
    const entry = this.getAgent(agentId);
    if (!entry || entry.status !== 'ACTIVE') return false;
    return entry.allowedCapabilities.includes(capability) || entry.allowedCapabilities.includes('*');
  }
}

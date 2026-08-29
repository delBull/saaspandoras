/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.1 — CANONICAL CONTRACTS
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/contracts.ts
 *
 * Sovereign Agent-to-Agent capability, knowledge, and artifact exchange protocol
 * between Sofía (Executive / Media Co) and Hermes (Cognitive OS).
 * @reference DOCUMENTACIÓN/ESPECIFICACIÓN CANÓNICA SOFÍA ↔ HERMES A2A BRIDGE v1.0.md
 */

export type AgentId = 'sofia' | 'hermes' | 'external_agent';
export type SignatureScheme = 'EIP191' | 'EIP712';

// ─── 5 MESSAGE FAMILIES ───────────────────────────────────────────────────────

export type A2AKnowledgeMessageType =
  | 'knowledge.query'
  | 'knowledge.response'
  | 'knowledge.share'
  | 'knowledge.grant'
  | 'knowledge.revoke'
  | 'knowledge.update';

export type A2AArtifactMessageType =
  | 'artifact.request'
  | 'artifact.created'
  | 'artifact.share'
  | 'artifact.revoke';

export type A2ACapabilityMessageType =
  | 'capability.discover'
  | 'capability.request'
  | 'capability.accepted'
  | 'capability.rejected'
  | 'capability.completed';

export type A2AEventMessageType =
  | 'event.tenant'
  | 'event.workflow'
  | 'event.project'
  | 'event.contact'
  | 'event.document'
  | 'event.escalation'
  | 'event.message';

export type A2ASystemMessageType =
  | 'system.heartbeat'
  | 'system.capabilities'
  | 'system.policy'
  | 'system.error';

export type A2AMessageType =
  | A2AKnowledgeMessageType
  | A2AArtifactMessageType
  | A2ACapabilityMessageType
  | A2AEventMessageType
  | A2ASystemMessageType
  // Backwards compatibility aliases
  | 'event.tenant.updated'
  | 'event.document.received'
  | 'status.query'
  | 'status.response';

// ─── SECURITY ENVELOPE & MESSAGE ENVELOPE ─────────────────────────────────────

export interface A2ASecurityEnvelope {
  signature: string;
  signatureScheme: SignatureScheme;
  hmac: string;
}

export interface A2AMessage<T = unknown> {
  protocol: 'pandoras-a2a';
  version: '1.0' | '1.1';
  messageId: string;
  correlationId?: string;
  from: AgentId;
  to: AgentId;
  tenantId?: string; // Tenant authorization scope (e.g. 'snarai', 'eld', 'pandoras')
  type: A2AMessageType;
  createdAt: string;
  expiresAt?: string;
  nonce: string;
  payload: T;
  security: A2ASecurityEnvelope;
}

// ─── SOVEREIGN CAPABILITY GRANT ───────────────────────────────────────────────

export interface CapabilityGrant {
  grantId: string;
  issuer: AgentId;
  grantee: AgentId;
  capability: string; // e.g. "media.image.create", "hermes.knowledge.query"
  scope: {
    tenantIds?: string[];
    artifactIds?: string[];
    knowledgeTypes?: string[];
  };
  permissions: {
    read?: boolean;
    create?: boolean;
    update?: boolean;
    execute?: boolean;
    share?: boolean;
  };
  constraints?: {
    maxExecutions?: number;
    expiresAt?: string;
  };
  authorizedBy?: string; // Authenticated actor identity, e.g. "admin:0xabc123..." (server-side, never client-supplied)
  createdAt: string;
  expiresAt?: string;
}

// ─── SOVEREIGN KNOWLEDGE GRANT ────────────────────────────────────────────────

export interface KnowledgeGrant {
  grantId: string;
  issuer: AgentId;
  grantee: AgentId;
  subject: {
    type: 'contact' | 'document' | 'context' | 'fact';
    id: string;
  };
  scope: {
    tenantIds: string[];
    capabilities: string[];
  };
  fields: string[]; // specific allowed fields
  authorizedBy: string; // Authenticated actor identity, e.g. "admin:0xabc123..."
  createdAt: string;
  expiresAt?: string;
}

// ─── SOVEREIGN ARTIFACT MANIFEST ──────────────────────────────────────────────

export interface SovereignArtifactManifest {
  artifactId: string;
  kind: 'image' | 'video' | 'audio' | 'document' | 'contract' | 'evidence_package' | 'campaign';
  cid: string; // IPFS CID v1
  ipfsUri: string; // ipfs://bafy...
  mimeType: string;
  sha256: string;
  sizeBytes?: number;
  owner: AgentId;
  createdBy?: string; // e.g. "pixel", "minerva", "hermes"
  provenance: {
    issuerWallet: string;
    signature: string;
    timestamp: string;
  };
  metadata?: Record<string, unknown>;
}

// ─── AGENT REGISTRY ENTRY ─────────────────────────────────────────────────────

export interface AgentRegistryEntry {
  agentId: AgentId;
  displayName: string;
  organizationId: string;
  role: 'CHIEF_OF_STAFF' | 'COGNITIVE_OS' | 'EXTERNAL_DELEGATE';
  walletAddress: string;
  publicKey?: string;
  endpoint?: string;
  protocolVersion: string;
  status: 'ACTIVE' | 'REVOKED' | 'MAINTENANCE';
  allowedCapabilities: string[];
  activeGrants?: CapabilityGrant[];
}

// ─── PROCESSING RESULT ────────────────────────────────────────────────────────

export interface A2AProcessingResult<T = unknown> {
  success: boolean;
  messageId: string;
  correlationId?: string;
  type: A2AMessageType;
  payload?: T;
  error?: {
    code: string;
    message: string;
    detail?: unknown;
  };
  security?: A2ASecurityEnvelope;
}

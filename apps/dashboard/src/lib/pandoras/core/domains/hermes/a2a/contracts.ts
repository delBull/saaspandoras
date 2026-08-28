/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.0 — CANONICAL CONTRACTS
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/contracts.ts
 *
 * Implements the normative specification for Agent-to-Agent communication
 * between Sofía (Media Co / Chief of Staff) and Hermes (Cognitive OS).
 * @reference DOCUMENTACIÓN/ESPECIFICACIÓN CANÓNICA SOFÍA ↔ HERMES A2A BRIDGE v1.0.md
 */

export type AgentId = 'sofia' | 'hermes' | 'external_agent';
export type SignatureScheme = 'EIP191' | 'EIP712';

export type A2AMessageType =
  | 'knowledge.query'
  | 'knowledge.response'
  | 'event.escalation'
  | 'event.tenant.updated'
  | 'event.document.received'
  | 'artifact.share'
  | 'artifact.request'
  | 'status.query'
  | 'status.response';

export interface A2ASecurityEnvelope {
  signature: string;
  signatureScheme: SignatureScheme;
  hmac: string;
}

export interface A2AMessage<T = unknown> {
  protocol: 'pandoras-a2a';
  version: '1.0';
  messageId: string;
  correlationId?: string;
  from: AgentId;
  to: AgentId;
  type: A2AMessageType;
  createdAt: string;
  expiresAt?: string;
  nonce: string;
  payload: T;
  security: A2ASecurityEnvelope;
}

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
}

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

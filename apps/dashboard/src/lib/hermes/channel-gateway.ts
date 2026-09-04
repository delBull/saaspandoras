export type ChannelType = 'telegram' | 'whatsapp' | 'web' | 'tma';

/**
 * Normalizes an incoming message from ANY edge transport (Telegram, Meta WhatsApp, Web)
 * into a standard format that the Hermes Core can process.
 */
export interface ChannelContext {
  channel: ChannelType;
  
  // The external identifier of the user (e.g., Telegram User ID, WhatsApp Phone Number)
  externalUserId: string;
  
  // The external identifier of the chat/conversation (e.g., Telegram Chat ID)
  externalConversationId: string;
  
  // Optional hint for which tenant the message is directed to
  tenantHint?: string;
  
  // The actual message payload (normalized to text for conversational processing)
  message: string;
  
  // Any channel-specific metadata (e.g., raw update ID, message IDs for reply)
  metadata: Record<string, any>;
}

/**
 * The resolved conversational context after passing through the Channel Gateway.
 * This is what the Hermes Execution Engine actually consumes.
 */
export interface CanonicalConversationContext {
  // The normalized ChannelContext
  inbound: ChannelContext;
  
  // The resolved Canonical Identity of the user communicating
  // This ensures that Hermes operates with full RBAC and Pandora's Key knowledge
  canonicalUserId: string;
  walletAddress: string;
  
  // The resolved Tenant Context (which organization they are talking to)
  tenantSlug: string;
  
  // Idempotency keys to prevent double-processing LLM tasks
  requestId: string;
  idempotencyKey: string;
}

/**
 * Interface for the outbound adapter back to the Channel Edge
 */
export interface ChannelOutboundPayload {
  channel: ChannelType;
  externalConversationId: string;
  externalUserId: string;
  replyText: string;
  escalate?: boolean;
  evidenceCid?: string;
  metadata?: Record<string, any>;
}

export type ChannelType = 'portal' | 'telegram' | 'whatsapp';

export interface ChannelInboundMessage {
  channelType: ChannelType;
  externalId: string;
  rawPayload: unknown;
}

export interface ChannelOutboundMessage {
  organizationId: string;
  conversationId: string;
  channelType: ChannelType;
  content: string;
  correlationId: string;
  idempotencyKey?: string;
}

export interface ChannelDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ExecutionContext {
  organizationId: string;
  conversationId: string;
  channelBindingId: string;
  correlationId: string;
  idempotencyKey: string;
}

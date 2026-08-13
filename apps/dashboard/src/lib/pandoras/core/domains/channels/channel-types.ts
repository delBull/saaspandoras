export type ChannelType = 'portal' | 'telegram';

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

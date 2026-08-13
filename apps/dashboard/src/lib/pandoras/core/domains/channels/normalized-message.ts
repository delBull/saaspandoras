import { ChannelType } from './channel-types';

export interface NormalizedInboundMessage {
  organizationId: string;
  channel: ChannelType;

  conversationId: string;
  identityId: string;

  messageId: string;
  externalMessageId: string;

  content: string;

  correlationId: string;
  idempotencyKey: string;

  receivedAt: Date;
}

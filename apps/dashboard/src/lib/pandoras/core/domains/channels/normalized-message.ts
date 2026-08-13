import { ChannelType } from './channel-types';

export interface NormalizedInboundMessage {
  organizationId: string;

  channel: {
    type: ChannelType;
    bindingId: string;
    externalConversationId: string;
  };

  actor: {
    identityId: string;
    externalActorId: string;
  };

  conversation: {
    conversationId: string;
  };

  message: {
    messageId: string;
    externalMessageId: string;
    content: string;
  };

  correlationId: string;
  idempotencyKey: string;
  receivedAt: Date;
}

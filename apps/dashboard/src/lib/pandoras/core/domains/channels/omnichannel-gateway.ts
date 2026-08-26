import { ChannelInboundMessage } from './channel-types';
import { NormalizedInboundMessage } from './normalized-message';
import { ChannelAdapterRegistry, DefaultChannelAdapterRegistry } from './adapter-registry';
import { PortalAdapter } from './adapters/portal-adapter';
import { TelegramAdapter } from './adapters/telegram-adapter';
import { WhatsAppAdapter } from './adapters/whatsapp-adapter';
import { DuplicateMessageError } from './channel-errors';
import { ControlPlaneContext } from '../control-plane/application/context';
import { DefaultPlatformEventBus } from '../../platform/events/default-event-bus';
import { IdempotencyStore, RedisIdempotencyStore } from './idempotency-store';

export interface OmnichannelGateway {
  receive(
    input: ChannelInboundMessage,
    context?: ControlPlaneContext
  ): Promise<NormalizedInboundMessage>;
}

export class DefaultOmnichannelGateway implements OmnichannelGateway {
  private registry: ChannelAdapterRegistry;
  private idempotencyStore: IdempotencyStore;
  private eventBus = new DefaultPlatformEventBus();

  constructor(registry?: ChannelAdapterRegistry, idempotencyStore?: IdempotencyStore) {
    this.idempotencyStore = idempotencyStore || new RedisIdempotencyStore();
    if (registry) {
      this.registry = registry;
    } else {
      const defaultReg = new DefaultChannelAdapterRegistry();
      defaultReg.register(new PortalAdapter());
      defaultReg.register(new TelegramAdapter());
      defaultReg.register(new WhatsAppAdapter());
      this.registry = defaultReg;
    }
  }

  async receive(
    input: ChannelInboundMessage,
    context?: ControlPlaneContext
  ): Promise<NormalizedInboundMessage> {
    // 1. Resolve registered Channel Adapter
    const adapter = this.registry.get(input.channelType);

    // 2. Process and normalize inbound message via adapter
    const normalized = await adapter.receive(input, context);

    // 3. Distributed Idempotency Check via Redis (C5.8 & C5.17 & Sprint 4 Hardening)
    const claim = await this.idempotencyStore.claim(normalized.idempotencyKey);
    if (claim.status === 'ALREADY_CLAIMED') {
      throw new DuplicateMessageError(`Message with idempotency key '${normalized.idempotencyKey}' already processed`);
    }

    // 4. Publish Normalized Event to Event Spine (C5.7)
    this.eventBus.publish({
      id: normalized.message.messageId,
      type: 'PORTAL_MESSAGE_RECEIVED',
      timestamp: normalized.receivedAt,
      instanceId: normalized.organizationId,
      correlationId: normalized.correlationId,
      payload: {
        actorId: normalized.actor.identityId,
        content: normalized.message.content,
        channel: normalized.channel,
        conversationId: normalized.conversation.conversationId,
        externalMessageId: normalized.message.externalMessageId
      }
    } as any);

    return normalized;
  }

  // Helper for test cleanup
  clearIdempotencyCache(): void {
    this.idempotencyStore = new RedisIdempotencyStore();
  }
}

import { ChannelInboundMessage } from './channel-types';
import { NormalizedInboundMessage } from './normalized-message';
import { ChannelAdapterRegistry, DefaultChannelAdapterRegistry } from './adapter-registry';
import { PortalAdapter } from './adapters/portal-adapter';
import { DuplicateMessageError } from './channel-errors';
import { ControlPlaneContext } from '../control-plane/application/context';
import { DefaultPlatformEventBus } from '../../platform/events/default-event-bus';

export interface OmnichannelGateway {
  receive(
    input: ChannelInboundMessage,
    context?: ControlPlaneContext
  ): Promise<NormalizedInboundMessage>;
}

export class DefaultOmnichannelGateway implements OmnichannelGateway {
  private registry: ChannelAdapterRegistry;
  private processedIdempotencyKeys = new Set<string>();
  private eventBus = new DefaultPlatformEventBus();

  constructor(registry?: ChannelAdapterRegistry) {
    if (registry) {
      this.registry = registry;
    } else {
      const defaultReg = new DefaultChannelAdapterRegistry();
      defaultReg.register(new PortalAdapter());
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

    // 3. Idempotency Check (C5.8 & H5)
    if (this.processedIdempotencyKeys.has(normalized.idempotencyKey)) {
      throw new DuplicateMessageError(`Message with idempotency key '${normalized.idempotencyKey}' already processed`);
    }
    this.processedIdempotencyKeys.add(normalized.idempotencyKey);

    // 4. Publish Normalized Event to Event Spine (C5.7)
    this.eventBus.publish({
      id: normalized.messageId,
      type: 'PORTAL_MESSAGE_RECEIVED',
      timestamp: normalized.receivedAt,
      instanceId: normalized.organizationId,
      correlationId: normalized.correlationId,
      payload: {
        actorId: normalized.identityId,
        content: normalized.content,
        channel: normalized.channel,
        conversationId: normalized.conversationId,
        externalMessageId: normalized.externalMessageId
      }
    } as any);

    return normalized;
  }

  // Helper for test cleanup
  clearIdempotencyCache(): void {
    this.processedIdempotencyKeys.clear();
  }
}

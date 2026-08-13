import { NormalizedInboundMessage } from './normalized-message';
import { EventSpine } from '../../events/event-spine';
import { randomUUID } from 'crypto';
import '../hermes/runtime/cognitive-runtime-listener'; // Ensure listener is registered

export interface ChannelDispatcher {
  dispatchAsync(normalized: NormalizedInboundMessage): Promise<void>;
}

export class DefaultCognitiveChannelDispatcher implements ChannelDispatcher {
  
  async dispatchAsync(normalized: NormalizedInboundMessage): Promise<void> {
    try {
      console.log(`[CognitiveChannelDispatcher] Hydrating context and emitting event for ${normalized.organizationId}...`);

      // 6.6.1: The dispatcher is no longer a "God Object". 
      // It acts merely as a context-hydration boundary (minimal contextual resolution if needed here)
      // and emits the canonical `CHANNEL_MESSAGE_RECEIVED` event to the Event Spine.
      
      const eventSpine = EventSpine.getInstance();
      
      await eventSpine.publish({
        id: `evt_${Date.now()}_${randomUUID().substring(0, 6)}`,
        type: 'CHANNEL_MESSAGE_RECEIVED',
        timestamp: new Date().toISOString(),
        payload: {
          normalizedMessage: normalized
        }
      });

    } catch (error: any) {
      console.error('[CognitiveChannelDispatcher Error]:', error);
    }
  }
}

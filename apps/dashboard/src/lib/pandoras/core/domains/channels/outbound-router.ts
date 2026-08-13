import { ExecutionContext, ChannelOutboundMessage, ChannelDeliveryResult } from './channel-types';
import { IdempotencyStore, RedisIdempotencyStore } from './idempotency-store';
import { TelegramAdapter } from './adapters/telegram-adapter';
import { WhatsAppAdapter } from './adapters/whatsapp-adapter';
import { db } from '@/db';
import { channelIdentityBindings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class OutboundRouter {
  private idempotencyStore: IdempotencyStore;
  
  // Lazy-loaded adapters to avoid circular dependencies or unnecessary instantiations
  private adapters = {
    telegram: () => new TelegramAdapter(),
    whatsapp: () => new WhatsAppAdapter(),
    // portal: () => new PortalAdapter(), // To be implemented
  };

  constructor(idempotencyStore?: IdempotencyStore) {
    this.idempotencyStore = idempotencyStore || new RedisIdempotencyStore();
  }

  async route(context: ExecutionContext, content: string): Promise<ChannelDeliveryResult> {
    const { organizationId, conversationId, channelBindingId, correlationId, idempotencyKey } = context;

    // C5.20: Idempotency Claim
    const claimResult = await this.idempotencyStore.claim(idempotencyKey);
    
    if (claimResult.status === 'ALREADY_CLAIMED') {
      console.log(`[OutboundRouter] Skipping duplicate outbound dispatch for idempotencyKey: ${idempotencyKey} (State: ${claimResult.state})`);
      return { success: true, messageId: 'SKIPPED_DUPLICATE' };
    }

    try {
      // C5.19: Outbound Channel Authority (Resolve, don't decide)
      // Look up the channelBindingId to determine the correct channel type.
      // 1. First check mock/dev bindings if applicable. 
      // (For Dev / Customer Zero we might have a 'bind_tg_...' or 'bind_wa_...' format)
      let channelType = '';
      
      if (channelBindingId.startsWith('bind_tg_')) {
        channelType = 'telegram';
      } else if (channelBindingId.startsWith('bind_wa_')) {
        channelType = 'whatsapp';
      } else {
        // Query the authoritative DB table
        const rows = await db
          .select({ channel: channelIdentityBindings.channel })
          .from(channelIdentityBindings)
          .where(eq(channelIdentityBindings.id, channelBindingId))
          .limit(1);

        if (!rows.length) {
          throw new Error(`[OutboundRouter] Binding Authority Failed: Unknown channelBindingId ${channelBindingId}`);
        }
        channelType = rows[0]!.channel;
      }

      const adapterFactory = this.adapters[channelType as keyof typeof this.adapters];
      if (!adapterFactory) {
        throw new Error(`[OutboundRouter] No adapter registered for channelType: ${channelType}`);
      }

      await this.idempotencyStore.updateState(idempotencyKey, 'DISPATCHING');

      const adapter = adapterFactory();
      
      const outboundMessage: ChannelOutboundMessage = {
        organizationId,
        conversationId,
        channelType: channelType as any,
        content,
        correlationId,
        idempotencyKey
      };

      const result = await adapter.send(outboundMessage);

      if (result.success) {
        await this.idempotencyStore.updateState(idempotencyKey, 'DELIVERED');
      } else {
        await this.idempotencyStore.updateState(idempotencyKey, 'FAILED');
      }

      return result;

    } catch (error: any) {
      console.error(`[OutboundRouter] Error routing outbound message:`, error);
      await this.idempotencyStore.updateState(idempotencyKey, 'FAILED');
      return { success: false, error: error.message };
    }
  }
}

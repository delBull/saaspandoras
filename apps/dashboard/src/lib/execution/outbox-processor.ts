import { db } from "@/db";
import { channelOutbox, platformEvents } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { TelegramAdapter, WhatsAppAdapter, EmailAdapter, ChannelSendRequest } from "../channels/adapters";

export class OutboxProcessor {
  /**
   * Polls or is triggered to process pending outbox events.
   */
  static async processPending() {
    const pending = await db.query.channelOutbox.findMany({
      where: eq(channelOutbox.status, "PENDING"),
      limit: 10
    });

    if (pending.length === 0) return;

    // Lock records
    const ids = pending.map(p => p.id);
    await db.update(channelOutbox)
      .set({ status: "PROCESSING" })
      .where(inArray(channelOutbox.id, ids));

    for (const event of pending) {
      console.log(`[OutboxProcessor] Processing event: ${event.id} for channel ${event.channel}`);
      
      let adapter;
      if (event.channel === "telegram") adapter = new TelegramAdapter();
      else if (event.channel === "whatsapp") adapter = new WhatsAppAdapter();
      else if (event.channel === "email") adapter = new EmailAdapter();

      if (!adapter) {
        await this.fail(event.id, "Unknown channel");
        continue;
      }

      const request: ChannelSendRequest = {
        // Here we rely on identityId being passed in payload, or we would need to store it in channel_outbox.
        // Let's assume the payload contains the identityId.
        identityId: (event.payload as any).identityId, 
        correlationId: event.correlationId,
        projectId: null,
        content: (event.payload as any).text
      };

      if (!request.identityId) {
        // If ExecutionOS didn't put identityId in payload, we have an issue.
        // For Phase 4 we will ensure Execution OS passes it.
        await this.fail(event.id, "Missing identityId in payload");
        continue;
      }

      const result = await adapter.send(request);

      if (result.success) {
        await this.complete(event.id);
        
        // Feed back into Event Spine
        await db.insert(platformEvents).values({
          eventId: `evt_sent_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          eventType: "MESSAGE_SENT",
          identityId: request.identityId,
          correlationId: request.correlationId,
          sourceSystem: "Hermes OS",
          sourceChannel: event.channel,
          occurredAt: new Date(),
          payload: {
            text: request.content,
            messageId: result.messageId
          }
        });
        
        console.log(`[OutboxProcessor] Successfully sent message and updated Event Spine. CorrelationId: ${request.correlationId}`);
      } else {
        await this.fail(event.id, result.error || "Unknown delivery error");
      }
    }
  }

  private static async complete(id: string) {
    await db.update(channelOutbox)
      .set({ status: "COMPLETED", processedAt: new Date() })
      .where(eq(channelOutbox.id, id));
  }

  private static async fail(id: string, error: string) {
    console.error(`[OutboxProcessor] Failed to process ${id}: ${error}`);
    await db.update(channelOutbox)
      .set({ status: "FAILED", error, processedAt: new Date() })
      .where(eq(channelOutbox.id, id));
  }
}

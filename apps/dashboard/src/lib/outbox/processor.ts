import { OutboxRepository, OutboxEvent } from "./repository";
import { registry } from "./registry";

export interface OutboxProcessorConfig {
  batchSize?: number;
  workerId?: string;
  maxRetries?: number;
}

export class OutboxProcessor {
  private batchSize: number;
  private workerId: string;
  private maxRetries: number;

  constructor(config: OutboxProcessorConfig = {}) {
    this.batchSize = config.batchSize || 50;
    this.workerId = config.workerId || `worker-${Math.random().toString(36).substring(7)}`;
    this.maxRetries = config.maxRetries || 5;
  }

  /**
   * Processes a single batch of events.
   * Returns a summary of the processing.
   */
  async processBatch() {
    let claimedEvents: OutboxEvent[] = [];
    
    try {
      claimedEvents = await OutboxRepository.claimEvents(this.batchSize, this.workerId);
    } catch (error) {
      console.error(`[OutboxProcessor] Failed to claim events:`, error);
      return { processed: 0, failed: 0, skipped: 0, errors: [error instanceof Error ? error.message : String(error)] };
    }

    if (claimedEvents.length === 0) {
      return { processed: 0, failed: 0, skipped: 0, errors: [] };
    }

    let processedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process events sequentially in the batch to avoid overwhelming downstream services
    // if they are rate limited, or we could use Promise.allSettled for parallel processing.
    // Given these might be critical Web3 or webhook events, parallel with a concurrency limit is better,
    // but sequential is safer for Sprint 25 MVP.
    for (const event of claimedEvents) {
      const handler = registry.getHandler(event.aggregateType, event.eventType);

      if (!handler) {
        // No handler registered, skip it and leave it pending/failed? 
        // We will mark it failed so it doesn't block, as it indicates a missing implementation.
        console.warn(`[OutboxProcessor] No handler found for ${event.aggregateType}::${event.eventType}`);
        await OutboxRepository.markFailed(event.id, "No handler registered", this.maxRetries);
        skippedCount++;
        continue;
      }

      try {
        await handler(event);
        await OutboxRepository.markProcessed(event.id);
        processedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[OutboxProcessor] Event ${event.id} failed:`, errorMsg);
        await OutboxRepository.markFailed(event.id, errorMsg, this.maxRetries);
        failedCount++;
        errors.push(`Event ${event.id}: ${errorMsg}`);
      }
    }

    return { processed: processedCount, failed: failedCount, skipped: skippedCount, errors };
  }
}

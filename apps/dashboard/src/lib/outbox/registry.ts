import { OutboxEvent } from "./repository";

export interface OutboxEventHandler {
  (event: OutboxEvent): Promise<void>;
}

export class EventRegistry {
  private handlers = new Map<string, OutboxEventHandler>();

  /**
   * Register a handler for a specific aggregate type and event type.
   * e.g. register('governance', 'proposal_created', handler)
   */
  register(aggregateType: string, eventType: string, handler: OutboxEventHandler) {
    const key = this.getKey(aggregateType, eventType);
    if (this.handlers.has(key)) {
      console.warn(`[Outbox] Overwriting handler for ${key}`);
    }
    this.handlers.set(key, handler);
  }

  /**
   * Get the handler for a specific event.
   */
  getHandler(aggregateType: string, eventType: string): OutboxEventHandler | undefined {
    return this.handlers.get(this.getKey(aggregateType, eventType));
  }

  private getKey(aggregateType: string, eventType: string): string {
    return `${aggregateType}::${eventType}`;
  }
}

// Global registry instance
export const registry = new EventRegistry();

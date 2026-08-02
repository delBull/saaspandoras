/**
 * Strongly-Typed Event Bus & Contracts for Hermes Runtime
 */

export type HermesEventType =
  | 'LeadCreated'
  | 'LeadQualified'
  | 'MissionStarted'
  | 'MissionCompleted'
  | 'CheckoutOpened'
  | 'CheckoutCompleted'
  | 'PaymentConfirmed'
  | 'WalletConnected'
  | 'DocumentDownloaded'
  | 'MeetingBooked';

export interface TypedHermesEvent<T = any> {
  id: string;
  type: HermesEventType;
  leadId: string;
  packId: string;
  timestamp: number;
  payload: T;
}

export type HermesEventSubscriber = (event: TypedHermesEvent) => void | Promise<void>;

export class HermesEventBus {
  private subscribers: Map<HermesEventType, Set<HermesEventSubscriber>> = new Map();

  subscribe(type: HermesEventType, subscriber: HermesEventSubscriber): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(subscriber);

    return () => {
      this.subscribers.get(type)?.delete(subscriber);
    };
  }

  async emit(event: TypedHermesEvent): Promise<void> {
    console.info(`[Hermes EventBus] Event emitted: ${event.type} for Lead: ${event.leadId}`);
    const handlers = this.subscribers.get(event.type);
    if (handlers) {
      for (const handler of Array.from(handlers)) {
        try {
          await handler(event);
        } catch (err) {
          console.error(`[Hermes EventBus] Error in handler for ${event.type}:`, err);
        }
      }
    }
  }
}

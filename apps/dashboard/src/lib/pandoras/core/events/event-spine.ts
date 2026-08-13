import { NormalizedInboundMessage } from '../domains/channels/normalized-message';

export type EventType = 'CHANNEL_MESSAGE_RECEIVED' | 'CHANNEL_MESSAGE_SEND' | 'STRATEGY_DECISION_PROPOSED' | 'UNKNOWN_EVENT';

export interface PandorasEvent<T = any> {
  id: string;
  type: EventType;
  timestamp: string;
  payload: T;
}

export interface ChannelMessageReceivedPayload {
  normalizedMessage: NormalizedInboundMessage;
}

export interface StrategyDecisionProposedPayload {
  decision: any;
  context: any;
}

export interface ChannelMessageSendPayload {
  normalizedMessage: any; // We can use 'any' or define OutboundMessage if needed, using any for now to match the payload in listener
  targetProvider: string;
}

type EventHandler<T> = (event: PandorasEvent<T>) => Promise<void>;

export class EventSpine {
  private static instance: EventSpine;
  private handlers: Map<EventType, EventHandler<any>[]> = new Map();

  private constructor() {}

  static getInstance(): EventSpine {
    if (!EventSpine.instance) {
      EventSpine.instance = new EventSpine();
    }
    return EventSpine.instance;
  }

  subscribe<T>(eventType: EventType, handler: EventHandler<T>): void {
    const current = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...current, handler]);
  }

  async publish<T>(event: PandorasEvent<T>): Promise<void> {
    const eventHandlers = this.handlers.get(event.type) || [];
    console.log(`[EventSpine] Emitting event ${event.type} (ID: ${event.id})`);
    
    // Process handlers in parallel or sequentially depending on need
    // For now, sequential async to ensure strict boundaries
    for (const handler of eventHandlers) {
      try {
        await handler(event);
      } catch (err: any) {
        console.error(`[EventSpine] Error in handler for event ${event.type}:`, err?.message || err);
      }
    }
  }
}

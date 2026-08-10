import { GovernanceEvent, GovernanceEventHandler, GovernanceEventType } from './contracts';

export class GovernanceEventBus {
  private handlers: Map<GovernanceEventType, GovernanceEventHandler[]> = new Map();
  private static instance: GovernanceEventBus;

  private constructor() {}

  public static getInstance(): GovernanceEventBus {
    if (!GovernanceEventBus.instance) {
      GovernanceEventBus.instance = new GovernanceEventBus();
    }
    return GovernanceEventBus.instance;
  }

  public subscribe(eventType: GovernanceEventType, handler: GovernanceEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  public async dispatch(event: GovernanceEvent): Promise<void> {
    console.log(`[GovernanceEventBus] Dispatching ${event.type} for Intent ${event.intentId}`);
    const eventHandlers = this.handlers.get(event.type) || [];
    
    Promise.allSettled(eventHandlers.map(handler => handler.handle(event)))
      .then(results => {
        results.forEach((res, idx) => {
          if (res.status === 'rejected') {
            console.error(`[GovernanceEventBus] Handler Error on ${event.type}:`, res.reason);
          }
        });
      });
  }
}

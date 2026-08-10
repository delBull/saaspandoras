import { MissionEvent, MissionEventHandler, MissionEventType } from './contracts';

export class MissionEventBus {
  private handlers: Map<MissionEventType, MissionEventHandler[]> = new Map();
  private static instance: MissionEventBus;

  private constructor() {}

  public static getInstance(): MissionEventBus {
    if (!MissionEventBus.instance) {
      MissionEventBus.instance = new MissionEventBus();
    }
    return MissionEventBus.instance;
  }

  public subscribe(eventType: MissionEventType, handler: MissionEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  public async dispatch(event: MissionEvent): Promise<void> {
    console.log(`[MissionEventBus] Dispatching ${event.type} for Mission ${event.missionId}`);
    const eventHandlers = this.handlers.get(event.type) || [];
    
    // Ejecutar asíncronamente para no bloquear el hilo de la operación original
    Promise.allSettled(eventHandlers.map(handler => handler.handle(event)))
      .then(results => {
        results.forEach((res, idx) => {
          if (res.status === 'rejected') {
            console.error(`[MissionEventBus] Handler Error on ${event.type}:`, res.reason);
          }
        });
      });
  }
}

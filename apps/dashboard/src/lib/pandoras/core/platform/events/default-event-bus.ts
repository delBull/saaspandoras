import { EventEmitter } from 'events';
import { IPlatformEventBus } from './event-bus';
import { ExecutionEvent } from '../../execution/execution-journal';
import { EventSubscriber } from './event-subscriber';

export class DefaultPlatformEventBus implements IPlatformEventBus {
  private emitter = new EventEmitter();

  async publish(event: ExecutionEvent): Promise<void> {
    console.log(`[EventBus] Publishing event: ${event.type} from instance ${event.instanceId}`);
    // Emitir de forma asíncrona para no bloquear al publicador (Kernel)
    setImmediate(() => {
      this.emitter.emit(event.type, event);
      this.emitter.emit('*', event); // catch-all
    });
  }

  subscribe(
    eventTypes: string[], 
    subscriber: string, 
    handler: (event: ExecutionEvent) => Promise<void>
  ): void {
    console.log(`[EventBus] Registered subscriber '${subscriber}' for events: [${eventTypes.join(', ')}]`);
    
    eventTypes.forEach(eventType => {
      this.emitter.on(eventType, (event: ExecutionEvent) => {
        // Envolver en Promise para tragar errores no controlados y no tumbar el proceso
        handler(event).catch(err => {
          console.error(`[EventBus] Error in subscriber '${subscriber}' for event ${eventType}:`, err);
        });
      });
    });
  }

  /**
   * Utilidad para suscribir un objeto EventSubscriber completo
   */
  register(subscriber: EventSubscriber): void {
    this.subscribe(
      subscriber.subscribedEventTypes,
      subscriber.subscriberId,
      subscriber.handleEvent.bind(subscriber)
    );
  }
}

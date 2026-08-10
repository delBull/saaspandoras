import { ExecutionEvent, IExecutionJournal } from './execution-journal';
import { IPlatformEventBus } from '../platform/events/event-bus';

export class DefaultExecutionJournal implements IExecutionJournal {
  private events: ExecutionEvent[] = [];

  constructor(private eventBus?: IPlatformEventBus) {}

  async append(event: ExecutionEvent): Promise<void> {
    console.log(`[Journal] Appending event: ${event.type} for instance ${event.instanceId}`);
    this.events.push(event);
    
    // El Journal notifica al bus en tiempo real (Push mode)
    if (this.eventBus) {
      await this.eventBus.publish(event);
    }
  }

  async getHistory(instanceId: string): Promise<ExecutionEvent[]> {
    return this.events.filter(e => e.instanceId === instanceId);
  }

  async replay(instanceId: string): Promise<any> {
    const history = await this.getHistory(instanceId);
    console.log(`[Journal] Replaying ${history.length} events for instance ${instanceId}`);
    return { replayed: true, count: history.length };
  }
}

import { EventEmitter } from 'events';

export type HermesEventType = 
  | 'SystemBooted'
  | 'IntentDetected'
  | 'ArtifactLoaded'
  | 'PolicyDenied'
  | 'DecisionApproved'
  | 'TaskQueued'
  | 'MediaQueued'
  | 'UIRendered'
  | 'LanguageGenerated'
  | 'ExecutionCompleted';

export interface HermesEvent {
  type: HermesEventType;
  payload: any;
  timestamp: number;
}

/**
 * Event Bus
 * 
 * The nervous system of the OS. All components emit events here instead of calling each other.
 */
class HermesEventBus extends EventEmitter {
  publish(type: HermesEventType, payload: any = {}) {
    const event: HermesEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };
    this.emit(type, event);
    this.emit('*', event); // For global listeners like Analytics/Telemetry
    console.log(`[EventBus] ${type}`);
  }

  subscribe(type: HermesEventType | '*', listener: (event: HermesEvent) => void) {
    this.on(type, listener);
  }
}

export const eventBus = new HermesEventBus();

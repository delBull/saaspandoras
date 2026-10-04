import { IExecutionJournal } from '../execution/execution-journal';
import { IPlatformEventBus } from '../platform/events/event-bus';
import type { CapabilityRuntime } from '../capabilities/capability-runtime';
import { ExecutionIdentitySnapshot } from '../contracts';

/**
 * Service Locator y Contexto de Ejecución Scoped.
 * Se instancia de manera única por cada workflow ejecutándose, 
 * llevando consigo el Snapshot de Identidad congelado.
 */
export interface ExecutionContext {
  readonly instanceId: string;
  readonly identity: ExecutionIdentitySnapshot;
  readonly journal: IExecutionJournal;
  readonly eventBus: IPlatformEventBus;
  readonly capabilityRuntime: CapabilityRuntime;
}

export class DefaultExecutionContext implements ExecutionContext {
  constructor(
    public readonly instanceId: string,
    public readonly identity: ExecutionIdentitySnapshot,
    public readonly journal: IExecutionJournal,
    public readonly eventBus: IPlatformEventBus,
    public readonly capabilityRuntime: CapabilityRuntime
  ) {}
}

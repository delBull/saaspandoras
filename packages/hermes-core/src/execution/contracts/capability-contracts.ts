/**
 * ADR-018 Capability Runtime Contract
 * 
 * The standard contract that all Execution OS capabilities must implement.
 */

export interface CapabilityContext {
  organizationId: string;
  actorId: string;
  missionId: string;
  intentId: string;
  correlationId: string;
  idempotencyKey: string;
}

export type CapabilityErrorCategory = 
  | "VALIDATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "TRANSIENT_ERROR"
  | "PERMANENT_ERROR"
  | "UNKNOWN_ERROR";

export interface CapabilityError {
  category: CapabilityErrorCategory;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export type CapabilityResult<T> = 
  | { status: "succeeded"; data: T }
  | { status: "failed"; error: CapabilityError };

export interface Capability<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly version: string;
  
  execute(
    input: TInput,
    context: CapabilityContext
  ): Promise<CapabilityResult<TOutput>>;
}

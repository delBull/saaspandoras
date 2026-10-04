/**
 * ADR-018 Execution State Machine
 * 
 * Defines the canonical states for capability execution.
 */
export enum ExecutionState {
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

import type { ProtocolLifecycle, BlockchainEnvironment } from "../types";

export interface LifecycleTransitionEvent {
  type: "LifecycleTransition";
  runtimeId: number;
  from: ProtocolLifecycle | null;
  to: ProtocolLifecycle;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface DeploymentStartedEvent {
  type: "DeploymentStarted";
  runtimeId: number;
  environment: BlockchainEnvironment;
  projectId: number;
}

export interface DeploymentCompletedEvent {
  type: "DeploymentCompleted";
  runtimeId: number;
  environment: BlockchainEnvironment;
}

export interface DeploymentFailedEvent {
  type: "DeploymentFailed";
  runtimeId: number;
  error: string;
  state: ProtocolLifecycle;
}

export type ProtocolEvent =
  | LifecycleTransitionEvent
  | DeploymentStartedEvent
  | DeploymentCompletedEvent
  | DeploymentFailedEvent;

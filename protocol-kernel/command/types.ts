import type { BlockchainEnvironment } from "../types";

export interface QueueDeploymentCommand {
  type: "QueueDeployment";
  projectId: number;
  environment: BlockchainEnvironment;
  config: Record<string, unknown>;
  actor: string;
}

export interface ValidateConfigurationCommand {
  type: "ValidateConfiguration";
  runtimeId: number;
}

export interface PrepareDeploymentCommand {
  type: "PrepareDeployment";
  runtimeId: number;
}

export interface DeployInfrastructureCommand {
  type: "DeployInfrastructure";
  runtimeId: number;
}

export interface MintTokensCommand {
  type: "MintTokens";
  runtimeId: number;
}

export interface TransferOwnershipCommand {
  type: "TransferOwnership";
  runtimeId: number;
}

export interface FinalizeDeploymentCommand {
  type: "FinalizeDeployment";
  runtimeId: number;
}

export interface FailDeploymentCommand {
  type: "FailDeployment";
  runtimeId: number;
  error: string;
}

export type DeploymentCommand =
  | QueueDeploymentCommand
  | ValidateConfigurationCommand
  | PrepareDeploymentCommand
  | DeployInfrastructureCommand
  | MintTokensCommand
  | TransferOwnershipCommand
  | FinalizeDeploymentCommand
  | FailDeploymentCommand;

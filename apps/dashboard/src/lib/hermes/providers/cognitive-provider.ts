import { DomainPackManifest } from "../../pandoras/core/contracts/pack-contracts";
import { MemoryContext } from "./memory-provider";

export interface CognitiveContext {
  identityId: string;
  projectId: string;
  correlationId: string;
  domainPack: DomainPackManifest;
  memory: MemoryContext;
  journeyContext: any; // e.g. { intent, stage }
  payload: any; // current event payload
}

export interface CognitiveResponse {
  action: "SEND_MESSAGE" | "ESCALATE_TO_HUMAN" | "DO_NOTHING";
  responseText?: string;
  confidence: number;
  reasoning?: string;
}

export interface CognitiveProvider {
  generateResponse(context: CognitiveContext): Promise<CognitiveResponse>;
}

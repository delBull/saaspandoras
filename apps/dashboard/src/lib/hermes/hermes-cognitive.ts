import { CognitiveDecisionRequest } from "../journeys/journey-trigger";
import { MemoryProvider } from "./providers/memory-provider";
import { OllamaProvider } from "./providers/ollama-provider";
import { TestStubProvider } from "./providers/test-stub-provider";
import { PolicyEngine } from "./policies/policy-engine";
import { DomainPackLoader } from "./packs/domain-pack-loader";
import { CognitiveProvider } from "./providers/cognitive-provider";

export interface OperationalIntent {
  action: "SEND_MESSAGE" | "ESCALATE_TO_HUMAN" | "DO_NOTHING";
  channel?: "whatsapp" | "telegram" | "email";
  identityId: string;
  correlationId: string;
  projectId: string | null;
  payload: any;
  confidence: number;
}

export class HermesCognitiveLayer {
  /**
   * Orchestrates the cognitive pipeline without directly coupling to the DB.
   */
  static async decide(request: CognitiveDecisionRequest): Promise<OperationalIntent> {
    console.log(`[HermesCognitiveLayer] Processing decision request for event: ${request.eventId}`);
    
    // 1. Load Domain Pack (Tenant Isolation)
    const tenantId = request.projectId || "hermes";
    const domainPack = await DomainPackLoader.load(tenantId);
    
    // 2. Fetch Memory (DB decoupled)
    const memory = await MemoryProvider.getRecentHistory(request.identityId);

    // 3. Invoke Cognitive Provider
    let cognitiveProvider: CognitiveProvider;
    if (process.env.HERMES_COGNITIVE_PROVIDER === "stub") {
      cognitiveProvider = new TestStubProvider();
    } else {
      cognitiveProvider = new OllamaProvider();
    }
    
    const cognitiveResponse = await cognitiveProvider.generateResponse({
      identityId: request.identityId,
      projectId: tenantId,
      correlationId: request.correlationId,
      domainPack,
      memory,
      journeyContext: request.journeyContext,
      payload: request.payload
    });

    // 4. Policy & Evidence Evaluation
    const channelToUse = request.payload?.channel || "telegram"; // Extract from payload or source

    const finalIntent = PolicyEngine.evaluate(
      cognitiveResponse,
      domainPack,
      {
        identityId: request.identityId,
        correlationId: request.correlationId,
        projectId: tenantId,
        eventId: request.eventId,
        channel: channelToUse
      }
    );

    console.log(`[HermesCognitiveLayer] Generated final intent: ${finalIntent.action} via ${finalIntent.channel}`);
    return finalIntent;
  }
}

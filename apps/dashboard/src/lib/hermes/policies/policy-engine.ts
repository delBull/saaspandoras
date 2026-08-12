import { DomainPackManifest } from "../../pandoras/core/contracts/pack-contracts";
import { CognitiveResponse } from "../providers/cognitive-provider";
import { OperationalIntent } from "../hermes-cognitive";

export class PolicyEngine {
  /**
   * Evaluates the LLM's suggested response against the DomainPack policies and Evidence Layer.
   * Modifies or blocks the action if it violates rules or lacks confidence.
   */
  static evaluate(
    response: CognitiveResponse,
    domainPack: DomainPackManifest,
    context: any
  ): OperationalIntent {
    console.log(`[PolicyEngine] Evaluating LLM Response (Confidence: ${response.confidence})`);

    let finalAction = response.action;
    let finalResponseText = response.responseText || "";

    // 1. Confidence Threshold Check
    // A confidence score lower than 0.85 requires human escalation or a fallback safe message
    if (response.confidence < 0.85 && finalAction === "SEND_MESSAGE") {
      console.warn(`[PolicyEngine] Confidence too low (${response.confidence}). Escalating.`);
      finalAction = "ESCALATE_TO_HUMAN";
      finalResponseText = ""; 
    }

    // 2. Evidence Layer Verification (Stub for now, would run NLP classification against claims)
    if (domainPack.policies?.promises === "forbidden" && finalAction === "SEND_MESSAGE") {
       // Example logic: if the response mentions specific keywords without proof, block it.
       // In a full implementation, this might call a secondary classifier or regex set.
       const lowerText = finalResponseText.toLowerCase();
       if (lowerText.includes("guarantee") || lowerText.includes("100%")) {
          console.warn("[PolicyEngine] Evidence Layer Violation Detected: Forbidden Claim");
          finalAction = "DO_NOTHING";
          finalResponseText = "";
       }
    }

    return {
      action: finalAction,
      channel: finalAction === "SEND_MESSAGE" ? context.channel : undefined,
      identityId: context.identityId,
      correlationId: context.correlationId,
      projectId: context.projectId,
      payload: {
        text: finalResponseText,
        originalEventId: context.eventId
      },
      confidence: response.confidence
    };
  }
}

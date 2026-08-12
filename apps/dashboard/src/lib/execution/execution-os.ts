import { db } from "@/db";
import { channelOutbox } from "@/db/schema";
import { OperationalIntent } from "../hermes/hermes-cognitive";

export class ExecutionOS {
  /**
   * Receives an OperationalIntent from Hermes.
   * Passes it through Governance and queues it in the Outbox.
   */
  static async execute(intent: OperationalIntent) {
    console.log(`[ExecutionOS] Received intent for event ${intent.correlationId}: ${intent.action}`);

    // 1. Governance / Policy Check
    if (intent.action === "DO_NOTHING") {
      console.log(`[ExecutionOS] Intent is DO_NOTHING. Skipping execution.`);
      return;
    }
    
    if (intent.confidence < 0.7 && intent.action !== "ESCALATE_TO_HUMAN") {
      console.warn(`[ExecutionOS] Low confidence (${intent.confidence}). Escaping to human.`);
      intent.action = "ESCALATE_TO_HUMAN";
    }

    if (intent.action === "ESCALATE_TO_HUMAN") {
      console.log(`[ExecutionOS] Escalating to human queue.`);
      // In a real system, push to a Zendesk/Intercom queue or flag in DB.
      return;
    }

    // 2. Outbox Enqueueing
    if (!intent.channel) {
      console.error(`[ExecutionOS] Channel missing for action ${intent.action}`);
      return;
    }

    const idempotencyKey = `exec_${intent.correlationId}_${intent.action}_${Date.now()}`;
    
    // Inject identityId into payload if not present
    const outboxPayload = {
      ...intent.payload,
      identityId: intent.identityId,
    };

    await db.insert(channelOutbox).values({
      idempotencyKey,
      status: "PENDING",
      type: intent.action,
      channel: intent.channel,
      payload: outboxPayload,
      correlationId: intent.correlationId,
    });

    console.log(`[ExecutionOS] Enqueued action in Outbox (Key: ${idempotencyKey})`);
    
    // In a real system, a worker would poll or be triggered to process the outbox.
    // For Phase 4 Test A, we will process it immediately or asynchronously.
  }
}

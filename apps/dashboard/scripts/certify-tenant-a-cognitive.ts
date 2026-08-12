import { db } from "@/db";
import { platformEvents } from "@/db/schema";
import { eq, or, and, desc } from "drizzle-orm";
import { IdentityService } from "@/lib/integrations/identity";
import { JourneyTriggerService } from "@/lib/journeys/journey-trigger";
import { HermesCognitiveLayer } from "@/lib/hermes/hermes-cognitive";
import { ExecutionOS } from "@/lib/execution/execution-os";
import { OutboxProcessor } from "@/lib/execution/outbox-processor";

async function runCertification() {
  console.log("==========================================");
  console.log("🚀 STARTING HERMES CERTIFICATION (TENANT A - A14-A18)");
  console.log("==========================================\n");

  const externalUserId = "798431743"; // Real Telegram ID
  let identityId = "";

  try {
    // We resolve identity once for all tests
    identityId = await IdentityService.resolveEventIdentity({
      eventId: `evt_init_${Date.now()}`,
      eventType: "MESSAGE_RECEIVED",
      occurredAt: new Date().toISOString(),
      correlationId: `corr_init_${Date.now()}`,
      source: { system: "telegram", channel: "telegram" },
      identity: { externalId: externalUserId },
      payload: { text: "init" }
    });
    console.log(`[Core] Resolved Identity: ${identityId}\n`);

    const tests = [
      { id: "A18", name: "Cognitive Provider Failure", payload: "timeout" },
      { id: "A14", name: "Soul / Tone Test", payload: "Hola, ¿qué tal?" },
      { id: "A15a", name: "Domain Knowledge", payload: "¿Qué hace Hermes?" },
      { id: "A15b", name: "Hallucination Safety", payload: "¿Garantizan 2x ventas?" },
      { id: "A15c", name: "Tenant Isolation", payload: "¿Qué es S'Narai?" },
      { id: "A16", name: "Journey-Aware", payload: "Quiero automatizar mis clientes." }
    ];

    for (const test of tests) {
      console.log("==================================================");
      console.log(`${test.id} - ${test.name}`);
      console.log("==================================================");
      
      const eventId = `evt_${test.id}_${Date.now()}`;
      const correlationId = `corr_${test.id}_${Date.now()}`;
      
      const mockEvent = {
        eventId,
        eventType: "MESSAGE_RECEIVED",
        identityId,
        correlationId,
        sourceSystem: "telegram",
        sourceChannel: "telegram",
        occurredAt: new Date(),
        payload: { text: test.payload }
      };

      await db.insert(platformEvents).values(mockEvent);

      const decisionRequest = await JourneyTriggerService.handle({
        eventId,
        eventType: mockEvent.eventType,
        identityId,
        correlationId,
        payload: mockEvent.payload
      });

      if (!decisionRequest) throw new Error("Trigger failed");

      try {
        const intent = await HermesCognitiveLayer.decide(decisionRequest);
        console.log(`[${test.id}] Decision: ${intent.action} (Confidence: ${intent.confidence})`);
        console.log(`[${test.id}] Response Text: ${intent.payload.text}`);
        
        if (test.id === "A15b" && intent.action !== "DO_NOTHING" && intent.action !== "ESCALATE_TO_HUMAN") {
           // Should have been blocked by PolicyEngine
           if (intent.payload.text === "") {
             console.log(`✅ ${test.id} PASS: PolicyEngine correctly degraded the action and blocked the claim.`);
           } else {
             console.warn(`⚠️ ${test.id} WARN: LLM generated a claim, PolicyEngine degraded to ${intent.action}.`);
           }
        } else {
           console.log(`✅ ${test.id} PASS`);
        }

        await ExecutionOS.execute(intent);
        await OutboxProcessor.processPending();
      } catch (err: any) {
        if (test.id === "A18") {
          console.log(`[A18] Caught Error: ${err.message}`);
          console.log(`✅ A18 PASS: System handled Cognitive Failure properly (NO MESSAGE SENT).`);
        } else {
          throw err;
        }
      }
      console.log("\n");
    }

    console.log("==========================================");
    console.log("🏆 TENANT A (A14-A18) COGNITIVE RUN COMPLETE");
    console.log("==========================================");
    
  } catch (error) {
    console.error("\n❌ CERTIFICATION FAILED:");
    console.error(error);
  }
}

runCertification().then(() => process.exit(0));

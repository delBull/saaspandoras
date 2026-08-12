import { db } from "@/db";
import { marketingIdentities, platformEvents } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface CognitiveDecisionRequest {
  eventId: string;
  identityId: string;
  correlationId: string;
  projectId: string | null;
  eventType: string;
  journeyContext: {
    stage: string;
    intent: string;
    history?: any[];
  };
  payload: any;
}

export class JourneyTriggerService {
  /**
   * Evaluates an incoming event from the Event Spine.
   * Determines if it requires a Cognitive Decision from Hermes.
   */
  static async handle(eventRecord: {
    eventId: string;
    eventType: string;
    identityId: string;
    correlationId: string;
    projectId?: string | null;
    payload: any;
  }): Promise<CognitiveDecisionRequest | null> {
    console.log(`[JourneyTrigger] Evaluating event: ${eventRecord.eventId} (${eventRecord.eventType})`);

    // 1. Load Identity bindings to see if this user is known.
    // In a real system, we'd load the full journey state from DB.
    // For this Phase 4 certification, we use a heuristic based on event type.

    let stage = "UNKNOWN";
    let intent = "UNKNOWN";

    if (eventRecord.eventType === "MESSAGE_RECEIVED") {
      stage = "NURTURING";
      intent = "ENGAGEMENT";
    } else if (eventRecord.eventType === "LEAD_GENERATED") {
      stage = "INITIAL_CONTACT";
      intent = "QUALIFICATION";
    } else if (eventRecord.eventType === "NO_RESPONSE") {
      stage = "FOLLOW_UP";
      intent = "REENGAGEMENT";
    } else {
      // If the event doesn't map to a cognitive action, we return null.
      console.log(`[JourneyTrigger] Event ${eventRecord.eventType} does not require cognitive decision.`);
      return null;
    }

    // 2. Assemble CognitiveDecisionRequest for Hermes
    const request: CognitiveDecisionRequest = {
      eventId: eventRecord.eventId,
      identityId: eventRecord.identityId,
      correlationId: eventRecord.correlationId,
      projectId: eventRecord.projectId || null,
      eventType: eventRecord.eventType,
      journeyContext: {
        stage,
        intent,
      },
      payload: eventRecord.payload,
    };

    console.log(`[JourneyTrigger] Emitting CognitiveDecisionRequest for Identity ${eventRecord.identityId}`);
    
    // In the future this would be put onto a queue (e.g. SQS/RabbitMQ) for Hermes to pick up.
    // For now, we will return it so the caller can synchronously pass it to Hermes (Execution Layer).
    return request;
  }
}

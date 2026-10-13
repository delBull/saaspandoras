import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { platformEvents } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { platformEventSchema } from "@/lib/integrations/events-schema";
import { IdentityService } from "@/lib/integrations/identity";
import { JourneyTriggerService } from "@/lib/journeys/journey-trigger";
import { HermesCognitiveLayer } from "@saasfly/hermes-core";
import { executionOS } from "@/lib/hermes/composition";
import { OutboxProcessor } from "@/lib/execution/outbox-processor";
import { QuotaMeteringService } from "@/lib/integrations/quota-metering";
import { integrationGuard } from "@/lib/integrations/guard";
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication + Capability Check (fail-closed)
    // Requirement: 'events:write' (legacy fallback 'lead:write' handled inside the guard)
    const guard = await integrationGuard(req, { requiredCapability: "events:write" });

    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { client } = guard;

    // 1.5 Metering & Quota Evaluation (Phase 3 Fail-Closed Gate)
    const quotaResult = await QuotaMeteringService.checkEventQuota({
      clientId: client.id,
      projectId: client.projectId,
      environment: client.environment as "staging" | "production",
    });

    if (!quotaResult.allowed) {
      return NextResponse.json({
        error: quotaResult.quotaType === "rate_limit" ? "TOO_MANY_REQUESTS" : "MONTHLY_QUOTA_EXCEEDED",
        message: quotaResult.reason,
        limit: quotaResult.limit,
        remaining: 0,
        retryAfter: quotaResult.retryAfterSeconds,
      }, {
        status: 429,
        headers: {
          "Retry-After": String(quotaResult.retryAfterSeconds),
          "X-RateLimit-Limit": String(quotaResult.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(quotaResult.resetMs / 1000)),
        }
      });
    }

    // Check scope for generic events
    // NOTE: capability enforcement moved to integrationGuard (fail-closed) above.

    // 2. Parse and Validate Payload
    const body = await req.json();
    const parseResult = platformEventSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json({
        error: "VALIDATION_ERROR",
        details: parseResult.error.format()
      }, { status: 400 });
    }

    const event = parseResult.data;

    // 3. Tenant Authorization Check (INV-009)
    // The integration key corresponds to a specific project natively.
    // Enforce fail-closed resource scoping: rejecting any mismatch before writing or side-effects.
    if (client.projectId !== null && client.projectId !== undefined) {
      const authorizedProjectIdStr = client.projectId.toString();
      if (event.projectId && event.projectId !== authorizedProjectIdStr) {
        return NextResponse.json({
          error: "FORBIDDEN_RESOURCE_SCOPE",
          message: `The integration key is bound to project ID ${client.projectId} and cannot publish events for project ${event.projectId}.`
        }, { status: 403 });
      }
      // If event didn't explicitly declare projectId, bind it server-side to the authorized client's project
      if (!event.projectId) {
        event.projectId = authorizedProjectIdStr;
      }
    }

    // 4. Idempotency Check (INV-010)
    const existingEvent = await db.query.platformEvents.findFirst({
      where: eq(platformEvents.eventId, event.eventId)
    });

    if (existingEvent) {
      // Event already processed, return 200 early to satisfy idempotency
      return NextResponse.json({
        status: "success",
        message: "Event previously processed",
        eventId: event.eventId
      }, { status: 200 });
    }

    // 5. Identity Resolution
    // Resolve the incoming identity signals (phone, email) to a canonical identityId
    const identityId = await IdentityService.resolveEventIdentity(event);

    // 6. Persist to Event Spine
    await db.insert(platformEvents).values({
      eventId: event.eventId,
      eventType: event.eventType,
      identityId: identityId, // Resolved identity
      correlationId: event.correlationId,
      causationId: event.causationId,
      sourceSystem: event.source.system,
      sourceChannel: event.source.channel,
      organizationId: event.requestedOrganizationId, // Note: tenant resolution would overwrite this in future
      projectId: event.projectId,
      occurredAt: new Date(event.occurredAt),
      identityContext: event.identity,
      attribution: event.attribution,
      payload: event.payload
    });

    // 7. Dispatch to Journey Pipeline (Asynchronous)
    // For Phase 4 Test A, we trigger this immediately in a fire-and-forget Promise
    // to simulate a worker picking up the event.
    (async () => {
      try {
        const decisionRequest = await JourneyTriggerService.handle({
          eventId: event.eventId,
          eventType: event.eventType,
          identityId: identityId,
          correlationId: event.correlationId,
          projectId: event.projectId,
          payload: event.payload
        });

        if (decisionRequest) {
          const intent = await HermesCognitiveLayer.decide(decisionRequest);
          await executionOS.execute(intent as any);
          
          // Force outbox processor to run immediately for Phase 4 certification
          await OutboxProcessor.processPending();
        }
      } catch (err) {
        console.error("[JourneyPipeline] Error in background processing:", err);
      }
    })();

    // 8. Return Success
    return NextResponse.json({
      status: "success",
      message: "Event ingested successfully",
      eventId: event.eventId
    }, { status: 201 });

  } catch (error: any) {
    console.error("[Event Gateway] Error ingesting event:", error);
    return NextResponse.json({ 
      error: "PROCESSING_ERROR", 
      message: error.message 
    }, { status: 500 });
  }
}

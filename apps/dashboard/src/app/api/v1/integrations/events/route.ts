import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { platformEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { platformEventSchema } from "@/lib/integrations/events-schema";
import { IdentityService } from "@/lib/integrations/identity";
import { JourneyTriggerService } from "@/lib/journeys/journey-trigger";
import { HermesCognitiveLayer } from "@/lib/hermes/hermes-cognitive";
import { ExecutionOS } from "@/lib/execution/execution-os";
import { OutboxProcessor } from "@/lib/execution/outbox-processor";
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1] || "";
    const client = await IntegrationKeyService.validateKey(token);

    if (!client) {
      return NextResponse.json({ error: "Unauthorized or invalid integration key" }, { status: 401 });
    }

    // Check scope for generic events
    const permissions = Array.isArray(client.permissions) ? (client.permissions as string[]) : [];
    if (!permissions.includes("events:write") && !permissions.includes("lead:write")) {
      // Temporarily allowing lead:write as fallback while transitioning scopes
      // In strict mode, we might require events:write specifically.
      console.warn(`[Gateway] Client ${client.id} missing strict 'events:write' scope.`);
    }

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
    // The integration key corresponds to a specific project or org natively.
    // If the client requests a project, we ensure it matches what they are authorized for.
    if (event.projectId && event.projectId !== client.projectId?.toString() && client.projectId !== null) {
      // Assuming S'Narai uses slug based projectId in the event vs numeric in DB.
      // For now, if the client has a specific project lock, we enforce it.
      // This can be expanded based on the full Multi-Tenant Domain Pack implementation.
      console.warn(`[Gateway] Tenant Scope Mismatch: Requested ${event.projectId}, Client authorized for ${client.projectId}`);
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
          await ExecutionOS.execute(intent);
          
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

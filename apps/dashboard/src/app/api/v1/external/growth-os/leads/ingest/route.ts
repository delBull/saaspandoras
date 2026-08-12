import { NextRequest, NextResponse } from "next/server";
import { POST as EventsPost } from "@/app/api/v1/integrations/events/route";

/**
 * Alias endpoint for Media Co / Lead Ads.
 * Normalizes a flat lead payload into the canonical PlatformEvent contract
 * and forwards it to the main Event Gateway.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Generate a correlation ID if one wasn't provided by Media Co
    const correlationId = rawBody.correlationId || rawBody.utm_campaign || `corr_${Date.now()}`;
    
    // Fallback event ID for idempotency if not provided
    const eventId = rawBody.eventId || `evt_lead_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Translate to PlatformEvent
    const platformEvent = {
      eventId: eventId,
      eventType: "LEAD_GENERATED",
      source: {
        system: rawBody.source || "media_co_legacy",
        channel: rawBody.channel || "web"
      },
      requestedOrganizationId: rawBody.organizationId,
      projectId: rawBody.projectId,
      occurredAt: rawBody.occurredAt || new Date().toISOString(),
      correlationId: correlationId,
      
      identity: {
        email: rawBody.email || "",
        phone: rawBody.phone || "",
        externalId: rawBody.externalId || ""
      },
      
      attribution: {
        campaignId: rawBody.campaignId,
        utm_source: rawBody.utm_source,
        utm_medium: rawBody.utm_medium,
        utm_campaign: rawBody.utm_campaign,
        utm_content: rawBody.utm_content,
        utm_term: rawBody.utm_term
      },
      
      payload: {
        firstName: rawBody.firstName,
        lastName: rawBody.lastName,
        ...rawBody.payload // capture any additional flat fields
      }
    };

    // Forward to the main Event Gateway
    // We create a new NextRequest to simulate the incoming call, preserving headers (like Auth)
    const forwardedReq = new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify(platformEvent)
    });

    return EventsPost(forwardedReq);

  } catch (error: any) {
    console.error("[Leads Ingest] Normalization error:", error);
    return NextResponse.json({ 
      error: "NORMALIZATION_ERROR", 
      message: error.message 
    }, { status: 400 });
  }
}

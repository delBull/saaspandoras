import { NextRequest, NextResponse } from "next/server";
import { WebhookProcessor } from "@/lib/integrations/webhook-processor";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/dispatch-webhooks
 *
 * Processes pending webhook events from the webhook_events table and
 * dispatches them to registered integration clients (e.g., Bull's Lab).
 *
 * Protected by CRON_SECRET — set this in Railway environment variables.
 * Railway cron should call: GET /api/cron/dispatch-webhooks
 * every 1 minute with header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  // Security: Only allow calls with the correct cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    // In development/test without CRON_SECRET, allow localhost only
    const host = req.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    if (!isLocal) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured. Set it in Railway environment variables." },
        { status: 500 }
      );
    }
  }

  const startTime = Date.now();

  try {
    await WebhookProcessor.processPendingEvents(20); // Process up to 20 per run

    return NextResponse.json({
      success: true,
      message: "Webhook dispatch completed",
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error("[cron:dispatch-webhooks] Fatal error:", e);
    return NextResponse.json(
      { error: "Dispatch failed", detail: e.message, duration_ms: Date.now() - startTime },
      { status: 500 }
    );
  }
}

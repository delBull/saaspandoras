import { NextRequest, NextResponse } from "next/server";
import { OutboxProcessor } from "@/lib/outbox/processor";

// Wire the Execution Bridge handlers (operational_intent::OPERATIONAL_INTENT_APPROVED)
// into the global outbox registry before the processor drains events.
import "~/lib/pandoras/composition/execution-composition";

// Configured for Vercel Cron. This route should only be accessible via cron.
// We can use a shared secret in headers to secure it.
export const maxDuration = 60; // Max duration for hobby is 10s, pro is 60s, enterprise 900s. Adjust based on Vercel plan.
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Basic security check to ensure this is only called by Vercel Cron or authorized runner.
  // In Vercel, the cron jobs send an 'Authorization' header with 'Bearer CRON_SECRET'.
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Allow passing batchSize via query param for manual triggering/testing
  const searchParams = request.nextUrl.searchParams;
  const batchSizeParam = searchParams.get('batchSize');
  const batchSize = batchSizeParam ? parseInt(batchSizeParam, 10) : 50;

  console.log(`[Cron] Starting Outbox Processor (Batch Size: ${batchSize})...`);
  
  const processor = new OutboxProcessor({
    batchSize: batchSize,
    workerId: `cron-${Date.now()}`
  });

  const result = await processor.processBatch();

  console.log(`[Cron] Outbox Processor finished. Result:`, result);

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { accessRequests } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { sendGenesisWelcomeEmail } from "@/lib/marketing/growth-engine/email-senders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ⏱️ Selection Executor (Perceived Delay Processor)
 * ============================================================================
 * Flip 'pending' requests to 'approved' if they have reached their 
 * 'eligibleAt' timestamp.
 * ============================================================================
 */
export async function GET(request: Request) {
  // 🛡️ Security Check (Vercel Cron Secret)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();

    // ── ATOMIC SELECTION (Scale Ready) ──────────────────────────────────────
    // We use a raw SQL update with FOR UPDATE SKIP LOCKED to ensure
    // zero concurrency overlap and zero duplicate emails.
    const processed = await db.execute(sql`
      UPDATE access_requests
      SET 
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = 'SYSTEM_CRON_ATOMIC'
      WHERE id IN (
        SELECT id FROM access_requests
        WHERE status = 'pending'
        AND eligible_at <= NOW()
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, email;
    `);

    const rows = processed as unknown as { id: number; email: string }[];

    if (rows.length === 0) {
      return NextResponse.json({ processed: 0, message: "No requests eligible yet." });
    }

    console.log(`⏱️ [cron/process-approvals] Atomics: Processed ${rows.length} approvals.`);

    // ── DELAYED FEEDBACK (Bonus) ────────────────────────────────────────────
    // We wait 30s before sending emails so users currently on the site
    // see the "Unlocked" status before the email notification hits.
    for (const row of rows) {
      setTimeout(() => {
        sendGenesisWelcomeEmail({ to: row.email })
          .catch(e => console.error(`[cron] Email failed for ${row.email}:`, e));
      }, 30000);
    }

    return NextResponse.json({ 
      processed: rows.length, 
      ids: rows.map(r => r.id) 
    });

  } catch (err) {
    console.error("[/api/cron/process-approvals]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

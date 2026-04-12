import { NextRequest, NextResponse } from "next/server";
import { validateExternalKey } from "@/lib/api-auth/validate-external-key";
import { db } from "@/db";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/external/operations/health
 *
 * Returns system health status for Bull's Lab monitoring.
 *
 * NOTE: This is a READ-ONLY health check. No sensitive config is exposed.
 * Requires API key with: read:operations
 *
 * Returns:
 *   - Database connectivity
 *   - System timestamp
 *   - Table record counts (non-sensitive sanity checks)
 */
export async function GET(req: NextRequest) {
  const { client, error } = await validateExternalKey(req, "read:operations");
  if (error || !client) {
    return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const checks: Record<string, { status: "ok" | "degraded" | "error"; latency_ms?: number; detail?: string }> = {};

  // ── Database check ──────────────────────────────────────────────────────────
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1 AS ping`);
    checks.database = { status: "ok", latency_ms: Date.now() - dbStart };
  } catch (e: any) {
    checks.database = { status: "error", detail: "DB unreachable" };
  }

  // ── Row sanity checks (non-sensitive counts) ─────────────────────────────────
  try {
    const { users: usersTable, marketingLeads, projects: projectsTable, webhookEvents } = await import("@/db/schema");
    
    const [userRes, leadRes, projectRes, webhookRes] = await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(usersTable).limit(1),
      db.select({ n: sql<number>`count(*)::int` }).from(marketingLeads).limit(1),
      db.select({ n: sql<number>`count(*)::int` }).from(projectsTable).limit(1),
      db.select({ n: sql<number>`count(*)::int` }).from(webhookEvents).where(eq(webhookEvents.status, 'pending')).limit(1),
    ]);

    checks.data_sanity = {
      status: "ok",
      detail: JSON.stringify({
        users: userRes[0]?.n ?? 0,
        leads: leadRes[0]?.n ?? 0,
        projects: projectRes[0]?.n ?? 0,
        pending_webhooks: webhookRes[0]?.n ?? 0,
      }),
    };
  } catch (e: any) {
    console.error("[Health] Sanity check failed:", e);
    checks.data_sanity = { status: "degraded", detail: "Count queries failed" };
  }

  const allOk = Object.values(checks).every(c => c.status === "ok");
  const anyError = Object.values(checks).some(c => c.status === "error");

  const overallStatus = anyError ? "degraded" : allOk ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      version: "1.0.0",
      environment: process.env.NODE_ENV ?? "unknown",
      total_latency_ms: Date.now() - startTime,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: anyError ? 503 : 200 }
  );
}

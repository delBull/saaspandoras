import { NextResponse } from "next/server";
import { dueJobs } from "@/lib/prospecting/repo";
import { runProspectJob } from "@/lib/prospecting/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * `GET /api/cron/prospects` — worker de prospección.
 *
 * Lo llama el cron (GitHub Actions / Vercel) con `Authorization: Bearer CRON_SECRET`.
 * Toma los jobs cuya `next_run_at` ya venció y los corre con presupuesto corto.
 * No crea jobs ni manda correos: sólo recolecta y deja la bandeja lista.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const forcedJobId = url.searchParams.get("jobId");
  const budgetMs = Number.parseInt(url.searchParams.get("budgetMs") ?? "20000", 10) || 20_000;

  const jobs = forcedJobId
    ? [{ id: forcedJobId, canonicalOrgId: url.searchParams.get("orgId") ?? "pandoras" }]
    : await dueJobs(3);

  if (jobs.length === 0) {
    return NextResponse.json({ ok: true, ran: 0, message: "sin jobs vencidos" });
  }

  const results = [];
  for (const job of jobs) {
    try {
      const summary = await runProspectJob({
        jobId: job.id,
        orgId: job.canonicalOrgId,
        budgetMs,
      });
      results.push(summary);
    } catch (error) {
      // El runner ya persiste FAILED en la mayoría de casos; esto cubre el resto.
      results.push({
        jobId: job.id,
        status: "FAILED",
        error: (error as Error).message ?? "error inesperado",
      });
    }
  }

  return NextResponse.json({ ok: true, ran: results.length, results });
}

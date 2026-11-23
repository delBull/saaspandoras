import { NextResponse } from "next/server";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { runProspectJob } from "@/lib/prospecting/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Vercel: una corrida acotada a ~45 s de recolección. */
export const maxDuration = 60;

/**
 * `POST /api/nexus/prospects/jobs/[id]/run` — ejecuta el job ahora.
 *
 * Devuelve el resumen real: cuántos candidatos, cuántos entraron, cuántos se
 * descartaron y el motivo de cada fuente. Nunca un "ok" vacío.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  const jobId = (await params).id;
  const summary = await runProspectJob({
    jobId,
    orgId: actor!.canonicalOrgId,
    budgetMs: 45_000,
  });

  const status = summary.status === "FAILED" ? 502 : 200;
  return NextResponse.json(summary, { status });
}

import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusProspectJobs } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { getJob, jobSpec, listProspects, nextRunFor } from "@/lib/prospecting/repo";
import { asSchedule, normalizeSpec } from "@/lib/prospecting/spec";
import type { JobSpec } from "@/lib/prospecting/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** `GET /api/nexus/prospects/jobs/[id]` — job con sus prospectos recientes. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  const job = await getJob(actor!.canonicalOrgId, (await params).id);
  if (!job) return NextResponse.json({ error: "Job no encontrado." }, { status: 404 });

  const prospects = await listProspects({
    orgId: actor!.canonicalOrgId,
    jobId: job.id,
    limit: 50,
  });

  return NextResponse.json({ job: { ...job, spec: jobSpec(job) }, prospects });
}

/**
 * `PATCH /api/nexus/prospects/jobs/[id]` — edita reglas, frecuencia o estado.
 *
 * Body: { label?, schedule?, status?, rules?, spec? }
 * Estados permitidos: QUEUED (reactivar), PAUSED, FAILED→QUEUED.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const job = await getJob(actor!.canonicalOrgId, (await params).id);
  if (!job) return NextResponse.json({ error: "Job no encontrado." }, { status: 404 });

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof body.label === "string" && body.label.trim()) {
    patch.label = body.label.trim().slice(0, 255);
  }

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!["QUEUED", "PAUSED", "DONE", "FAILED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    patch.status = status;
    if (status === "QUEUED") patch.nextRunAt = nextRunFor(asSchedule(job.schedule));
  }

  if (body.schedule !== undefined) {
    const schedule = asSchedule(body.schedule);
    patch.schedule = schedule;
    patch.nextRunAt = nextRunFor(schedule);
  }

  if (body.spec !== undefined || body.rules !== undefined) {
    const current: JobSpec = jobSpec(job);
    const candidate = {
      ...current,
      ...(typeof body.spec === "object" && body.spec ? (body.spec as Record<string, unknown>) : {}),
      rules: {
        ...current.rules,
        ...(typeof body.rules === "object" && body.rules ? (body.rules as Record<string, unknown>) : {}),
      },
    };
    const spec = normalizeSpec(candidate, current.query);
    patch.spec = spec;
    patch.maxAgeDays = spec.rules.maxAgeDays;
    patch.minConfidence = spec.rules.minConfidence;
  }

  const [updated] = await db
    .update(nexusProspectJobs)
    .set(patch)
    .where(
      and(
        eq(nexusProspectJobs.id, job.id),
        eq(nexusProspectJobs.canonicalOrgId, actor!.canonicalOrgId),
      ),
    )
    .returning();

  if (!updated) return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });

  return NextResponse.json({ job: { ...updated, spec: jobSpec(updated) } });
}

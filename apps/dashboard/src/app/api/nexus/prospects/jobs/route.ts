import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPods } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { createJob, jobSpec, listJobs, prospectCounts } from "@/lib/prospecting/repo";
import { asSchedule, normalizeSpec } from "@/lib/prospecting/spec";
import { textToSpec } from "@/lib/prospecting/text-to-spec";
import { llmAvailable } from "@/lib/prospecting/extract";
import type { JobSpec } from "@/lib/prospecting/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** `GET /api/nexus/prospects/jobs` — jobs de la organización + conteo de bandeja. */
export async function GET() {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  const jobs = await listJobs(actor!.canonicalOrgId);
  const counts = await prospectCounts(actor!.canonicalOrgId);

  return NextResponse.json({
    jobs: jobs.map((job) => ({ ...job, spec: jobSpec(job) })),
    counts,
    llmAvailable: llmAvailable(),
  });
}

/**
 * `POST /api/nexus/prospects/jobs` — crea un job (formulario o text-to-scrap).
 *
 * Body:
 *  - modo texto:  { label?, podId?, text, schedule? }
 *  - modo reglas: { label, podId?, query, spec, schedule? }
 *
 * El `podId` es una propuesta del cliente: se valida contra la organización.
 */
export async function POST(req: Request) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const orgId = actor!.canonicalOrgId;

  let podId: string | null = null;
  if (typeof body.podId === "string" && body.podId.trim()) {
    const [pod] = await db
      .select({ id: nexusDealPods.id })
      .from(nexusDealPods)
      .where(and(eq(nexusDealPods.id, body.podId.trim()), eq(nexusDealPods.canonicalOrgId, orgId)))
      .limit(1);
    if (!pod) return NextResponse.json({ error: "Pod no encontrado." }, { status: 404 });
    podId = pod.id;
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const isText = text.length > 0 || String(body.mode).toUpperCase() === "TEXT";

  let spec: JobSpec;
  let suggestedSchedule = null as ReturnType<typeof asSchedule> | null;
  let notes: string[] = [];

  if (isText) {
    if (!text) return NextResponse.json({ error: "Falta el texto de la búsqueda." }, { status: 400 });
    const parsed = await textToSpec(text.slice(0, 4000));
    spec = parsed.spec;
    suggestedSchedule = parsed.suggestedSchedule;
    notes = parsed.notes;
  } else {
    spec = normalizeSpec(body.spec ?? { query: body.query }, typeof body.query === "string" ? body.query : "");
    if (!spec.query.trim()) {
      return NextResponse.json({ error: "La consulta es obligatoria." }, { status: 400 });
    }
  }

  const schedule = body.schedule ? asSchedule(body.schedule) : suggestedSchedule ?? "MANUAL";
  const label =
    (typeof body.label === "string" ? body.label.trim().slice(0, 255) : "") ||
    spec.query.slice(0, 255) ||
    "Búsqueda sin título";

  const job = await createJob({
    orgId,
    podId,
    label,
    mode: isText ? "TEXT" : "SEARCH",
    query: isText ? text.slice(0, 2000) : spec.query,
    spec,
    schedule,
    createdBy: actor!.email ?? actor!.collaboratorId ?? null,
  });

  if (!job) return NextResponse.json({ error: "No se pudo crear el job." }, { status: 500 });

  return NextResponse.json({ job: { ...job, spec }, notes }, { status: 201 });
}

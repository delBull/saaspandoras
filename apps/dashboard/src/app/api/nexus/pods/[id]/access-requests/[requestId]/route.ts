import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPods } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { decideAccessRequest } from "@/lib/nexus/deal-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * `POST /api/nexus/pods/[id]/access-requests/[requestId]` — decide la solicitud.
 *
 * Body: { action: "approve" | "reject", note? }
 *  · approve → registra firmante + envía magic link (actor y auditoría).
 *  · reject  → cierra con motivo; no se registra nada del solicitante.
 *
 * Sólo el propietario/SUPER_ADMIN del pod, siempre dentro de su organización.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const action = body.action === "reject" ? "reject" : body.action === "approve" ? "approve" : null;
  if (!action) {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const { id: podId, requestId } = await params;
  const orgId = actor!.canonicalOrgId;

  const [pod] = await db
    .select({ id: nexusDealPods.id })
    .from(nexusDealPods)
    .where(and(eq(nexusDealPods.id, podId), eq(nexusDealPods.canonicalOrgId, orgId)))
    .limit(1);

  if (!pod) return NextResponse.json({ error: "Pod no encontrado." }, { status: 404 });

  const result = await decideAccessRequest({
    requestId,
    podId,
    orgId,
    actor: actor!.email ?? actor!.collaboratorId ?? "Nexus Ops",
    action,
    note: typeof body.note === "string" ? body.note.slice(0, 1000) : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}

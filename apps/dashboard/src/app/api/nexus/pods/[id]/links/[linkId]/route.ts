import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPods, nexusOutreachLinks } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { requirePodActor } from "@/lib/nexus/pod-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `PATCH /api/nexus/pods/[id]/links/[linkId]` — desactiva o edita una semilla.
 * Body: { disabled?: boolean, targetLabel?, targetOrg?, targetRole?, door? }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  const { id, linkId } = await params;
  const [pod] = await db
    .select({ id: nexusDealPods.id })
    .from(nexusDealPods)
    .where(and(eq(nexusDealPods.id, id), eq(nexusDealPods.canonicalOrgId, actor!.canonicalOrgId)))
    .limit(1);
  if (!pod) return NextResponse.json({ error: "Pod no encontrado." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.disabled === "boolean") patch.disabledAt = body.disabled ? new Date() : null;
  if (typeof body.targetLabel === "string" && body.targetLabel.trim()) {
    patch.targetLabel = body.targetLabel.trim().slice(0, 255);
  }
  if (typeof body.targetOrg === "string") patch.targetOrg = body.targetOrg.trim().slice(0, 255) || null;
  if (typeof body.targetRole === "string") patch.targetRole = body.targetRole.trim().slice(0, 255) || null;
  if (typeof body.door === "string") patch.door = body.door || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const [updated] = await db
    .update(nexusOutreachLinks)
    .set(patch)
    .where(and(eq(nexusOutreachLinks.id, linkId), eq(nexusOutreachLinks.podId, pod.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Semilla no encontrada." }, { status: 404 });
  return NextResponse.json({ link: updated });
}

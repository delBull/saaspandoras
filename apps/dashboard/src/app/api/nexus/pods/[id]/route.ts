import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPods } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { requirePodActor } from "@/lib/nexus/pod-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["ACTIVE", "PAUSED", "CLOSED_WON", "CLOSED_LOST", "ARCHIVED"]);
const CONFIDENTIALITY = new Set(["OFF_MARKET", "CONFIDENTIAL", "PUBLIC"]);

/** `PATCH /api/nexus/pods/[id]` — edita nombre, estado, confidencialidad y economía. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.displayName === "string" && body.displayName.trim()) {
    patch.displayName = body.displayName.trim().slice(0, 255);
  }
  if (typeof body.status === "string" && STATUSES.has(body.status)) patch.status = body.status;
  if (typeof body.confidentiality === "string" && CONFIDENTIALITY.has(body.confidentiality)) {
    patch.confidentiality = body.confidentiality;
  }
  if (typeof body.feeEntity === "string") patch.feeEntity = body.feeEntity.trim().slice(0, 255) || null;
  if (body.feePct !== undefined && body.feePct !== null && body.feePct !== "") {
    const pct = Number(body.feePct);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return NextResponse.json({ error: "El porcentaje debe estar entre 0 y 100." }, { status: 400 });
    }
    patch.feePct = pct.toFixed(2);
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(nexusDealPods)
      .set(patch)
      .where(and(eq(nexusDealPods.id, (await params).id), eq(nexusDealPods.canonicalOrgId, actor!.canonicalOrgId)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Pod no encontrado." }, { status: 404 });
    return NextResponse.json({ pod: updated });
  } catch (e) {
    console.error("[Pods] PATCH error:", e);
    return NextResponse.json({ error: "No se pudo actualizar el pod." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusProspects } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { requirePodActor } from "@/lib/nexus/pod-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `POST /api/nexus/prospects/[id]/reject` — descarta con motivo.
 *
 * El motivo es obligatorio: un rechazo sin razón no enseña nada al siguiente
 * job y hace imposible auditar por qué se descartó una fuente.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
  if (!reason) {
    return NextResponse.json({ error: "Indica el motivo del rechazo." }, { status: 400 });
  }

  const [updated] = await db
    .update(nexusProspects)
    .set({ status: "REJECTED", rejectReason: reason, updatedAt: new Date() })
    .where(
      and(
        eq(nexusProspects.id, (await params).id),
        eq(nexusProspects.canonicalOrgId, actor!.canonicalOrgId),
      ),
    )
    .returning();

  if (!updated) return NextResponse.json({ error: "Prospecto no encontrado." }, { status: 404 });

  return NextResponse.json({ prospect: updated });
}

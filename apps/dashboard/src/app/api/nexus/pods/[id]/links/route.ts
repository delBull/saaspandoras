import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPods, nexusOutreachLinks } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { normalizeCode, requirePodActor } from "@/lib/nexus/pod-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOORS = new Set(["CONSOLIDATOR", "BROKER", "PATIENT_CAPITAL", "SOVEREIGN", "MX_FAMILY"]);

/**
 * `POST /api/nexus/pods/[id]/links` — crea una semilla con su link de radar.
 *
 * Body: { targetLabel, targetOrg?, targetRole?, door?, code? }
 * Si no llega `code`, se deriva del target. Devuelve `url` lista para copiar.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const podId = (await params).id;
  const [pod] = await db
    .select({ id: nexusDealPods.id, code: nexusDealPods.code })
    .from(nexusDealPods)
    .where(and(eq(nexusDealPods.id, podId), eq(nexusDealPods.canonicalOrgId, actor!.canonicalOrgId)))
    .limit(1);

  if (!pod) return NextResponse.json({ error: "Pod no encontrado." }, { status: 404 });

  const targetLabel = typeof body.targetLabel === "string" ? body.targetLabel.trim().slice(0, 255) : "";
  if (!targetLabel) return NextResponse.json({ error: "El objetivo es obligatorio." }, { status: 400 });

  const code = normalizeCode(body.code) ?? normalizeCode(targetLabel);
  if (!code) return NextResponse.json({ error: "No se pudo derivar un código válido." }, { status: 400 });

  const door = DOORS.has(String(body.door)) ? String(body.door) : null;

  try {
    const [created] = await db
      .insert(nexusOutreachLinks)
      .values({
        podId: pod.id,
        code,
        door,
        targetLabel,
        targetOrg: typeof body.targetOrg === "string" ? body.targetOrg.trim().slice(0, 255) || null : null,
        targetRole: typeof body.targetRole === "string" ? body.targetRole.trim().slice(0, 255) || null : null,
      })
      .returning();

    if (!created) {
      return NextResponse.json({ error: "No se pudo crear la semilla." }, { status: 500 });
    }

    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://nexus.pandoras.finance").replace(/\/$/, "");
    return NextResponse.json({ link: created, url: `${base}/l/${created.code}` }, { status: 201 });
  } catch (e: any) {
    if (String(e?.code) === "23505") {
      return NextResponse.json({ error: "Ese código de link ya existe." }, { status: 409 });
    }
    console.error("[Pods] link POST error:", e);
    return NextResponse.json({ error: "No se pudo crear la semilla." }, { status: 500 });
  }
}

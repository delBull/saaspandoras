import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPods, nexusDealRooms } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { generateDealPreviewToken } from "@saasfly/nexus-deals-sdk";
import { requirePodActor } from "@/lib/nexus/pod-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `POST /api/nexus/pods/[id]/preview` — enlace de revisión para el operador.
 *
 * Devuelve una URL de **solo lectura** válida 10 minutos. No registra firmante,
 * no envía correos y no permite firmar: sirve para revisar una sala desde el pod
 * sin quedar obligado a firmarla.
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

  const publicId = typeof body.publicId === "string" ? body.publicId.trim() : "";
  if (!publicId) return NextResponse.json({ error: "Falta la sala." }, { status: 400 });

  const podId = (await params).id;
  const [pod] = await db
    .select({ id: nexusDealPods.id })
    .from(nexusDealPods)
    .where(and(eq(nexusDealPods.id, podId), eq(nexusDealPods.canonicalOrgId, actor!.canonicalOrgId)))
    .limit(1);

  if (!pod) return NextResponse.json({ error: "Pod no encontrado." }, { status: 404 });

  const [room] = await db
    .select({ id: nexusDealRooms.id, publicId: nexusDealRooms.publicId })
    .from(nexusDealRooms)
    .where(and(eq(nexusDealRooms.publicId, publicId), eq(nexusDealRooms.podId, pod.id)))
    .limit(1);

  if (!room) return NextResponse.json({ error: "La sala no pertenece a este pod." }, { status: 404 });

  const token = generateDealPreviewToken(
    room.id,
    room.publicId,
    actor!.email ?? actor!.collaboratorId ?? "Nexus Ops",
  );
  if (!token) {
    return NextResponse.json(
      { error: "Falta NEXUS_DEAL_TOKEN_SECRET: no se puede firmar el enlace." },
      { status: 503 },
    );
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://nexus.pandoras.finance").replace(/\/$/, "");
  return NextResponse.json({ url: `${base}/deal/${room.publicId}?pv=${encodeURIComponent(token)}`, expiresInMinutes: 10 });
}

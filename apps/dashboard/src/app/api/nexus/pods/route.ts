import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db";
import { nexusDealPods, nexusDealRooms, nexusOutreachLinks } from "@saasfly/db/schema";
import { desc, eq, sql } from "@saasfly/db-core";
import { nexusOutreachEvents } from "@saasfly/db/schema";
import { requirePodActor, normalizeCode } from "@/lib/nexus/pod-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIDENTIALITY = new Set(["OFF_MARKET", "CONFIDENTIAL", "PUBLIC"]);

/**
 * `GET /api/nexus/pods` — lista de Deal Pods.
 *
 * Solo el creador del pod o un SUPER_ADMIN. No hay tenant: el pod vive en la org
 * existente y se aísla por `pod_id`.
 */
export async function GET() {
  try {
    const auth = await getNexusAuthContext();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Sesión de Nexus requerida." }, { status: 401 });
    }
    const permissions = (auth.permissions ?? {}) as unknown as Record<string, unknown>;
    const role = String(auth.role ?? "");
    const isOwner = role === "SUPER_ADMIN" || role === "OWNER" || permissions.all === true;
    if (!isOwner) {
      return NextResponse.json({ error: "Solo el propietario o SUPER_ADMIN." }, { status: 403 });
    }

    const pods = await db.select().from(nexusDealPods).orderBy(desc(nexusDealPods.createdAt));

    const links = await db
      .select({
        id: nexusOutreachLinks.id,
        podId: nexusOutreachLinks.podId,
        code: nexusOutreachLinks.code,
        door: nexusOutreachLinks.door,
        targetLabel: nexusOutreachLinks.targetLabel,
        targetOrg: nexusOutreachLinks.targetOrg,
        targetRole: nexusOutreachLinks.targetRole,
        createdAt: nexusOutreachLinks.createdAt,
      })
      .from(nexusOutreachLinks)
      .orderBy(desc(nexusOutreachLinks.createdAt));

    const events = await db
      .select({
        linkId: nexusOutreachEvents.linkId,
        opens: sql<number>`count(*)::int`,
        lastOpen: sql<string | null>`max(${nexusOutreachEvents.at})`,
      })
      .from(nexusOutreachEvents)
      .where(eq(nexusOutreachEvents.event, "OPEN"))
      .groupBy(nexusOutreachEvents.linkId);

    const eventsByLink = new Map(events.map((row) => [row.linkId, row]));

    const rooms = await db
      .select({ podId: nexusDealRooms.podId, publicId: nexusDealRooms.publicId, status: nexusDealRooms.status })
      .from(nexusDealRooms)
      .where(sql`${nexusDealRooms.podId} is not null`);

    return NextResponse.json({
      pods: pods.map((pod) => ({
        ...pod,
        linkCount: links.filter((link) => link.podId === pod.id).length,
        links: links
          .filter((link) => link.podId === pod.id)
          .map((link) => ({
            ...link,
            opens: Number(eventsByLink.get(link.id)?.opens ?? 0),
            lastOpen: eventsByLink.get(link.id)?.lastOpen ?? null,
          })),
        rooms: rooms.filter((room) => room.podId === pod.id),
      })),
    });
  } catch (error) {
    console.error("[Pods] GET error:", error);
    return NextResponse.json({ error: "No se pudieron cargar los Deal Pods." }, { status: 500 });
  }
}

/**
 * `POST /api/nexus/pods` — crea un Deal Pod.
 *
 * Contrato pensado para reutilizarse desde otra UI o una API externa: recibe el
 * código, nombre, confidencialidad y economía; la organización sale de la sesión.
 */
export async function POST(req: Request) {
  const { actor, error } = await requirePodActor();
  if (error) return error;

  let body: {
    code?: unknown;
    displayName?: unknown;
    confidentiality?: unknown;
    feeEntity?: unknown;
    feePct?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const code = normalizeCode(body.code);
  const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 255) : "";
  if (!code) return NextResponse.json({ error: "El código debe tener 3–48 caracteres (a-z, 0-9, guiones)." }, { status: 400 });
  if (!displayName) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  const confidentiality = CONFIDENTIALITY.has(String(body.confidentiality))
    ? String(body.confidentiality)
    : "OFF_MARKET";
  const feeEntity = typeof body.feeEntity === "string" ? body.feeEntity.trim().slice(0, 255) : null;
  const feePctRaw = Number(body.feePct);
  const feePct = Number.isFinite(feePctRaw) && feePctRaw > 0 && feePctRaw <= 100 ? feePctRaw.toFixed(2) : null;

  try {
    const [created] = await db
      .insert(nexusDealPods)
      .values({
        code,
        displayName,
        status: "ACTIVE",
        confidentiality,
        feeEntity,
        feePct,
        currency: "USD",
        canonicalOrgId: actor!.canonicalOrgId,
        createdBy: actor!.email,
        config: { landing: `/pitch/${code}` },
      })
      .returning();

    return NextResponse.json({ pod: created }, { status: 201 });
  } catch (e: any) {
    if (String(e?.code) === "23505") {
      return NextResponse.json({ error: "Ese código ya existe." }, { status: 409 });
    }
    console.error("[Pods] POST error:", e);
    return NextResponse.json({ error: "No se pudo crear el pod." }, { status: 500 });
  }
}

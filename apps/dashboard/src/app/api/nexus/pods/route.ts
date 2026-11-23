import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db";
import { nexusDealPods, nexusDealRooms, nexusOutreachLinks } from "@saasfly/db/schema";
import { desc, eq, sql } from "@saasfly/db-core";
import { nexusOutreachEvents } from "@saasfly/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

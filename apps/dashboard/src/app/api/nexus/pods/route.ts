import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db";
import { nexusDealPods, nexusDealRooms, nexusOutreachLinks } from "@saasfly/db/schema";
import { desc, eq, sql } from "@saasfly/db-core";

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
    if (auth.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Solo SUPER_ADMIN." }, { status: 403 });
    }

    const pods = await db.select().from(nexusDealPods).orderBy(desc(nexusDealPods.createdAt));

    const links = await db
      .select({ podId: nexusOutreachLinks.podId, total: sql<number>`count(*)::int` })
      .from(nexusOutreachLinks)
      .groupBy(nexusOutreachLinks.podId);
    const linksByPod = new Map(links.map((row) => [row.podId, Number(row.total ?? 0)]));

    const rooms = await db
      .select({ podId: nexusDealRooms.podId, publicId: nexusDealRooms.publicId, status: nexusDealRooms.status })
      .from(nexusDealRooms)
      .where(sql`${nexusDealRooms.podId} is not null`);

    return NextResponse.json({
      pods: pods.map((pod) => ({
        ...pod,
        links: linksByPod.get(pod.id) ?? 0,
        rooms: rooms.filter((room) => room.podId === pod.id),
      })),
    });
  } catch (error) {
    console.error("[Pods] GET error:", error);
    return NextResponse.json({ error: "No se pudieron cargar los Deal Pods." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { validateDealRoomAccess } from "@/lib/admin-auth";
import { getRoom, canUserAccessDeal } from "@saasfly/nexus-deals-sdk";
import { db } from "@saasfly/db-core";
import { meetings } from "@saasfly/db-core";
import { desc, eq } from "@saasfly/db-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE — Sesiones de un Deal Room
 * ===============================================
 * `GET /api/nexus/deals/:id/meetings` (id = roomId interno)
 *
 * Alimenta el bloque "Última sesión" de Clients & CRM: qué se presentó, cuánto
 * duró y qué notas dejó el host. Es lectura: la captura y el envío del
 * seguimiento viven en la agenda y en la sala (una sola implementación).
 *
 * Autoridad: misma que el resto del deal (`validateDealRoomAccess` +
 * `canUserAccessDeal`). Nunca se acepta el deal desde el cliente sin verificar.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, errorResponse } = await validateDealRoomAccess(request);
  if (errorResponse) return errorResponse;

  try {
    const room = await getRoom((await params).id);
    if (!room) return NextResponse.json({ error: "Room no encontrada" }, { status: 404 });

    const isSuperAdmin = session?.role === "SUPER_ADMIN";
    const userIdentifier = session?.address || session?.userId || "";
    const email = session?.email;

    if (!canUserAccessDeal(room, userIdentifier, email, isSuperAdmin)) {
      return NextResponse.json({ error: "No tienes permiso para ver este deal" }, { status: 403 });
    }

    const rows = await db
      .select({
        id: meetings.id,
        title: meetings.title,
        status: meetings.status,
        startsAt: meetings.startsAt,
        endsAt: meetings.endsAt,
        startedAt: meetings.startedAt,
        endedAt: meetings.endedAt,
        presentationId: meetings.presentationId,
        summary: meetings.aiSummary,
        notes: meetings.presenterNotes,
        followUpEnabled: meetings.followUpEnabled,
      })
      .from(meetings)
      .where(eq(meetings.dealRoomId, room.id))
      .orderBy(desc(meetings.startsAt))
      .limit(8);

    return NextResponse.json({ roomId: room.id, meetings: rows });
  } catch (error) {
    console.error("[DealMeetings] GET error:", error);
    return NextResponse.json({ error: "No se pudieron cargar las sesiones del deal." }, { status: 500 });
  }
}

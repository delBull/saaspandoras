import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { meetings, meetingPresentationState } from "@saasfly/db-core";
import { and, eq } from "@saasfly/db-core";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";
import { runSovereignFollowUps } from "@/lib/nexus/agenda-followups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 🏛️ ARCHITECTURE NOTE: Cierre de Sovereign Meet
 * =============================================
 * `POST /api/v1/meet/end` { ref } — solo el host.
 *
 * Este endpoint es el disparador real del ciclo post-presentación: marca la reunión
 * como `ended`, y a partir de ese estado el cron `sovereign-agenda-followups` envía
 * el seguimiento a los participantes pendientes.
 *
 * Sin este cierre, ninguna reunión llega a `ended` y el follow-up nunca corre.
 * Es idempotente: si ya está cerrada devuelve 200 con `alreadyEnded: true`.
 *
 * Autoridad: identidad resuelta por `resolveRoomActor` (sesión Nexus o joinRef
 * firmado). Nunca se acepta un collaboratorId del body.
 */

export async function POST(req: NextRequest) {
  let body: { ref?: unknown; meetingId?: unknown; sendFollowUp?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // El correo de cortesía es opcional: el host puede desactivarlo al finalizar.
  // El envío manual del resumen no depende de este flag.
  const sendFollowUp = body.sendFollowUp !== false;

  try {
    const { actor, error } = await resolveRoomActor(req.headers, body.ref, body.meetingId);
    if (error || !actor) {
      const failure = error ?? { status: 401, code: "UNAUTHORIZED", message: "No autorizado" };
      return NextResponse.json({ error: failure.message, code: failure.code }, { status: failure.status });
    }

    const [meeting] = await db
      .select()
      .from(meetings)
      .where(
        actor.orgId
          ? and(eq(meetings.id, actor.meetingId), eq(meetings.canonicalOrgId, actor.orgId))
          : eq(meetings.id, actor.meetingId)
      )
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada", code: "MEETING_NOT_FOUND" }, { status: 404 });
    }

    if (!isMeetingHost(meeting, actor.actorCollaboratorId)) {
      return NextResponse.json(
        { error: "Solo el host puede finalizar la reunión", code: "HOST_ONLY" },
        { status: 403 }
      );
    }

    if (meeting.status === "ended") {
      return NextResponse.json({ ok: true, meetingId: meeting.id, alreadyEnded: true });
    }

    if (meeting.status === "cancelled") {
      return NextResponse.json({ error: "La reunión fue cancelada", code: "MEETING_CANCELLED" }, { status: 409 });
    }

    const endedAt = new Date();
    const [updated] = await db
      .update(meetings)
      .set({ status: "ended", endedAt, updatedAt: endedAt, followUpEnabled: sendFollowUp })
      .where(eq(meetings.id, meeting.id))
      .returning({ id: meetings.id, endedAt: meetings.endedAt });

    if (!updated) {
      return NextResponse.json({ error: "No se pudo cerrar la reunión", code: "UPDATE_FAILED" }, { status: 500 });
    }

    // El deck deja de estar "en vivo" al cerrar (best-effort: no bloquea el cierre).
    try {
      await db
        .update(meetingPresentationState)
        .set({ presentationOpen: false, updatedAt: endedAt })
        .where(eq(meetingPresentationState.meetingId, meeting.id));
    } catch (error) {
      console.error("[MeetEnd] No se pudo cerrar el estado del deck:", error);
    }

    // Seguimiento inmediato SOLO si el host lo pidió. Si falla, la reunión ya quedó
    // `ended` y el cron lo reintenta: no se miente al cliente.
    let followUp: {
      dispatched: number;
      pending: number;
      noShow?: number;
      skipped?: boolean;
      error?: string;
    } = { dispatched: 0, pending: 0, skipped: !sendFollowUp };

    if (sendFollowUp) {
      try {
        const followUpSummary = await runSovereignFollowUps(updated.id);
        followUp = {
          dispatched: followUpSummary.sent,
          pending: followUpSummary.pending,
          noShow: followUpSummary.noShow,
        };
      } catch (err) {
        console.error("[MeetEnd] follow-up error:", err);
        followUp = { dispatched: 0, pending: 0, error: "FOLLOW_UP_FAILED_RETRY_VIA_CRON" };
      }
    }

    return NextResponse.json({
      ok: true,
      meetingId: updated.id,
      endedAt: updated.endedAt,
      followUp,
    });
  } catch (error) {
    console.error("[MeetEnd] error:", error);
    return NextResponse.json({ error: "Error interno", code: "INTERNAL" }, { status: 500 });
  }
}

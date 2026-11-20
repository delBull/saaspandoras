import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { meetings } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";
import { getNexusAuthContext } from "@saasfly/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Paso 3 · estado del seguimiento.
 *
 * `POST /api/v1/meet/follow-up/state`
 *   { meetingId, action: 'RESPONDED' | 'REMIND' | 'CLOSE' | 'REOPEN',
 *     days?, outcome?, reason?, note? }
 *
 * Autoridad: host por sesión/ref firmado, o admin de operaciones.
 * - No envía correos: solo mueve el estado. El recordatorio lo dispara el cron.
 * - Cerrar el ciclo **exige** motivo; sin motivo se rechaza (no se guarda un cierre vacío).
 */

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "ADMIN_OPERATIONS"]);
const MAX_NOTE = 500;
const MAX_REASON = 64;

type Stage = "SENT" | "RESPONDED" | "REMINDER" | "CLOSED_WON" | "CLOSED_LOST";

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: NextRequest) {
  let body: {
    meetingId?: unknown;
    ref?: unknown;
    action?: unknown;
    days?: unknown;
    outcome?: unknown;
    reason?: unknown;
    note?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return fail(400, "INVALID_BODY", "El cuerpo no es JSON válido.");
  }

  const meetingId = typeof body.meetingId === "string" ? body.meetingId : "";
  if (!meetingId) return fail(400, "MISSING_MEETING_ID", "meetingId es requerido.");

  try {
    const { actor, error } = await resolveRoomActor(req.headers, body.ref, meetingId);
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

    if (!meeting) return fail(404, "MEETING_NOT_FOUND", "Reunión no encontrada.");
    if (meeting.status !== "ended") return fail(409, "MEETING_NOT_ENDED", "La reunión aún no termina.");

    const sessionAuth = await getNexusAuthContext();
    const isAdmin = sessionAuth.isAuthenticated && ADMIN_ROLES.has(String(sessionAuth.role ?? ""));
    if (!isMeetingHost(meeting, actor.actorCollaboratorId) && !isAdmin) {
      return fail(403, "HOST_ONLY", "Solo el anfitrión puede mover el seguimiento.");
    }

    const action = String(body.action ?? "").toUpperCase();
    const now = new Date();
    let stage: Stage;
    const patch: Record<string, unknown> = { updatedAt: now };

    if (action === "RESPONDED") {
      stage = "RESPONDED";
      patch.followUpStage = stage;
      patch.followUpRespondedAt = now;
      patch.followUpReminderAt = null;
    } else if (action === "REMIND") {
      const days = Number(body.days ?? 3);
      if (!Number.isFinite(days) || days < 1 || days > 30) {
        return fail(400, "INVALID_DAYS", "El recordatorio debe ser entre 1 y 30 días.");
      }
      stage = "REMINDER";
      patch.followUpStage = stage;
      patch.followUpReminderAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      patch.followUpReminderSentAt = null;
    } else if (action === "CLOSE") {
      const outcome = String(body.outcome ?? "").toLowerCase();
      if (outcome !== "won" && outcome !== "lost") {
        return fail(400, "INVALID_OUTCOME", "Indica si el ciclo se cerró como ganado o perdido.");
      }
      const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, MAX_REASON) : "";
      if (!reason) {
        return fail(400, "MISSING_REASON", "Cerrar el ciclo requiere un motivo.");
      }
      stage = outcome === "won" ? "CLOSED_WON" : "CLOSED_LOST";
      patch.followUpStage = stage;
      patch.followUpClosedAt = now;
      patch.followUpCloseReason = reason;
      patch.followUpCloseNote =
        typeof body.note === "string" && body.note.trim()
          ? body.note.trim().slice(0, MAX_NOTE)
          : null;
      patch.followUpReminderAt = null;
    } else if (action === "REOPEN") {
      stage = "SENT";
      patch.followUpStage = stage;
      patch.followUpRespondedAt = null;
      patch.followUpReminderAt = null;
      patch.followUpReminderSentAt = null;
      patch.followUpClosedAt = null;
      patch.followUpCloseReason = null;
      patch.followUpCloseNote = null;
    } else {
      return fail(400, "INVALID_ACTION", "Acción no reconocida.");
    }

    const [updated] = await db
      .update(meetings)
      .set(patch)
      .where(eq(meetings.id, meeting.id))
      .returning({
        followUpStage: meetings.followUpStage,
        followUpRespondedAt: meetings.followUpRespondedAt,
        followUpReminderAt: meetings.followUpReminderAt,
        followUpClosedAt: meetings.followUpClosedAt,
        followUpCloseReason: meetings.followUpCloseReason,
        followUpCloseNote: meetings.followUpCloseNote,
      });

    return NextResponse.json({ ok: true, stage, meeting: updated });
  } catch (error) {
    console.error("[FollowUpState] error:", error);
    return fail(500, "INTERNAL", "No se pudo actualizar el seguimiento.");
  }
}

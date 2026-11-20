import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { meetings, meetingActionItems, meetingParticipants } from "@saasfly/db-core";
import { eq, and } from "@saasfly/db-core";

export async function GET(req: Request, { params }: { params: Promise<{ meetingId: string }> }) {
  try {
    const authCtx = await getNexusAuthContext();
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId || !authCtx.canonicalOrgId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { meetingId } = await params;
    const canonicalOrgId = authCtx.canonicalOrgId as string;

    const meetRow = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, meetingId),
        eq(meetings.canonicalOrgId, canonicalOrgId)
      )
    });

    if (!meetRow) {
      return NextResponse.json({ error: "Reunión no encontrada." }, { status: 404 });
    }

    const participants = await db
      .select({
        email: meetingParticipants.email,
        identityId: meetingParticipants.identityId,
        sentAt: meetingParticipants.summarySentAt,
        followUpStatus: meetingParticipants.followUpStatus,
      })
      .from(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meetingId));

    const items = await db.query.meetingActionItems.findMany({
      where: eq(meetingActionItems.meetingId, meetingId),
      orderBy: (table, { asc }) => [asc(table.createdAt)]
    });

    return NextResponse.json({
      success: true,
      summary: meetRow.aiSummary,
      notes: meetRow.presenterNotes ?? "",
      actionItems: items,
      // Estado del seguimiento: quién ya lo recibió y quién falta.
      participants: participants.filter((p) => {
        const identity = (p.identityId ?? p.email ?? "").trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity);
      }),
      // Metadatos de la sesión para la agenda (duración real, estado y deck).
      meeting: {
        id: meetRow.id,
        status: meetRow.status,
        startsAt: meetRow.startsAt,
        endsAt: meetRow.endsAt,
        startedAt: meetRow.startedAt,
        endedAt: meetRow.endedAt,
        presentationId: meetRow.presentationId,
        dealRoomId: meetRow.dealRoomId,
        followUpEnabled: meetRow.followUpEnabled,
        followUpStage: meetRow.followUpStage,
        followUpRespondedAt: meetRow.followUpRespondedAt,
        followUpReminderAt: meetRow.followUpReminderAt,
        followUpReminderSentAt: meetRow.followUpReminderSentAt,
        followUpClosedAt: meetRow.followUpClosedAt,
        followUpCloseReason: meetRow.followUpCloseReason,
        followUpCloseNote: meetRow.followUpCloseNote
      }
    });
  } catch (error: any) {
    console.error("Meeting fetch error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

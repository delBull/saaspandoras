import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { meetings, meetingActionItems } from "@saasfly/db-core";
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

    const items = await db.query.meetingActionItems.findMany({
      where: eq(meetingActionItems.meetingId, meetingId),
      orderBy: (table, { asc }) => [asc(table.createdAt)]
    });

    return NextResponse.json({
      success: true,
      summary: meetRow.aiSummary,
      actionItems: items
    });
  } catch (error: any) {
    console.error("Meeting fetch error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

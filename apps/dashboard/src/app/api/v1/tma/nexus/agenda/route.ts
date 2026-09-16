import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, or, and, gte, desc, inArray } from 'drizzle-orm';
import {
  meetings,
  meetingParticipants,
  schedulingBookings,
  users
} from '@/db/schema';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

export async function GET(req: Request) {
  try {
    const authCtx = await getNexusAuthContext(new Headers(req.headers));

    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canonicalOrgId, collaboratorId } = authCtx;
    const orgId = canonicalOrgId ?? 'pandoras';

    // 1. Fetch meetings where the collaborator is either the host OR a participant
    // Since we are optimizing for "Upcoming", we want meetings that end in the future or are active.
    
    // Find meetings where user is participant
    const participantRows = await db
      .select({ meetingId: meetingParticipants.meetingId })
      .from(meetingParticipants)
      .where(eq(meetingParticipants.identityId, collaboratorId.toString()));

    const participantMeetingIds = participantRows.map((r) => r.meetingId);

    let whereClause;
    if (participantMeetingIds.length > 0) {
      whereClause = and(
        eq(meetings.canonicalOrgId, orgId),
        inArray(meetings.status, ['scheduled', 'live']),
        or(
          eq(meetings.hostCollaboratorId, collaboratorId.toString()),
          inArray(meetings.id, participantMeetingIds)
        )
      );
    } else {
      whereClause = and(
        eq(meetings.canonicalOrgId, orgId),
        inArray(meetings.status, ['scheduled', 'live']),
        eq(meetings.hostCollaboratorId, collaboratorId.toString())
      );
    }

    // Build the query
    const agendaRows = await db
      .select({
        meeting: meetings,
        booking: schedulingBookings,
        host: users
      })
      .from(meetings)
      .leftJoin(schedulingBookings, eq(meetings.appointmentId, schedulingBookings.id))
      .leftJoin(users, eq(meetings.hostCollaboratorId, users.id))
      .where(whereClause)
      .orderBy(meetings.startsAt);

    const now = new Date();

    const formattedMeetings = agendaRows.map((row) => {
      const isHost = row.meeting.hostCollaboratorId === collaboratorId.toString();
      const startsAt = row.meeting.startsAt ? new Date(row.meeting.startsAt) : now;
      const endsAt = row.meeting.endsAt ? new Date(row.meeting.endsAt) : new Date(startsAt.getTime() + 30 * 60000);
      
      const minutesUntilStart = (startsAt.getTime() - now.getTime()) / 60000;
      
      // Server-side policy:
      // Can join if it's active, or if it's scheduled and starts in less than 15 minutes.
      const canJoin = row.meeting.status === 'live' || 
                      (row.meeting.status === 'scheduled' && minutesUntilStart <= 15 && minutesUntilStart > -60);
                      
      // Only host or authorized collaborator can cancel
      const canCancel = isHost && row.meeting.status === 'scheduled';
      
      // Title derivation (Fallback to "Sovereign Meet" if not tied to a booking)
      const title = row.booking ? `Reunión con ${row.booking.leadName}` : 'Sovereign Meet';

      return {
        id: row.meeting.id, // Opaque reference
        title,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: row.meeting.status,
        hostName: row.host?.name ?? 'Administrador',
        actions: {
          canJoin,
          canStart: isHost && canJoin,
          canCancel,
        },
        joinUrl: canJoin ? `https://dash.pandoras.finance/meet/${row.meeting.id}` : null
      };
    });

    return NextResponse.json({
      agenda: formattedMeetings,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[NexusTMA_Agenda] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { meetings } from '@/db/schema';
import { NexusAuthContext } from '@/lib/nexus/nexus-rbac';

export class MeetingPolicy {
  static canCancel(meeting: any, authCtx: NexusAuthContext): boolean {
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return false;
    }
    const orgId = authCtx.canonicalOrgId ?? 'pandoras';
    if (meeting.canonicalOrgId !== orgId) {
      return false;
    }
    
    // Server-side Authorization: Only the host can cancel for now
    if (meeting.hostCollaboratorId !== authCtx.collaboratorId.toString()) {
      return false;
    }

    if (meeting.status !== 'scheduled') {
      return false;
    }

    return true;
  }
}

export class CancelMeetingHandler {
  static async execute(meetingId: string, authCtx: NexusAuthContext): Promise<{ success: boolean; error?: string }> {
    const orgId = authCtx.canonicalOrgId ?? 'pandoras';

    const meetingRow = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, meetingId), eq(meetings.canonicalOrgId, orgId)))
      .then((res) => res[0]);

    if (!meetingRow) {
      return { success: false, error: 'Meeting not found' };
    }

    if (!MeetingPolicy.canCancel(meetingRow, authCtx)) {
      return { success: false, error: 'Forbidden or invalid meeting state' };
    }

    // Cancel the meeting
    await db
      .update(meetings)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(meetings.id, meetingId));

    return { success: true };
  }
}

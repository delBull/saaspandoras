import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { meetings, nexusAuditEvents } from '@/db/schema';
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
    if (meeting.hostCollaboratorId !== authCtx.collaboratorId) {
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
    await db.transaction(async (tx) => {
      await tx
        .update(meetings)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date(),
          endedAt: new Date()
        })
        .where(eq(meetings.id, meetingId));

      await tx.insert(nexusAuditEvents).values({
        canonicalOrgId: orgId,
        actorIdentityId: authCtx.collaboratorId!,
        eventType: 'MEETING_CANCELLED',
        resourceType: 'meeting',
        resourceId: meetingId,
        action: 'UPDATE',
        newState: { status: 'cancelled' },
        result: 'SUCCESS',
      });
    });

    return { success: true };
  }
}

export class EndMeetingHandler {
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

    if (meetingRow.hostCollaboratorId !== authCtx.collaboratorId) {
      return { success: false, error: 'Forbidden: Only the host can end the meeting' };
    }

    if (meetingRow.status === 'ended' || meetingRow.status === 'cancelled') {
      return { success: true }; // Idempotent
    }

    await db.transaction(async (tx) => {
      await tx
        .update(meetings)
        .set({ 
          status: 'ended',
          updatedAt: new Date(),
          endedAt: new Date()
        })
        .where(eq(meetings.id, meetingId));

      await tx.insert(nexusAuditEvents).values({
        canonicalOrgId: orgId,
        actorIdentityId: authCtx.collaboratorId!,
        eventType: 'MEETING_ENDED',
        resourceType: 'meeting',
        resourceId: meetingId,
        action: 'UPDATE',
        newState: { status: 'ended' },
        result: 'SUCCESS',
      });
    });

    return { success: true };
  }
}

export class LaunchImmediateMeetingHandler {
  static async execute(authCtx: NexusAuthContext): Promise<{ success: boolean; meetingId?: string; error?: string }> {
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return { success: false, error: 'Unauthorized' };
    }
    if (!authCtx.permissions['calendar.manage']) {
      return { success: false, error: 'Forbidden: Missing calendar.manage capability' };
    }
    
    const orgId = authCtx.canonicalOrgId ?? 'pandoras';
    const now = new Date();
    const newMeetingId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(meetings).values({
        id: newMeetingId,
        canonicalOrgId: orgId,
        hostCollaboratorId: authCtx.collaboratorId,
        status: 'live',
        startsAt: now,
        startedAt: now,
      });

      await tx.insert(nexusAuditEvents).values({
        canonicalOrgId: orgId,
        actorIdentityId: authCtx.collaboratorId!,
        eventType: 'MEETING_STARTED',
        resourceType: 'meeting',
        resourceId: newMeetingId,
        action: 'CREATE',
        newState: { status: 'live' },
        result: 'SUCCESS',
      });
    });

    return { success: true, meetingId: newMeetingId };
  }
}


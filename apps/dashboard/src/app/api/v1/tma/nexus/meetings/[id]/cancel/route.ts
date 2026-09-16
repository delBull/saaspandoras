import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { meetings } from '@/db/schema';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authCtx = await getNexusAuthContext(new Headers(req.headers));

    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canonicalOrgId, collaboratorId } = authCtx;
    const orgId = canonicalOrgId ?? 'pandoras';

    // Verify the meeting exists and belongs to the org
    const meetingRow = await db
      .select()
      .from(meetings)
      .where(and(eq(meetings.id, id), eq(meetings.canonicalOrgId, orgId)))
      .then((res) => res[0]);

    if (!meetingRow) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Server-side Authorization: Only the host can cancel for now
    if (meetingRow.hostCollaboratorId !== collaboratorId.toString()) {
      return NextResponse.json({ error: 'Forbidden: Only host can cancel' }, { status: 403 });
    }

    if (meetingRow.status !== 'scheduled') {
      return NextResponse.json({ error: 'Only scheduled meetings can be cancelled' }, { status: 400 });
    }

    // Cancel the meeting
    await db
      .update(meetings)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(meetings.id, id));

    return NextResponse.json({ success: true, message: 'Meeting cancelled' });
  } catch (error: any) {
    console.error('[NexusTMA_MeetingCancel] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

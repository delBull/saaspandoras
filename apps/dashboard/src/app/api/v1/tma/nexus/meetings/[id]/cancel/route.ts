import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { CancelMeetingHandler } from '@/lib/nexus/meeting-domain';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authCtx = await getNexusAuthContext(new Headers(req.headers));

    const result = await CancelMeetingHandler.execute(id, authCtx);

    if (!result.success) {
      if (result.error === 'Unauthorized') return NextResponse.json({ error: result.error }, { status: 401 });
      if (result.error === 'Meeting not found') return NextResponse.json({ error: result.error }, { status: 404 });
      if (result.error === 'Forbidden or invalid meeting state') return NextResponse.json({ error: result.error }, { status: 403 });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Meeting cancelled' });
  } catch (error: any) {
    console.error('[NexusTMA_MeetingCancel] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

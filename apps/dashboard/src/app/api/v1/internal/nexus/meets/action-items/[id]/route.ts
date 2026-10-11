import { NextRequest, NextResponse } from 'next/server';
import { db, eq, and } from '@saasfly/db-core';
import { meetingActionItems } from '@saasfly/db-core/schema';
import { getNexusAuthContext } from '@saasfly/shared';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authCtx = await getNexusAuthContext();
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId || !authCtx.canonicalOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalOrgId = authCtx.canonicalOrgId as string;
    const { id } = await context.params;
    const body = await req.json();

    if (!body.status || !['pending', 'in_progress', 'completed', 'cancelled'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await db
      .update(meetingActionItems)
      .set({ 
        status: body.status,
        updatedAt: new Date()
      })
      .where(and(
        eq(meetingActionItems.id, id),
        eq(meetingActionItems.canonicalOrgId, canonicalOrgId)
      ))
      .returning({ id: meetingActionItems.id });

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Action item update failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); // Obfuscate error message
  }
}

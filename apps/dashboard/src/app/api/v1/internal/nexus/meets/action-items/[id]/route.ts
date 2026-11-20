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

    type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
    const patch: {
      status?: ActionStatus;
      task?: string;
      assigneeName?: string | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (body.status !== undefined) {
      if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      patch.status = body.status as ActionStatus;
    }

    if (body.task !== undefined) {
      const task = typeof body.task === 'string' ? body.task.trim() : '';
      if (!task) return NextResponse.json({ error: 'Task cannot be empty' }, { status: 400 });
      patch.task = task.slice(0, 500);
    }

    if (body.assigneeName !== undefined) {
      const assignee = typeof body.assigneeName === 'string' ? body.assigneeName.trim() : '';
      patch.assigneeName = assignee ? assignee.slice(0, 200) : null;
    }

    if (Object.keys(patch).length === 1) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await db
      .update(meetingActionItems)
      .set(patch)
      .where(and(
        eq(meetingActionItems.id, id),
        eq(meetingActionItems.canonicalOrgId, canonicalOrgId)
      ))
      .returning({
        id: meetingActionItems.id,
        task: meetingActionItems.task,
        assigneeName: meetingActionItems.assigneeName,
        status: meetingActionItems.status,
      });

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated[0] });
  } catch (error) {
    console.error('Action item update failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 }); // Obfuscate error message
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const authCtx = await getNexusAuthContext();
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId || !authCtx.canonicalOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canonicalOrgId = authCtx.canonicalOrgId as string;
    const { id } = await context.params;

    const removed = await db
      .delete(meetingActionItems)
      .where(and(
        eq(meetingActionItems.id, id),
        eq(meetingActionItems.canonicalOrgId, canonicalOrgId)
      ))
      .returning({ id: meetingActionItems.id });

    if (removed.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Action item delete failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { nexusTasks, auditLogs } from '@/db/schema';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

/**
 * PATCH /api/v1/tma/nexus/tasks/[id]
 * 
 * Transitions a task's state.
 * Actions: CLAIM, COMPLETE, CANCEL
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authCtx = await getNexusAuthContext(new Headers(req.headers));

    if (!authCtx.isAuthenticated || !authCtx.collaboratorId || !authCtx.canonicalOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body; // 'CLAIM' | 'COMPLETE' | 'CANCEL'

    if (!['CLAIM', 'COMPLETE', 'CANCEL'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Fetch task
    const [task] = await db
      .select()
      .from(nexusTasks)
      .where(
        and(
          eq(nexusTasks.id, id),
          eq(nexusTasks.canonicalOrgId, authCtx.canonicalOrgId)
        )
      )
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const now = new Date();
    const updatePayload: any = { updatedAt: now };

    if (action === 'CLAIM') {
      if (task.status !== 'OPEN') {
        return NextResponse.json({ error: 'Task is not OPEN' }, { status: 400 });
      }
      if (task.assigneeCollaboratorId && task.assigneeCollaboratorId !== authCtx.collaboratorId) {
        return NextResponse.json({ error: 'Task is already assigned to someone else', code: 'ALREADY_ASSIGNED' }, { status: 409 });
      }
      updatePayload.status = 'IN_PROGRESS';
      updatePayload.assigneeCollaboratorId = authCtx.collaboratorId;
      updatePayload.claimedAt = now;
    } else if (action === 'COMPLETE') {
      if (task.status !== 'IN_PROGRESS' && task.status !== 'OPEN') {
        return NextResponse.json({ error: 'Task cannot be completed from current state' }, { status: 400 });
      }
      if (task.assigneeCollaboratorId !== authCtx.collaboratorId) {
        return NextResponse.json({ error: 'Not assigned to this task' }, { status: 403 });
      }
      updatePayload.status = 'DONE';
      updatePayload.completedAt = now;
    } else if (action === 'CANCEL') {
      if (task.status === 'DONE' || task.status === 'CANCELLED') {
        return NextResponse.json({ error: 'Task is already finished' }, { status: 400 });
      }
      // Must be assignee or admin
      if (task.assigneeCollaboratorId !== authCtx.collaboratorId && authCtx.role !== 'SUPER_ADMIN' && authCtx.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized to cancel this task' }, { status: 403 });
      }
      updatePayload.status = 'CANCELLED';
      updatePayload.cancelledAt = now;
    }

    // Update task
    const [updatedTask] = await db
      .update(nexusTasks)
      .set(updatePayload)
      .where(eq(nexusTasks.id, id))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Audit log
    await db.insert(auditLogs).values({
      event: `TASK_${action}`,
      category: 'nexus_tma',
      ip: 'system',
      success: true,
      metadata: { 
        source: 'nexus_tma', 
        actorId: String(authCtx.collaboratorId), 
        targetResource: `task:${id}`,
        previousStatus: task.status, 
        newStatus: updatedTask.status 
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error(`[NexusTasks PATCH] Error:`, error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

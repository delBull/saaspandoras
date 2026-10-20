import { NextResponse } from 'next/server';
import { db, eq, and, nexusTasks, auditLogs } from "@saasfly/db-core";
import { authenticateAgent, toNexusStatus, formatSofiaTask } from '../route';
import type { SofiaTaskPayload } from '../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TaskUpdateFields {
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  priority?: string;
  status?: string;
  completedAt?: Date;
  claimedAt?: Date;
  assigneeCollaboratorId?: number;
  updatedAt: Date;
}

/**
 * 3. PATCH /api/v1/agent/tasks/:id
 * Body: { status, priority, title, nextAction, dueDate }
 * Returns: Updated task in Sofia schema
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateAgent(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = (await req.json()) as SofiaTaskPayload;
    const { status, priority, title, nextAction, dueDate } = body;

    // Fetch existing task
    const [task] = await db
      .select()
      .from(nexusTasks)
      .where(and(eq(nexusTasks.id, id), eq(nexusTasks.canonicalOrgId, auth.canonicalOrgId)))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const now = new Date();
    const updatePayload: TaskUpdateFields = { updatedAt: now };

    if (title !== undefined) updatePayload.title = title;
    if (nextAction !== undefined) updatePayload.description = nextAction;
    if (dueDate !== undefined) updatePayload.dueDate = dueDate ? new Date(dueDate) : null;
    if (priority !== undefined) {
      const p = priority.toUpperCase();
      updatePayload.priority = ['P1', 'HIGH', 'URGENT'].includes(p)
        ? 'HIGH'
        : (['P2', 'MEDIUM'].includes(p) ? 'MEDIUM' : 'NORMAL');
    }

    if (status !== undefined) {
      const internalStatus = toNexusStatus(status);
      updatePayload.status = internalStatus;
      if (internalStatus === 'DONE') {
        updatePayload.completedAt = now;
      } else if (internalStatus === 'IN_PROGRESS') {
        updatePayload.claimedAt = now;
        updatePayload.assigneeCollaboratorId = auth.collaboratorId;
      }
    }

    const [updated] = await db
      .update(nexusTasks)
      .set(updatePayload)
      .where(eq(nexusTasks.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Log in auditLogs
    await db.insert(auditLogs).values({
      event: 'TASK_AGENT_PATCH',
      category: 'nexus_agent',
      ip: 'agent_service',
      success: true,
      metadata: {
        actorId: 'sofia-agent',
        taskId: id,
        previousStatus: task.status,
        newStatus: updated.status,
        changes: body as Record<string, unknown>,
      },
    });

    return NextResponse.json(formatSofiaTask(updated as unknown as Parameters<typeof formatSofiaTask>[0]));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[AgentTasks PATCH] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

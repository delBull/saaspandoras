import { NextResponse } from "next/server";
import { getNexusAuthContext } from '@saasfly/shared';
import { getTasks } from "@/lib/nexus/operations-repo";
import { db } from '@saasfly/db';
import { nexusTasks, nexusCollaborators } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TaskRequestBody {
  kind?: string;
  taskId?: string;
  id?: string;
  task?: string;
  title?: string;
  details?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeCollaboratorId?: number | string;
  action?: 'COMPLETE' | 'CLAIM' | 'CANCEL';
}

export async function GET(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orgId = auth.canonicalOrgId ?? 'pandoras';
    
    const url = new URL(request.url);
    const assigneeParam = url.searchParams.get('assigneeCollaboratorId');
    const assigneeId = assigneeParam ? parseInt(assigneeParam, 10) : undefined;

    const tasks = await getTasks(orgId, typeof assigneeId === 'number' && !isNaN(assigneeId) ? assigneeId : undefined);
    return NextResponse.json({ tasks });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Tasks] GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = auth.canonicalOrgId ?? 'pandoras';
    const body = (await request.json().catch(() => ({}))) as TaskRequestBody;

    // 1. Task Completion Dispatch (kind === 'task-done')
    if (body.kind === 'task-done') {
      const taskId = body.taskId ?? body.id;
      if (!taskId) {
        return NextResponse.json({ error: "taskId is required" }, { status: 400 });
      }

      const now = new Date();
      try {
        await db
          .update(nexusTasks)
          .set({
            status: 'DONE',
            completedAt: now,
            updatedAt: now,
          })
          .where(and(eq(nexusTasks.id, taskId), eq(nexusTasks.canonicalOrgId, orgId)));
      } catch (dbErr) {
        console.warn('[Tasks] Updating task by ID warning:', dbErr);
      }

      return NextResponse.json({ success: true, taskId, status: 'DONE' });
    }

    // 2. Task Creation Dispatch
    const title = body.task ?? body.title;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const description = body.details ?? body.description ?? null;
    const priority = (body.priority ?? 'NORMAL').toUpperCase();
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    // Resolve or fallback creator collaborator id
    let creatorId = auth.collaboratorId;
    if (!creatorId) {
      const [firstCollab] = await db
        .select({ id: nexusCollaborators.id })
        .from(nexusCollaborators)
        .where(eq(nexusCollaborators.canonicalOrgId, orgId))
        .limit(1);
      creatorId = firstCollab?.id;
    }

    if (!creatorId) {
      return NextResponse.json({ error: "No collaborator identity found to create task" }, { status: 400 });
    }

    const assigneeCollaboratorId = body.assigneeCollaboratorId ? Number(body.assigneeCollaboratorId) : null;

    const [created] = await db
      .insert(nexusTasks)
      .values({
        canonicalOrgId: orgId,
        title: title.trim(),
        description,
        priority: ['URGENT', 'HIGH', 'NORMAL', 'LOW'].includes(priority) ? priority : 'NORMAL',
        visibility: 'TEAM_VISIBLE',
        status: 'OPEN',
        createdBy: creatorId,
        assigneeCollaboratorId: assigneeCollaboratorId && !isNaN(assigneeCollaboratorId) ? assigneeCollaboratorId : null,
        dueDate,
      })
      .returning();

    return NextResponse.json({ success: true, task: created }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Tasks] POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = auth.canonicalOrgId ?? 'pandoras';
    const body = (await request.json().catch(() => ({}))) as TaskRequestBody;
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Task id and action are required" }, { status: 400 });
    }

    const now = new Date();
    const updatePayload: {
      updatedAt: Date;
      status?: string;
      completedAt?: Date;
      claimedAt?: Date;
      cancelledAt?: Date;
      assigneeCollaboratorId?: number;
    } = { updatedAt: now };

    if (action === 'COMPLETE') {
      updatePayload.status = 'DONE';
      updatePayload.completedAt = now;
    } else if (action === 'CLAIM') {
      updatePayload.status = 'IN_PROGRESS';
      updatePayload.claimedAt = now;
      if (auth.collaboratorId) updatePayload.assigneeCollaboratorId = auth.collaboratorId;
    } else if (action === 'CANCEL') {
      updatePayload.status = 'CANCELLED';
      updatePayload.cancelledAt = now;
    } else {
      const unsupportedAction = String(action);
      return NextResponse.json({ error: `Unsupported action: ${unsupportedAction}` }, { status: 400 });
    }

    const [updated] = await db
      .update(nexusTasks)
      .set(updatePayload)
      .where(and(eq(nexusTasks.id, id), eq(nexusTasks.canonicalOrgId, orgId)))
      .returning();

    return NextResponse.json({ success: true, task: updated });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Tasks] PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

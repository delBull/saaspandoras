import { NextResponse } from "next/server";
import { getNexusAuthContext } from '@saasfly/shared';
import { getTasks } from "@/lib/nexus/operations-repo";
import { db } from '@saasfly/db';
import { nexusTasks, nexusCollaborators } from '@saasfly/db/schema';
import { eq, and } from "@saasfly/db-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated || !auth.permissions.dealRoom) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const orgId = auth.canonicalOrgId || 'pandoras';
    const tasks = await getTasks(orgId);
    return NextResponse.json({ tasks });
  } catch (err: any) {
    console.error("[Tasks] GET Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated || !auth.permissions.dealRoom) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const orgId = auth.canonicalOrgId || 'pandoras';
    const body = await request.json();

    // 1. Task Completion Dispatch (kind === 'task-done')
    if (body.kind === 'task-done') {
      const taskId = body.taskId || body.id;
      if (!taskId) {
        return NextResponse.json({ error: "taskId is required" }, { status: 400 });
      }

      // If taskId is UUID or matching task in DB, update status
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
        // If taskId was synthetic TSK-xxx from legacy frontend, still acknowledge gracefully
        console.warn('[Tasks] Updating task by ID warning:', dbErr);
      }

      return NextResponse.json({ success: true, taskId, status: 'DONE' });
    }

    // 2. Task Creation Dispatch
    const title = body.task || body.title;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const description = body.details || body.description || null;
    const priority = (body.priority || 'NORMAL').toUpperCase();
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
        dueDate,
      })
      .returning();

    return NextResponse.json({ success: true, task: created }, { status: 201 });
  } catch (err: any) {
    console.error("[Tasks] POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getNexusAuthContext(request.headers);
    if (!auth.isAuthenticated || !auth.permissions.dealRoom) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const orgId = auth.canonicalOrgId || 'pandoras';
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Task id and action are required" }, { status: 400 });
    }

    const now = new Date();
    const updatePayload: any = { updatedAt: now };

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
      return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

    const [updated] = await db
      .update(nexusTasks)
      .set(updatePayload)
      .where(and(eq(nexusTasks.id, id), eq(nexusTasks.canonicalOrgId, orgId)))
      .returning();

    return NextResponse.json({ success: true, task: updated });
  } catch (err: any) {
    console.error("[Tasks] PATCH Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, and, or, isNull, desc } from 'drizzle-orm';
import { nexusTasks, nexusCollaborators } from '@/db/schema';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

/**
 * GET /api/v1/tma/nexus/tasks
 * 
 * Returns tasks visible to the authenticated actor:
 * 1. ASSIGNED_TO_ME
 * 2. UNASSIGNED_TEAM (visibility = 'TEAM_VISIBLE' and unassigned and status = 'OPEN')
 */
export async function GET(req: Request) {
  try {
    const authCtx = await getNexusAuthContext(new Headers(req.headers));

    if (!authCtx.isAuthenticated || !authCtx.collaboratorId || !authCtx.canonicalOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canonicalOrgId, collaboratorId } = authCtx;

    // We select ASSIGNED_TO_ME or (UNASSIGNED and TEAM_VISIBLE and OPEN)
    const tasksQuery = await db
      .select({
        task: nexusTasks,
        assignee: nexusCollaborators,
      })
      .from(nexusTasks)
      .leftJoin(nexusCollaborators, eq(nexusTasks.assigneeCollaboratorId, nexusCollaborators.id))
      .where(
        and(
          eq(nexusTasks.canonicalOrgId, canonicalOrgId),
          or(
            eq(nexusTasks.assigneeCollaboratorId, collaboratorId),
            and(
              isNull(nexusTasks.assigneeCollaboratorId),
              eq(nexusTasks.visibility, 'TEAM_VISIBLE'),
              eq(nexusTasks.status, 'OPEN')
            )
          )
        )
      )
      .orderBy(desc(nexusTasks.priority), desc(nexusTasks.createdAt));

    const tasks = tasksQuery.map((row) => ({
      ...row.task,
      assigneeName: row.assignee?.name || null,
    }));

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('[NexusTasks GET] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/tma/nexus/tasks
 * 
 * Creates a new task.
 */
export async function POST(req: Request) {
  try {
    const authCtx = await getNexusAuthContext(new Headers(req.headers));

    if (!authCtx.isAuthenticated || !authCtx.collaboratorId || !authCtx.canonicalOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, priority, visibility, assigneeCollaboratorId, dueDate } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const [newTask] = await db.insert(nexusTasks).values({
      canonicalOrgId: authCtx.canonicalOrgId,
      title,
      description: description || null,
      priority: priority || 'NORMAL',
      visibility: visibility || 'TEAM_VISIBLE',
      assigneeCollaboratorId: assigneeCollaboratorId || null,
      createdBy: authCtx.collaboratorId,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'OPEN',
    }).returning();

    return NextResponse.json({ task: newTask });
  } catch (error: any) {
    console.error('[NexusTasks POST] Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { eq, and, desc, gte } from "@saasfly/db-core";
import { nexusTasks, nexusCollaborators } from '@saasfly/db/schema';
import { IntegrationKeyService } from '@/lib/integrations/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface SofiaTaskPayload {
  title?: string;
  priority?: string;
  status?: string;
  assignee?: string;
  nextAction?: string;
  dueDate?: string;
  sourceRef?: string;
}

export interface FormattedSofiaTask {
  id: string;
  title: string;
  project: string;
  priority: string;
  status: 'pending' | 'doing' | 'blocked' | 'waiting' | 'done';
  assignee: string;
  nextAction: string | null;
  blocker: null;
  dueDate: string | null;
  sourceRef: string;
  updatedAt: string;
}

interface NexusTaskRow {
  id: string;
  canonicalOrgId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  visibility: string;
  assigneeCollaboratorId: number | null;
  createdBy: number;
  dueDate: Date | null;
  claimedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  sourceRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validate Agent Service Token from Authorization header:
 * Authorization: Bearer sk_live_...
 * Enforces tenant scope = 'pandoras'
 */
export async function authenticateAgent(req: Request) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { error: 'Missing Bearer service token', status: 401 };
  }

  const client = await IntegrationKeyService.validateKey(token);
  if (!client || !client.isActive || client.revokedAt) {
    return { error: 'Invalid or revoked service token', status: 401 };
  }

  // Enforce project/tenant scope for pandoras
  const canonicalOrgId = 'pandoras';

  // Find or fallback Sofia collaborator ID
  const [sofiaCollab] = await db
    .select({ id: nexusCollaborators.id })
    .from(nexusCollaborators)
    .where(eq(nexusCollaborators.canonicalOrgId, canonicalOrgId))
    .limit(1);

  return {
    client,
    canonicalOrgId,
    collaboratorId: sofiaCollab?.id ?? 140, // fallback to Marco if needed
  };
}

// Map Nexus internal status to Sofia specification status
export function toSofiaStatus(internalStatus: string): 'pending' | 'doing' | 'blocked' | 'waiting' | 'done' {
  switch (internalStatus) {
    case 'IN_PROGRESS':
      return 'doing';
    case 'DONE':
      return 'done';
    case 'BLOCKED':
      return 'blocked';
    case 'WAITING':
      return 'waiting';
    case 'OPEN':
    default:
      return 'pending';
  }
}

// Map Sofia status back to Nexus internal status
export function toNexusStatus(sofiaStatus?: string): string {
  switch (sofiaStatus) {
    case 'doing':
      return 'IN_PROGRESS';
    case 'done':
      return 'DONE';
    case 'blocked':
      return 'BLOCKED';
    case 'waiting':
      return 'WAITING';
    case 'pending':
    default:
      return 'OPEN';
  }
}

// Format Task to Sofia Specification format
export function formatSofiaTask(task: NexusTaskRow, assigneeName?: string | null): FormattedSofiaTask {
  return {
    id: task.id,
    title: task.title,
    project: task.canonicalOrgId,
    priority: task.priority ?? 'NORMAL',
    status: toSofiaStatus(task.status),
    assignee: assigneeName ?? 'sofia-agent',
    nextAction: task.description ?? null,
    blocker: null,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] ?? null : null,
    sourceRef: task.sourceRef ?? `nexus:${task.id}`,
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * 1. GET /api/v1/agent/tasks
 * Query params: ?status=&project=&updated_since=
 * Returns: { tasks: [...], cursor: null }
 */
export async function GET(req: Request) {
  try {
    const auth = await authenticateAgent(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const updatedSinceParam = searchParams.get('updated_since');

    const conditions = [eq(nexusTasks.canonicalOrgId, auth.canonicalOrgId)];

    if (statusParam) {
      conditions.push(eq(nexusTasks.status, toNexusStatus(statusParam)));
    }

    if (updatedSinceParam) {
      const sinceDate = new Date(updatedSinceParam);
      if (!isNaN(sinceDate.getTime())) {
        conditions.push(gte(nexusTasks.updatedAt, sinceDate));
      }
    }

    const tasksQuery = await db
      .select({
        task: nexusTasks,
        assignee: nexusCollaborators,
      })
      .from(nexusTasks)
      .leftJoin(nexusCollaborators, eq(nexusTasks.assigneeCollaboratorId, nexusCollaborators.id))
      .where(and(...conditions))
      .orderBy(desc(nexusTasks.updatedAt));

    const tasks = tasksQuery.map((row) => formatSofiaTask(row.task as unknown as NexusTaskRow, row.assignee?.name));

    return NextResponse.json({
      tasks,
      cursor: null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[AgentTasks GET] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 2. POST /api/v1/agent/tasks
 * Body: { title, priority, status, assignee, nextAction, dueDate, sourceRef }
 * Returns: 201 Created with { id, ... }
 */
export async function POST(req: Request) {
  try {
    const auth = await authenticateAgent(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await req.json()) as SofiaTaskPayload;
    const { title, priority, status, nextAction, dueDate, sourceRef } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const now = new Date();
    const internalStatus = toNexusStatus(status);
    const parsedPriority = (priority ?? 'NORMAL').toUpperCase();

    // Check if task with sourceRef already exists to enforce idempotency
    if (sourceRef) {
      const [existing] = await db
        .select()
        .from(nexusTasks)
        .where(and(eq(nexusTasks.canonicalOrgId, auth.canonicalOrgId), eq(nexusTasks.sourceRef, sourceRef)))
        .limit(1);

      if (existing) {
        return NextResponse.json(formatSofiaTask(existing as unknown as NexusTaskRow), { status: 200 });
      }
    }

    const priorityValue = ['P1', 'HIGH', 'URGENT'].includes(parsedPriority)
      ? 'HIGH'
      : (['P2', 'MEDIUM'].includes(parsedPriority) ? 'MEDIUM' : 'NORMAL');

    const [created] = await db
      .insert(nexusTasks)
      .values({
        canonicalOrgId: auth.canonicalOrgId,
        title: title.trim(),
        description: nextAction ?? null,
        priority: priorityValue,
        visibility: 'TEAM_VISIBLE',
        status: internalStatus,
        createdBy: auth.collaboratorId,
        assigneeCollaboratorId: auth.collaboratorId,
        dueDate: dueDate ? new Date(dueDate) : null,
        sourceRef: sourceRef ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json(formatSofiaTask(created as unknown as NexusTaskRow), { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[AgentTasks POST] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

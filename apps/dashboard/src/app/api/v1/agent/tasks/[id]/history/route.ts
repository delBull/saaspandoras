import { NextResponse } from 'next/server';
import { db, eq, and, desc, nexusTasks, auditLogs, nexusTaskComments } from "@saasfly/db-core";
import type { NexusTaskComment } from "@saasfly/db-core";
import { authenticateAgent } from '../../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HistoryItem {
  ts: string;
  actor: string;
  change: string;
}

interface AuditLogMeta {
  actorId?: string;
  taskId?: string;
  previousStatus?: string;
  newStatus?: string;
}

/**
 * 5. GET /api/v1/agent/tasks/:id/history
 * Returns: [{ ts, actor, change }]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateAgent(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;

    // Verify task exists
    const [task] = await db
      .select()
      .from(nexusTasks)
      .where(and(eq(nexusTasks.id, id), eq(nexusTasks.canonicalOrgId, auth.canonicalOrgId)))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 1. Fetch audit logs related to this task
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.category, 'nexus_agent'))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);

    const historyItems: HistoryItem[] = [];

    // Add creation event
    historyItems.push({
      ts: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
      actor: 'system',
      change: `Task created with status ${task.status}`,
    });

    for (const log of logs) {
      const meta = log.metadata as AuditLogMeta | null;
      if (meta && meta.taskId === id) {
        historyItems.push({
          ts: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
          actor: meta.actorId ?? 'sofia-agent',
          change: meta.previousStatus && meta.newStatus 
            ? `Status changed from ${meta.previousStatus} to ${meta.newStatus}`
            : (log.event ?? 'Updated task'),
        });
      }
    }

    // 2. Fetch comments as history items
    const commentsQuery = await db
      .select()
      .from(nexusTaskComments)
      .where(eq(nexusTaskComments.taskId, id))
      .orderBy(desc(nexusTaskComments.createdAt));

    const comments = commentsQuery as unknown as NexusTaskComment[];

    for (const c of comments) {
      const text = c.comment ?? '';
      const commentSnippet = text.length > 50 ? `${text.substring(0, 47)}...` : text;
      historyItems.push({
        ts: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        actor: c.author,
        change: `Comment: "${commentSnippet}"`,
      });
    }

    // Sort by timestamp descending
    historyItems.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    return NextResponse.json(historyItems);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[AgentTasks History GET] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

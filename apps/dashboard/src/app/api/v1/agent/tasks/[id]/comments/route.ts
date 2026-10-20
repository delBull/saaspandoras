import { NextResponse } from 'next/server';
import { db, eq, and, nexusTasks, nexusTaskComments } from "@saasfly/db-core";
import type { NexusTaskComment } from "@saasfly/db-core";
import { authenticateAgent } from '../../route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CommentRequestBody {
  comment?: string;
  author?: string;
}

/**
 * 4. POST /api/v1/agent/tasks/:id/comments
 * Body: { comment, author }
 * Returns: { commentId, ... } 201 Created
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateAgent(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = (await req.json()) as CommentRequestBody;
    const { comment, author } = body;

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Verify task exists and belongs to pandoras
    const [task] = await db
      .select({ id: nexusTasks.id })
      .from(nexusTasks)
      .where(and(eq(nexusTasks.id, id), eq(nexusTasks.canonicalOrgId, auth.canonicalOrgId)))
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const insertResult = await db
      .insert(nexusTaskComments)
      .values({
        taskId: id,
        canonicalOrgId: auth.canonicalOrgId,
        author: author ?? 'sofia-agent',
        comment: comment.trim(),
        createdAt: new Date(),
      })
      .returning();

    const newComment = insertResult[0] as NexusTaskComment | undefined;

    if (!newComment) {
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json({
      commentId: newComment.id,
      id: newComment.id,
      taskId: id,
      author: newComment.author,
      comment: newComment.comment,
      createdAt: newComment.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[AgentTasks Comments POST] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

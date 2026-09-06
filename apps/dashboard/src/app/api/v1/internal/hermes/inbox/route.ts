import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hermesConversations, projects } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

export async function GET(req: NextRequest) {
  try {
    // We reuse the Nexus auth context to know if the user is a collaborator or admin
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN' && auth.role !== 'OPERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let conditions = undefined;
    if (status) {
      conditions = eq(hermesConversations.status, status);
    }
    
    // For now, SUPER_ADMIN and ADMIN can see all. COLLABORATORS can see all if they are internal, 
    // but in a future iteration we would filter by assignedCollaboratorId.
    // Since assignment is manual, we fetch conversations.

    const conversations = await db.select({
      id: hermesConversations.id,
      organizationId: hermesConversations.organizationId,
      conversationId: hermesConversations.conversationId,
      status: hermesConversations.status,
      escalationReason: hermesConversations.escalationReason,
      escalatedAt: hermesConversations.escalatedAt,
      assignedCollaboratorId: hermesConversations.assignedCollaboratorId,
      updatedAt: hermesConversations.updatedAt,
      projectTitle: projects.title,
    })
    .from(hermesConversations)
    .leftJoin(projects, eq(hermesConversations.organizationId, projects.slug))
    .where(conditions)
    .orderBy(desc(hermesConversations.updatedAt))
    .limit(50);

    return NextResponse.json({ ok: true, data: conversations });
  } catch (error: any) {
    console.error('[Inbox GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

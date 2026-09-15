import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { eq, and, like } from 'drizzle-orm';
import { nexusActionRequests } from '@/db/schema';

export async function GET(req: Request) {
  try {
    const authCtx = await getNexusAuthContext();
    
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authCtx.permissions['nexus.manage']) {
      return NextResponse.json({ error: 'Forbidden. Requires nexus.manage capability.' }, { status: 403 });
    }

    const pendingActions = await db.query.nexusActionRequests.findMany({
      where: and(
        eq(nexusActionRequests.actorIdentityId, authCtx.collaboratorId),
        eq(nexusActionRequests.status, 'PENDING'),
        like(nexusActionRequests.actionType, '%HERMES%')
      ),
      orderBy: (actions, { desc }) => [desc(actions.createdAt)],
      limit: 50
    });

    const now = new Date();
    const validPendingActions = pendingActions.filter(a => new Date(a.expiresAt) > now);

    // Map ActionRequests to HITL items for the frontend
    const items = validPendingActions.map(action => {
      // The payload contains the context of the escalation
      const payload = action.payload as any;
      return {
        id: action.actionToken,
        actionType: action.actionType,
        targetResource: action.targetResource, // Usually the sessionId
        userName: payload.userName || 'Prospecto (HITL)',
        lastMessage: payload.lastMessage || 'El usuario ha solicitado asistencia humana.',
        createdAt: action.createdAt
      };
    });

    return NextResponse.json({ items });
    
  } catch (error) {
    console.error('[NexusHermesHITLAPI] Error fetching HITL items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

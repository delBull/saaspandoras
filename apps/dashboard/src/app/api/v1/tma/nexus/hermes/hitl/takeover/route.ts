import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { nexusActionRequests } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const authCtx = await getNexusAuthContext();
    
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authCtx.permissions['nexus.manage']) {
      return NextResponse.json({ error: 'Forbidden. Requires nexus.manage capability.' }, { status: 403 });
    }

    const body = await req.json();
    const itemId = body.itemId;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    // 1. Verify the action request belongs to this user and is PENDING
    const [actionRequest] = await db.select().from(nexusActionRequests).where(
      and(
        eq(nexusActionRequests.actionToken, itemId),
        eq(nexusActionRequests.actorIdentityId, authCtx.collaboratorId),
        eq(nexusActionRequests.status, 'PENDING')
      )
    ).limit(1);

    if (!actionRequest) {
      return NextResponse.json({ error: 'Action request not found, expired, or already completed' }, { status: 404 });
    }

    // 2. Mark the action as COMPLETED with concurrency control (Optimistic Locking)
    const [updated] = await db.update(nexusActionRequests)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        result: 'TAKEN_OVER'
      })
      .where(
        and(
          eq(nexusActionRequests.id, actionRequest.id),
          eq(nexusActionRequests.status, 'PENDING') // Lock against race conditions
        )
      )
      .returning({ id: nexusActionRequests.id });

    if (!updated) {
      return NextResponse.json({ error: 'Conflict: This action was already resolved by another operator' }, { status: 409 });
    }

    // NOTE: In a fully wired production system, this would also trigger a 
    // message to the Discord webhook or internal chat to notify that the 
    // operator has taken control of the session, and would mutate the 
    // actual `whatsappSessions` table to `flowType = "human"`.
    // Since this is the TMA interface layer, resolving the action request
    // acts as the primary source of truth for the action being fulfilled.

    return NextResponse.json({ success: true, message: 'Takeover completed successfully' });
    
  } catch (error) {
    console.error('[NexusHermesHITLTakeoverAPI] Error completing takeover:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

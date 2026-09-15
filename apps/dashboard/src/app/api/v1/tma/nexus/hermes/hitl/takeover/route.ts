import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { nexusActionRequests, hermesConversations, hermesEscalations, auditLogs } from '@/db/schema';

export async function POST(req: Request) {
  try {
    const authCtx = await getNexusAuthContext(new Headers(req.headers));
    
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!authCtx.permissions['nexus.manage']) {
      return NextResponse.json({ error: 'Forbidden. Requires nexus.manage capability.' }, { status: 403 });
    }

    const body = await req.json();
    const itemId = body.itemId as string; // conversationId (chatId) or actionToken

    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      // 1. Find the conversation by conversationId
      const [conv] = await tx
        .select({ id: hermesConversations.id, version: hermesConversations.version })
        .from(hermesConversations)
        .where(eq(hermesConversations.conversationId, itemId))
        .limit(1);

      if (conv) {
        // 2. Optimistic lock: transition ACTIVE → PAUSED_HUMAN atomically
        const [updated] = await tx.update(hermesConversations)
          .set({
            status: 'PAUSED_HUMAN',
            escalationReason: 'MANUAL',
            assignedCollaboratorId: authCtx.collaboratorId,
            escalatedAt: new Date(),
            version: conv.version + 1,
          })
          .where(
            and(
              eq(hermesConversations.id, conv.id),
              eq(hermesConversations.version, conv.version) // Optimistic lock
            )
          )
          .returning({ id: hermesConversations.id });

        if (!updated) {
          throw new Error('CONFLICT: Conversation was modified concurrently. Please retry.');
        }
      }

      // 3. Transition any PENDING escalation to IN_PROGRESS
      await tx.update(hermesEscalations)
        .set({
          status: 'IN_PROGRESS',
          actorId: authCtx.collaboratorId!.toString(),
        })
        .where(
          and(
            eq(hermesEscalations.conversationId, itemId),
            eq(hermesEscalations.status, 'PENDING')
          )
        );

      // 4. Also resolve any pending HERMES_TAKEOVER action request for this conversation
      await tx.update(nexusActionRequests)
        .set({ status: 'COMPLETED', completedAt: new Date(), result: 'TAKEN_OVER_VIA_TMA' })
        .where(
          and(
            eq(nexusActionRequests.targetResource, itemId),
            eq(nexusActionRequests.actionType, 'HERMES_TAKEOVER'),
            eq(nexusActionRequests.status, 'PENDING')
          )
        );

      // 5. Audit
      await tx.insert(auditLogs).values({
        event: 'HERMES_TAKEOVER',
        category: 'nexus_tma',
        ip: 'tma',
        success: true,
        metadata: {
          source: 'nexus_tma_http',
          actorId: authCtx.collaboratorId!.toString(),
          targetResource: `chat:${itemId}`,
          canonicalOrgId: authCtx.canonicalOrgId,
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Hermes pausado. El bot ha cedido el control al operador.' 
    });
    
  } catch (error: any) {
    if (error.message?.startsWith('CONFLICT')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('[NexusHermesHITLTakeoverAPI] Error completing takeover:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

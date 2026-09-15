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

    // Require finance capability
    if (!authCtx.permissions['finance.manage']) {
      return NextResponse.json({ error: 'Forbidden. Requires finance capability.' }, { status: 403 });
    }

    // Fetch pending SPEI deposit action requests for this actor
    const pendingActions = await db.query.nexusActionRequests.findMany({
      where: and(
        eq(nexusActionRequests.actorIdentityId, authCtx.collaboratorId),
        eq(nexusActionRequests.status, 'PENDING'),
        like(nexusActionRequests.actionType, '%DEPOSIT%')
      ),
      orderBy: (actions, { desc }) => [desc(actions.createdAt)],
      limit: 50
    });

    const now = new Date();
    const validPendingActions = pendingActions.filter(a => new Date(a.expiresAt) > now);

    const items = validPendingActions.map(action => {
      const payload = action.payload as any;
      return {
        actionRequestId: action.id, // Needed for the execution validation
        actionToken: action.actionToken,
        actionType: action.actionType,
        targetResource: action.targetResource,
        amount: payload.amount || 0,
        currency: payload.currency || 'MXN',
        userName: payload.userName || 'Customer',
        reference: payload.reference || 'N/A',
        createdAt: action.createdAt
      };
    });

    return NextResponse.json({ items });
    
  } catch (error) {
    console.error('[NexusFinanceDepositsAPI] Error fetching deposits:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { nexusActionRequests } from '@/db/schema';



export async function GET(req: Request) {
  try {
    // 1. Authenticate Request via Nexus RBAC
    const authCtx = await getNexusAuthContext();
    
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch pending actions specific to this actor
    const pendingActionsQuery = await db.query.nexusActionRequests.findMany({
      where: and(
        eq(nexusActionRequests.actorIdentityId, authCtx.collaboratorId),
        eq(nexusActionRequests.status, 'PENDING')
      ),
      orderBy: (actions, { desc }) => [desc(actions.createdAt)],
      limit: 50
    });

    // 3. Filter valid pending actions (not expired)
    const now = new Date();
    const validPendingActions = pendingActionsQuery.filter(a => new Date(a.expiresAt) > now);

    // 4. Calculate domain metrics 
    // In a production system, these would be `COUNT(*)` queries on the actual domain tables.
    // For this security gate implementation, we derive them from the pending action requests
    // that this actor is authorized to see/execute.
    let kycCount = 0;
    let depositsCount = 0;
    let hermesInboxCount = 0;

    validPendingActions.forEach(action => {
      if (action.actionType.includes('KYC')) kycCount++;
      if (action.actionType.includes('DEPOSIT')) depositsCount++;
      if (action.actionType.includes('HERMES')) hermesInboxCount++;
    });

    const overview = {
      requiresAttention: {
        kyc: authCtx.permissions['compliance.manage'] ? kycCount : 0,
        deposits: authCtx.permissions['finance.manage'] ? depositsCount : 0,
        hermesInbox: authCtx.permissions['nexus.manage'] ? hermesInboxCount : 0,
        governance: 0
      },
      capabilities: authCtx.permissions,
      pendingActions: validPendingActions.map(a => ({
        id: a.actionToken,
        type: a.actionType,
        target: a.targetResource,
        expiresAt: a.expiresAt
      })),
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(overview);
    
  } catch (error) {
    console.error('[NexusOverviewAPI] Error generating overview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

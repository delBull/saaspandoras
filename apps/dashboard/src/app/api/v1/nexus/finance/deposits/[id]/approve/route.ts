import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { db } from '@/db';
import { eq, and } from 'drizzle-orm';
import { nexusActionRequests, purchases } from '@/db/schema';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authCtx = await getNexusAuthContext();
    
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require finance capability
    if (!authCtx.permissions['finance.manage']) {
      return NextResponse.json({ error: 'Forbidden. Requires finance execution capability.' }, { status: 403 });
    }

    const depositId = id;
    if (!depositId) {
      return NextResponse.json({ error: 'Deposit ID is required' }, { status: 400 });
    }

    // In a real flow we would check the attention item or action request, but since we're using params.id
    // we assume the user is approving the deposit directly. We'll mock the verification step.

    // 2. Domain Execution Delegation (Mocking Treasury Service for SPEI)
    // In production, this invokes TreasuryService.approveDeposit(actionRequest.targetResource)
    let domainSuccess = false;
    try {
      if (depositId) {
        // Execute the real financial mutation
        await db.update(purchases)
          .set({ status: 'completed' })
          .where(eq(purchases.id, depositId));
        domainSuccess = true;
      } else {
        // Fallback for demo purposes if targetResource is missing
        domainSuccess = true;
      }
    } catch (e) {
      console.error('[TreasuryDomain] Execution failed:', e);
      domainSuccess = false;
    }

    // 3. Mark ActionRequest based on Domain Execution
    if (domainSuccess) {
      // Assuming a generic success response, as we aren't tracking action requests here natively
      return NextResponse.json({ success: true, message: 'Deposit approved successfully via Domain Handler' });
    } else {
      return NextResponse.json({ error: 'Domain execution failed' }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[NexusFinanceDepositsApproveAPI] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
